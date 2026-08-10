import { computeOverdueStatus, tarifPerJamTermurah } from './overdue.util';

describe('tarifPerJamTermurah', () => {
  it('pilih tarif dengan rate per jam TERENDAH, bukan harga absolut terendah', () => {
    // 1 jam = Rp5.000 (rate 5.000/jam) vs 6 jam = Rp24.000 (rate 4.000/jam) -> pilih yang 6 jam.
    const rate = tarifPerJamTermurah([
      { harga: 5_000, durasiJam: 1, aktif: true },
      { harga: 24_000, durasiJam: 6, aktif: true },
    ]);
    expect(rate).toBe(4_000);
  });

  it('abaikan tarif yang tidak aktif', () => {
    const rate = tarifPerJamTermurah([
      { harga: 1_000, durasiJam: 1, aktif: false }, // termurah tapi nonaktif
      { harga: 5_000, durasiJam: 1, aktif: true },
    ]);
    expect(rate).toBe(5_000);
  });

  it('null kalau tidak ada tarif aktif sama sekali', () => {
    expect(tarifPerJamTermurah([{ harga: 5_000, durasiJam: 1, aktif: false }])).toBeNull();
    expect(tarifPerJamTermurah([])).toBeNull();
  });
});

describe('computeOverdueStatus', () => {
  const tarifPerJam = 5_000;

  it('belum overdue kalau masih sebelum/tepat waktuSelesai', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    expect(computeOverdueStatus(waktuSelesai, tarifPerJam, new Date('2026-01-01T09:59:00Z'))).toEqual({
      overdue: false,
      suspended: false,
      jamTerlambat: 0,
      dendaNominal: 0,
    });
    expect(computeOverdueStatus(waktuSelesai, tarifPerJam, waktuSelesai)).toEqual({
      overdue: false,
      suspended: false,
      jamTerlambat: 0,
      dendaNominal: 0,
    });
  });

  it('belum overdue kalau waktuSelesai belum diset (sesi belum pernah dibuka)', () => {
    expect(computeOverdueStatus(null, tarifPerJam)).toEqual({
      overdue: false,
      suspended: false,
      jamTerlambat: 0,
      dendaNominal: 0,
    });
  });

  it('overdue 1 detik lewat -> tetap dibulatkan ke ATAS jadi 1 jam penuh', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T10:00:01Z');
    expect(computeOverdueStatus(waktuSelesai, tarifPerJam, now)).toEqual({
      overdue: true,
      suspended: false,
      jamTerlambat: 1,
      dendaNominal: 5_000,
    });
  });

  it('overdue 2 jam 15 menit -> dibulatkan ke atas jadi 3 jam, denda = 3 x tarif/jam', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T12:15:00Z');
    expect(computeOverdueStatus(waktuSelesai, tarifPerJam, now)).toEqual({
      overdue: true,
      suspended: false,
      jamTerlambat: 3,
      dendaNominal: 15_000,
    });
  });

  it('studi kasus dari permintaan: sewa 1 jam, telat 3 jam -> overdue, belum suspend, denda 3x tarif/jam', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T13:00:00Z');
    expect(computeOverdueStatus(waktuSelesai, tarifPerJam, now)).toEqual({
      overdue: true,
      suspended: false,
      jamTerlambat: 3,
      dendaNominal: 15_000,
    });
  });

  it('tepat 24 jam overdue -> SUDAH suspend (batas inklusif, bukan 24 jam lewat sedikit)', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-02T10:00:00Z');
    expect(computeOverdueStatus(waktuSelesai, tarifPerJam, now)).toEqual({
      overdue: true,
      suspended: true,
      jamTerlambat: 24,
      dendaNominal: 0,
    });
  });

  it('23 jam 59 menit overdue -> masih BELUM suspend (tepat di bawah ambang)', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-02T09:59:00Z');
    const result = computeOverdueStatus(waktuSelesai, tarifPerJam, now);
    expect(result.suspended).toBe(false);
    expect(result.overdue).toBe(true);
  });

  it('sudah suspend -> dendaNominal selalu 0 (tidak bisa bayar sendiri lagi, harus Super Admin)', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-05T10:00:00Z'); // jauh lewat 24 jam
    const result = computeOverdueStatus(waktuSelesai, tarifPerJam, now);
    expect(result.suspended).toBe(true);
    expect(result.dendaNominal).toBe(0);
  });

  it('tarifPerJam null (data tidak lengkap) -> denda 0, tidak error/NaN', () => {
    const waktuSelesai = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T13:00:00Z');
    const result = computeOverdueStatus(waktuSelesai, null, now);
    expect(result.dendaNominal).toBe(0);
    expect(Number.isNaN(result.dendaNominal)).toBe(false);
  });
});
