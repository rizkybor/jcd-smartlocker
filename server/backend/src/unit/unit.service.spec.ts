import { NotFoundException } from '@nestjs/common';
import { AkunInternalRole, LokerStatus, StatusBayar } from '@prisma/client';
import { UnitService } from './unit.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ActivityLogService } from '../activity-log/activity-log.service';
import type { MqttClientService } from '../gateway/mqtt-client.service';
import type { AuthenticatedInternalUser } from '../auth/types';

/**
 * Fitur overdue/denda/suspend (di luar cakupan PRD awal — permintaan bisnis
 * langsung): bukaLokerSuspended() adalah SATU-SATUNYA jalur buka loker
 * setelah keterlambatan >= 24 jam, dan HARUS benar-benar publish MQTT
 * (bukan cuma log seperti bukaPaksa()) karena tidak ada staf yang sudah
 * buka manual di kasus ini.
 */
describe('UnitService.bukaLokerSuspended', () => {
  const actor: AuthenticatedInternalUser = {
    kind: 'internal',
    id: 'admin-1',
    supabaseAuthUid: 'uid-1',
    email: 'admin@b.com',
    nama: 'Super Admin',
    role: AkunInternalRole.SUPER_ADMIN,
  };

  const durasiHargaUnit = [{ harga: 5_000, durasiJam: 1, aktif: true }];

  function buildService(opts: {
    loker?: Record<string, unknown> | null;
    sesi?: Record<string, unknown> | null;
  } = {}) {
    const loker =
      opts.loker !== undefined
        ? opts.loker
        : { id: 'loker-1', nomorLoker: '01', unit: { kodeUnit: 'UNIT-01' } };

    const updateLoker = jest.fn().mockResolvedValue({});
    const logActivity = jest.fn().mockResolvedValue({});
    const sesiFindFirst = jest.fn().mockResolvedValue(opts.sesi);
    const prisma = {
      db: {
        loker: { findFirst: jest.fn().mockResolvedValue(loker), update: updateLoker },
        sesiTransaksi: { findFirst: sesiFindFirst },
      },
    } as unknown as PrismaService;
    const activityLog = { log: logActivity } as unknown as ActivityLogService;
    const mqttClient = { publishPerintahBukaPintu: jest.fn() } as unknown as MqttClientService;

    return { service: new UnitService(prisma, activityLog, mqttClient), updateLoker, logActivity, mqttClient, sesiFindFirst };
  }

  /** -30 menit dari batas jam genap, supaya tidak flaky di sekitar boundary Math.ceil() saat test dijalankan. */
  function sesiOverdue(jamOverdue: number) {
    return {
      id: 'sesi-1',
      waktuSelesai: new Date(Date.now() - (jamOverdue * 60 - 30) * 60 * 1000),
      unitDurasiHarga: { unit: { durasiHarga: durasiHargaUnit } },
    };
  }

  it('lempar NotFoundException kalau loker tidak ditemukan di unit ini', async () => {
    const { service } = buildService({ loker: null });

    await expect(
      service.bukaLokerSuspended('unit-1', { lokerId: 'loker-x', alasan: 'test' }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lempar NotFoundException kalau tidak ada sesi aktif pada loker ini', async () => {
    const { service } = buildService({ sesi: null });

    await expect(
      service.bukaLokerSuspended('unit-1', { lokerId: 'loker-1', alasan: 'test' }, actor),
    ).rejects.toMatchObject({ response: { error: { code: 'SESI_TIDAK_DITEMUKAN' } } });
  });

  it('lempar ConflictException LOKER_BELUM_DISUSPEND kalau overdue belum 24 jam', async () => {
    const { service, mqttClient } = buildService({ sesi: sesiOverdue(3) });

    await expect(
      service.bukaLokerSuspended('unit-1', { lokerId: 'loker-1', alasan: 'test' }, actor),
    ).rejects.toMatchObject({ response: { error: { code: 'LOKER_BELUM_DISUSPEND' } } });
    expect(mqttClient.publishPerintahBukaPintu).not.toHaveBeenCalled();
  });

  it('publish MQTT, set loker TERSEDIA, & catat activity log kalau memang sudah suspend (>= 24 jam)', async () => {
    const { service, mqttClient, updateLoker, logActivity } = buildService({ sesi: sesiOverdue(30) });

    const result = await service.bukaLokerSuspended('unit-1', { lokerId: 'loker-1', alasan: 'Penyewa hubungi CS' }, actor);

    expect(mqttClient.publishPerintahBukaPintu).toHaveBeenCalledWith('UNIT-01', '01', 'sesi-1');
    expect(updateLoker).toHaveBeenCalledWith({ where: { id: 'loker-1' }, data: { status: LokerStatus.TERSEDIA } });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        aktorId: 'admin-1',
        aksi: 'buka_loker_suspend',
        detail: expect.objectContaining({ alasan: 'Penyewa hubungi CS', sesiTransaksiId: 'sesi-1' }),
      }),
    );
    expect(result).toEqual({ triggered: true, jamTerlambat: 30 });
  });

  it('sesi query di-scope ke statusBayar PAID & loker TERISI (tidak asal ambil sesi manapun di loker itu)', async () => {
    const { service, sesiFindFirst } = buildService({ sesi: sesiOverdue(25) });

    await service.bukaLokerSuspended('unit-1', { lokerId: 'loker-1', alasan: 'x' }, actor);

    expect(sesiFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { lokerId: 'loker-1', statusBayar: StatusBayar.PAID, loker: { status: LokerStatus.TERISI } },
      }),
    );
  });
});

describe('UnitService.findOneOrThrow — sisipkan overdueStatus per loker', () => {
  const durasiHargaUnit = [{ harga: 5_000, durasiJam: 1, aktif: true }];

  function buildService(opts: {
    unit?: Record<string, unknown> | null;
    sesiAktifList?: { lokerId: string; waktuSelesai: Date | null }[];
  }) {
    const unitFindUnique = jest.fn().mockResolvedValue(
      opts.unit !== undefined
        ? opts.unit
        : {
            id: 'unit-1',
            unitKey: 'rahasia',
            durasiHarga: durasiHargaUnit,
            lokers: [
              { id: 'loker-tersedia', status: LokerStatus.TERSEDIA },
              { id: 'loker-terisi-ontime', status: LokerStatus.TERISI },
              { id: 'loker-terisi-overdue', status: LokerStatus.TERISI },
            ],
          },
    );
    const sesiFindMany = jest.fn().mockResolvedValue(opts.sesiAktifList ?? []);
    const riwayatFindMany = jest.fn().mockResolvedValue([]);

    const prisma = {
      db: {
        unit: { findUnique: unitFindUnique },
        sesiTransaksi: {
          findMany: jest.fn().mockImplementation((args: { where?: { lokerId?: unknown } }) => {
            // Panggilan pertama (di lokersDenganOverdueStatus) scoped ke lokerId,
            // panggilan riwayat (loker.unitId) tidak — bedakan lewat shape where.
            return args.where && 'lokerId' in args.where ? sesiFindMany() : riwayatFindMany();
          }),
        },
      },
    } as unknown as PrismaService;

    return { service: new UnitService(prisma, {} as ActivityLogService, {} as MqttClientService) };
  }

  it('loker TERSEDIA -> overdueStatus null (tidak ada sesi aktif untuk dicek)', async () => {
    const { service } = buildService({});

    const result = await service.findOneOrThrow('unit-1');

    const loker = result.lokers.find((l) => l.id === 'loker-tersedia')!;
    expect(loker.overdueStatus).toBeNull();
  });

  it('loker TERISI tapi belum lewat waktuSelesai -> overdueStatus.overdue = false', async () => {
    const { service } = buildService({
      sesiAktifList: [{ lokerId: 'loker-terisi-ontime', waktuSelesai: new Date(Date.now() + 60 * 60 * 1000) }],
    });

    const result = await service.findOneOrThrow('unit-1');

    const loker = result.lokers.find((l) => l.id === 'loker-terisi-ontime')!;
    expect(loker.overdueStatus).toMatchObject({ overdue: false, suspended: false });
  });

  it('loker TERISI terlambat >= 24 jam -> overdueStatus.suspended = true', async () => {
    const { service } = buildService({
      sesiAktifList: [{ lokerId: 'loker-terisi-overdue', waktuSelesai: new Date(Date.now() - 30 * 60 * 60 * 1000) }],
    });

    const result = await service.findOneOrThrow('unit-1');

    const loker = result.lokers.find((l) => l.id === 'loker-terisi-overdue')!;
    expect(loker.overdueStatus).toMatchObject({ overdue: true, suspended: true });
  });

  it('lempar NotFoundException kalau unit tidak ditemukan', async () => {
    const { service } = buildService({ unit: null });

    await expect(service.findOneOrThrow('unit-x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
