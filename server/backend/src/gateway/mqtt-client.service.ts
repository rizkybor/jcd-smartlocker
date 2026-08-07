import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { type MqttClient } from 'mqtt';
import { LokerStatus } from '@prisma/client';
import type { EnvConfig } from '../config/env.validation';
import { GatewayService } from './gateway.service';

const STATUS_LOKER_VALUES = new Set(Object.values(LokerStatus).map((s) => s.toLowerCase()));

/**
 * Subscriber MQTT (docs/API-Contract-Smartbox.md §4.1, SMB-506). Broker
 * tidak wajib hidup untuk backend tetap boot — koneksi gagal/putus cuma
 * di-log & di-retry otomatis (bawaan `mqtt.js`, `reconnectPeriod`), bukan
 * exception yang menjatuhkan aplikasi (unit yang statusnya cuma "belum
 * pernah lapor" tidak boleh membuat backend ikut down).
 */
@Injectable()
export class MqttClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttClientService.name);
  private client?: MqttClient;

  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly gatewayService: GatewayService,
  ) {}

  onModuleInit() {
    const url = this.config.get('MQTT_BROKER_URL', { infer: true });
    const username = this.config.get('MQTT_USERNAME', { infer: true });
    const password = this.config.get('MQTT_PASSWORD', { infer: true });

    this.client = mqtt.connect(url, {
      username,
      password,
      reconnectPeriod: 5_000,
      connectTimeout: 10_000,
    });

    this.client.on('connect', () => {
      this.logger.log(`MQTT terhubung ke ${url}`);
      this.client!.subscribe(
        ['unit/+/heartbeat', 'unit/+/loker/+/status', 'unit/+/pintu/+/event', 'unit/+/perintah/ack'],
        { qos: 1 },
      );
    });

    this.client.on('error', (err) => {
      this.logger.warn(`MQTT error: ${err.message}`);
    });

    this.client.on('message', (topic, payload) => this.handleMessage(topic, payload));
  }

  async onModuleDestroy() {
    await this.client?.endAsync();
  }

  /** Publish perintah ke gateway (§4.1) — fire-and-forget, TIDAK menunggu ack (lihat catatan di kiosk-sewa.service.ts/kiosk-ambil.service.ts). */
  publishPerintahBukaPintu(kodeUnit: string, nomorLoker: string, sesiId: string) {
    if (!this.client?.connected) {
      this.logger.warn(`MQTT tidak terhubung — perintah buka_pintu unit ${kodeUnit} tidak terkirim.`);
      return;
    }
    this.client.publish(
      `unit/${kodeUnit}/perintah`,
      JSON.stringify({ aksi: 'buka_pintu', loker: nomorLoker, sesi_id: sesiId }),
      { qos: 1 },
    );
  }

  private handleMessage(topic: string, payload: Buffer) {
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(payload.toString());
    } catch {
      this.logger.warn(`Payload MQTT bukan JSON valid di topik ${topic}, diabaikan.`);
      return;
    }

    const heartbeat = topic.match(/^unit\/([^/]+)\/heartbeat$/);
    if (heartbeat) {
      this.gatewayService.recordHeartbeat(heartbeat[1]);
      return;
    }

    const lokerStatus = topic.match(/^unit\/([^/]+)\/loker\/([^/]+)\/status$/);
    if (lokerStatus) {
      const status = String(body.status ?? '').toLowerCase();
      if (!STATUS_LOKER_VALUES.has(status)) {
        this.logger.warn(`Status loker tidak dikenal "${body.status}" di topik ${topic}, diabaikan.`);
        return;
      }
      const enumKey = Object.entries(LokerStatus).find(([, v]) => v === status)?.[0] as
        | keyof typeof LokerStatus
        | undefined;
      if (enumKey) {
        void this.gatewayService.syncStatusLoker(lokerStatus[1], lokerStatus[2], LokerStatus[enumKey]);
      }
      return;
    }

    const pintuEvent = topic.match(/^unit\/([^/]+)\/pintu\/([^/]+)\/event$/);
    if (pintuEvent) {
      const event = body.event as 'terbuka' | 'tertutup' | 'macet' | undefined;
      if (event === 'terbuka' || event === 'tertutup' || event === 'macet') {
        this.gatewayService.handlePintuEvent(pintuEvent[1], pintuEvent[2], event);
      }
      return;
    }

    const ack = topic.match(/^unit\/([^/]+)\/perintah\/ack$/);
    if (ack) {
      const sesiId = String(body.sesi_id ?? '');
      const hasil = body.hasil === 'sukses' ? 'sukses' : 'gagal';
      this.gatewayService.handlePerintahAck(ack[1], sesiId, hasil, body.alasan as string | undefined);
    }
  }
}
