import { mulaiSewaSchema } from './mulai-sewa.dto';
import { ambilMulaiSchema } from './ambil-mulai.dto';
import { nomorHpSchema } from './nomor-hp.dto';
import { verifikasiOtpSchema, sesiIdSchema } from './verifikasi-otp.dto';

/**
 * SMB-1101 — validasi format nomor HP (§5.1 langkah 3) dipakai berulang di
 * 3 DTO berbeda; kode OTP & UUID juga aturan tetap yang gampang salah kalau
 * di-refactor tanpa test.
 */
describe('nomorHp regex (dipakai di mulaiSewaSchema, ambilMulaiSchema, nomorHpSchema)', () => {
  const validCases = ['081234567890', '0812345678', '08123456789012345'.slice(0, 15)];
  const invalidCases = [
    '081234567', // 9 digit -> total 9, kurang dari minimum 10
    '6281234567890', // tidak diawali 08
    '+6281234567890', // pakai +62
    '0812-3456-7890', // ada karakter non-digit
    '',
  ];

  const schemas: [string, { safeParse: (v: unknown) => { success: boolean } }][] = [
    ['mulaiSewaSchema', mulaiSewaSchema.pick({ nomorHp: true })],
    ['ambilMulaiSchema', ambilMulaiSchema],
    ['nomorHpSchema', nomorHpSchema],
  ];

  for (const [name, schema] of schemas) {
    describe(name, () => {
      for (const nomorHp of validCases) {
        it(`menerima nomor valid: ${nomorHp}`, () => {
          expect(schema.safeParse({ nomorHp }).success).toBe(true);
        });
      }
      for (const nomorHp of invalidCases) {
        it(`menolak nomor tidak valid: "${nomorHp}"`, () => {
          expect(schema.safeParse({ nomorHp }).success).toBe(false);
        });
      }
    });
  }
});

describe('mulaiSewaSchema', () => {
  const valid = { nomorHp: '081234567890', email: 'user@example.com', unitDurasiHargaId: '123e4567-e89b-12d3-a456-426614174000' };

  it('menerima payload lengkap yang valid', () => {
    expect(mulaiSewaSchema.safeParse(valid).success).toBe(true);
  });

  it('menolak email dengan format tidak valid', () => {
    expect(mulaiSewaSchema.safeParse({ ...valid, email: 'bukan-email' }).success).toBe(false);
  });

  it('menolak unitDurasiHargaId yang bukan UUID', () => {
    expect(mulaiSewaSchema.safeParse({ ...valid, unitDurasiHargaId: 'bukan-uuid' }).success).toBe(false);
  });

  it('menolak payload tanpa email (email wajib sementara channel WhatsApp belum aktif)', () => {
    const { email: _email, ...withoutEmail } = valid;
    expect(mulaiSewaSchema.safeParse(withoutEmail).success).toBe(false);
  });
});

describe('verifikasiOtpSchema', () => {
  const sesiId = '123e4567-e89b-12d3-a456-426614174000';

  it('menerima kode OTP 6 digit dengan sesiId UUID valid', () => {
    expect(verifikasiOtpSchema.safeParse({ sesiId, kode: '123456' }).success).toBe(true);
  });

  it('menolak kode OTP kurang dari 6 digit', () => {
    expect(verifikasiOtpSchema.safeParse({ sesiId, kode: '12345' }).success).toBe(false);
  });

  it('menolak kode OTP lebih dari 6 digit', () => {
    expect(verifikasiOtpSchema.safeParse({ sesiId, kode: '1234567' }).success).toBe(false);
  });

  it('menolak kode OTP yang mengandung karakter non-digit', () => {
    expect(verifikasiOtpSchema.safeParse({ sesiId, kode: '12a456' }).success).toBe(false);
  });

  it('menolak sesiId yang bukan UUID', () => {
    expect(sesiIdSchema.safeParse({ sesiId: 'bukan-uuid' }).success).toBe(false);
  });
});
