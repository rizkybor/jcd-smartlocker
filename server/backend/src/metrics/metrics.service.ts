import { Injectable } from '@nestjs/common';
import { Registry, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * Registry Prometheus terpisah (bukan register global prom-client) supaya
 * tidak bentrok kalau modul lain ikut import prom-client (SMB-902,
 * docs/PRD-Smartbox.md §9.4).
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequestDuration = new Histogram({
    name: 'smartbox_http_request_duration_seconds',
    help: 'Durasi request HTTP backend Smartbox dalam detik',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry, prefix: 'smartbox_' });
  }
}
