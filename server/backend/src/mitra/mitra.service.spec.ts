import { ConflictException } from '@nestjs/common';
import { MitraService } from './mitra.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { SupabaseService } from '../supabase/supabase.service';
import type { LokasiService } from '../lokasi/lokasi.service';
import type { CreateMitraDto } from './dto/create-mitra.dto';

/**
 * Fitur "buat mitra + lokasi + akun login sekaligus" (di luar cakupan PRD
 * awal — permintaan bisnis langsung). Logika paling berisiko: (1) Lokasi
 * boleh reuse existing atau dibuat baru lewat `LokasiService`, (2) email
 * akun mitra WAJIB unik lintas mitra, (3) akun Supabase Auth + AkunMitra +
 * AkunMitraLokasi harus dibuat konsisten dengan lokasi yang dipakai.
 */
describe('MitraService.create', () => {
  const dtoDenganLokasiBaru: CreateMitraDto = {
    nama: 'Mitra Baru',
    kontak: '08123',
    tipeSkema: 'FIXED_RENTAL' as never,
    akunMitra: { nama: 'PIC Mitra', email: 'pic@mitra.test', password: 'password123' },
    lokasiBaru: {
      nama: 'Lokasi Baru',
      alamat: 'Jl. Baru',
      timezone: 'Asia/Jakarta',
      wilayah: {
        provinsiKode: '31',
        provinsiNama: 'DKI Jakarta',
        kabupatenKode: '31.71',
        kabupatenNama: 'Jakarta Selatan',
        kecamatanKode: '31.71.01',
        kecamatanNama: 'Kecamatan A',
        kelurahanKode: '31.71.01.1001',
        kelurahanNama: 'Kelurahan A',
      },
    },
  } as CreateMitraDto;

  function buildService(opts: { emailSudahAda?: boolean; resolvedLokasi?: { id: string } } = {}) {
    const mitraCreate = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: 'mitra-1', ...data, mitraLokasi: [{ lokasiId: data.mitraLokasi.create.lokasiId }] }),
    );
    const akunMitraCreate = jest.fn().mockResolvedValue({ id: 'akun-1' });
    const akunMitraFindUnique = jest.fn().mockResolvedValue(opts.emailSudahAda ? { id: 'akun-lain' } : null);
    const mitraFindUnique = jest.fn().mockResolvedValue({ id: 'mitra-1', mitraLokasi: [] });

    const prisma = {
      db: {
        mitra: { create: mitraCreate, findUnique: mitraFindUnique },
        akunMitra: { create: akunMitraCreate, findUnique: akunMitraFindUnique },
      },
    } as unknown as PrismaService;

    const supabase = {
      createAuthUserWithPassword: jest.fn().mockResolvedValue({ id: 'auth-uid-1' }),
    } as unknown as SupabaseService;

    const lokasiService = {
      resolveOrCreateLokasi: jest.fn().mockResolvedValue(opts.resolvedLokasi ?? { id: 'lokasi-1' }),
    } as unknown as LokasiService;

    return {
      service: new MitraService(prisma, supabase, lokasiService),
      prisma,
      supabase,
      lokasiService,
      mitraCreate,
      akunMitraCreate,
      akunMitraFindUnique,
    };
  }

  it('lempar ConflictException EMAIL_SUDAH_DIPAKAI kalau email akun mitra sudah dipakai', async () => {
    const { service } = buildService({ emailSudahAda: true });

    await expect(service.create(dtoDenganLokasiBaru)).rejects.toBeInstanceOf(ConflictException);
  });

  it('resolve/buat Lokasi lewat LokasiService, bukan query manual', async () => {
    const { service, lokasiService } = buildService();

    await service.create(dtoDenganLokasiBaru);

    expect(lokasiService.resolveOrCreateLokasi).toHaveBeenCalledWith(dtoDenganLokasiBaru);
  });

  it('buat Mitra dengan mitraLokasi ke lokasi yang di-resolve, tipeSkema dari dto', async () => {
    const { service, mitraCreate } = buildService({ resolvedLokasi: { id: 'lokasi-xyz' } });

    await service.create(dtoDenganLokasiBaru);

    expect(mitraCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nama: 'Mitra Baru',
          mitraLokasi: { create: { lokasiId: 'lokasi-xyz', tipeSkema: 'FIXED_RENTAL' } },
        }),
      }),
    );
  });

  it('buat akun Supabase Auth DENGAN password (bukan invite-only)', async () => {
    const { service, supabase } = buildService();

    await service.create(dtoDenganLokasiBaru);

    expect(supabase.createAuthUserWithPassword).toHaveBeenCalledWith('pic@mitra.test', 'password123');
  });

  it('buat AkunMitra terikat ke mitra & auth uid yang benar, plus akses ke lokasi yang di-resolve', async () => {
    const { service, akunMitraCreate } = buildService({ resolvedLokasi: { id: 'lokasi-xyz' } });

    await service.create(dtoDenganLokasiBaru);

    expect(akunMitraCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mitraId: 'mitra-1',
          supabaseAuthUid: 'auth-uid-1',
          email: 'pic@mitra.test',
          aksesLokasi: { create: { lokasiId: 'lokasi-xyz' } },
        }),
      }),
    );
  });
});
