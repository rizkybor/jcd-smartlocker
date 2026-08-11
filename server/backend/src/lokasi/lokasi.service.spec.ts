import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LokasiService } from './lokasi.service';
import type { PrismaService } from '../prisma/prisma.service';

const wilayah = {
  provinsiKode: '31',
  provinsiNama: 'DKI Jakarta',
  kabupatenKode: '31.71',
  kabupatenNama: 'Jakarta Selatan',
  kecamatanKode: '31.71.01',
  kecamatanNama: 'Kecamatan A',
  kelurahanKode: '31.71.01.1001',
  kelurahanNama: 'Kelurahan A',
};

describe('LokasiService', () => {
  function buildService(opts: { existingLokasi?: unknown } = {}) {
    const lokasiCreate = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'lokasi-new', ...data }));
    const lokasiFindUnique = jest.fn().mockResolvedValue(opts.existingLokasi !== undefined ? opts.existingLokasi : { id: 'lokasi-1' });
    const prisma = {
      db: { lokasi: { create: lokasiCreate, findUnique: lokasiFindUnique, update: jest.fn() } },
    } as unknown as PrismaService;
    return { service: new LokasiService(prisma), lokasiCreate, lokasiFindUnique };
  }

  describe('create — validasi timezone', () => {
    it('lempar BadRequestException TIMEZONE_TIDAK_DIKENAL kalau timezone bukan IANA valid', async () => {
      const { service } = buildService();

      await expect(
        service.create({ nama: 'X', alamat: 'Y', timezone: 'Bukan/Timezone', wilayah }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('simpan field wilayah apa adanya bersama nama/alamat/timezone', async () => {
      const { service, lokasiCreate } = buildService();

      await service.create({ nama: 'Lokasi X', alamat: 'Jl. X', timezone: 'Asia/Jakarta', wilayah });

      expect(lokasiCreate).toHaveBeenCalledWith({
        data: { nama: 'Lokasi X', alamat: 'Jl. X', timezone: 'Asia/Jakarta', ...wilayah },
      });
    });
  });

  describe('resolveOrCreateLokasi — reuse existing vs buat baru', () => {
    it('reuse Lokasi existing kalau lokasiId dikirim', async () => {
      const { service, lokasiFindUnique } = buildService({ existingLokasi: { id: 'lokasi-existing' } });

      const result = await service.resolveOrCreateLokasi({ lokasiId: 'lokasi-existing' });

      expect(lokasiFindUnique).toHaveBeenCalledWith({ where: { id: 'lokasi-existing' } });
      expect(result).toEqual({ id: 'lokasi-existing' });
    });

    it('lempar NotFoundException kalau lokasiId dikirim tapi tidak ketemu', async () => {
      const { service } = buildService({ existingLokasi: null });

      await expect(service.resolveOrCreateLokasi({ lokasiId: 'lokasi-x' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('buat Lokasi baru kalau lokasiBaru dikirim (bukan lokasiId)', async () => {
      const { service, lokasiCreate } = buildService();

      const result = await service.resolveOrCreateLokasi({
        lokasiBaru: { nama: 'Lokasi Baru', alamat: 'Jl. Baru', timezone: 'Asia/Jakarta', wilayah },
      });

      expect(lokasiCreate).toHaveBeenCalled();
      expect(result.id).toBe('lokasi-new');
    });
  });
});
