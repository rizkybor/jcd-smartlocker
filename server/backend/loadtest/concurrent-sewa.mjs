#!/usr/bin/env node
/**
 * SMB-1106 — uji beban dasar endpoint publik kiosk: concurrent sewa di
 * banyak unit sekaligus (PRD §11). Fokus utama: buktikan assign loker
 * atomik (`FOR UPDATE SKIP LOCKED`, kiosk-sewa.service.ts::mulaiSewa())
 * benar-benar mencegah dua request dapat loker yang sama SAAT konkurensi
 * sungguhan — sesuatu yang unit test bermock Prisma (SMB-1101) TIDAK bisa
 * buktikan sepenuhnya, cuma bisa verifikasi bentuk kode.
 *
 * PERINGATAN: script ini BENAR-BENAR memanggil endpoint kiosk live dan
 * MEMBUAT SesiTransaksi + menghabiskan loker TERSEDIA sungguhan. Jangan
 * jalankan sembarangan ke database yang dipakai orang lain — pakai project
 * Supabase dev/lokal, bukan staging/production. Loker yang terpakai
 * script ini TIDAK di-reset otomatis (butuh reset manual/re-seed kalau
 * mau ulang).
 *
 * Cara pakai:
 *   node loadtest/concurrent-sewa.mjs
 *   LOADTEST_API_BASE_URL=http://localhost:3000 LOADTEST_UNIT_LIMIT=3 node loadtest/concurrent-sewa.mjs
 *
 * Unit target diambil otomatis dari DB (unit aktif, ada loker TERSEDIA &
 * durasiHarga aktif) via Prisma langsung — unitKey TIDAK PERNAH terekspos
 * lewat API manapun (§7.1), jadi load test yang butuh header X-Unit-Key
 * sungguhan harus baca langsung dari DB seperti ini, bukan lewat HTTP.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const API_BASE_URL = process.env.LOADTEST_API_BASE_URL ?? 'http://localhost:3000';
const UNIT_LIMIT = Number(process.env.LOADTEST_UNIT_LIMIT ?? 3);
// Sengaja LEBIH BANYAK dari jumlah loker TERSEDIA per unit — race yang
// diuji justru terjadi saat request > kapasitas (sebagian HARUS kalah
// dengan LOKER_TIDAK_TERSEDIA, bukan dobel-assign loker yang sama).
const OVERSUBSCRIBE_EXTRA = Number(process.env.LOADTEST_OVERSUBSCRIBE_EXTRA ?? 5);

function randomNomorHp() {
  return `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;
}

async function mulaiSewa(unitKey, unitDurasiHargaId) {
  const start = performance.now();
  try {
    const res = await fetch(`${API_BASE_URL}/kiosk/sewa/mulai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Unit-Key': unitKey },
      body: JSON.stringify({
        nomorHp: randomNomorHp(),
        email: `loadtest+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        unitDurasiHargaId,
      }),
    });
    const body = await res.json().catch(() => null);
    const latencyMs = performance.now() - start;
    if (res.ok) return { outcome: 'sukses', latencyMs, sesiId: body?.data?.id };
    return { outcome: body?.error?.code ?? `HTTP_${res.status}`, latencyMs };
  } catch (err) {
    return { outcome: 'NETWORK_ERROR', latencyMs: performance.now() - start, detail: err.message };
  }
}

function percentile(sortedMs, p) {
  if (sortedMs.length === 0) return 0;
  const idx = Math.min(sortedMs.length - 1, Math.ceil((p / 100) * sortedMs.length) - 1);
  return Math.round(sortedMs[idx]);
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000 });
  const prisma = new PrismaClient({ adapter });

  const units = await prisma.unit.findMany({
    where: { aktif: true, deletedAt: null, lokers: { some: { status: 'TERSEDIA', deletedAt: null } } },
    take: UNIT_LIMIT,
    include: {
      lokers: { where: { status: 'TERSEDIA', deletedAt: null } },
      durasiHarga: { where: { aktif: true }, take: 1 },
    },
  });

  const targets = units.filter((u) => u.durasiHarga.length > 0);
  if (targets.length === 0) {
    console.log('Tidak ada unit aktif dengan loker TERSEDIA + durasiHarga aktif untuk load test. Seed data dulu.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Uji beban: ${targets.length} unit, target ${API_BASE_URL}`);
  console.log('---');

  let totalSukses = 0;
  let totalKalahRace = 0;
  let totalErrorLain = 0;
  const allLatencies = [];

  for (const unit of targets) {
    const jumlahTersedia = unit.lokers.length;
    const jumlahRequest = jumlahTersedia + OVERSUBSCRIBE_EXTRA;
    const durasiHargaId = unit.durasiHarga[0].id;

    const hasil = await Promise.all(
      Array.from({ length: jumlahRequest }, () => mulaiSewa(unit.unitKey, durasiHargaId)),
    );

    const sukses = hasil.filter((r) => r.outcome === 'sukses');
    const kalahRace = hasil.filter((r) => r.outcome === 'LOKER_TIDAK_TERSEDIA');
    const errorLain = hasil.filter((r) => r.outcome !== 'sukses' && r.outcome !== 'LOKER_TIDAK_TERSEDIA');
    const sesiIdSet = new Set(sukses.map((r) => r.sesiId));

    totalSukses += sukses.length;
    totalKalahRace += kalahRace.length;
    totalErrorLain += errorLain.length;
    allLatencies.push(...hasil.map((r) => r.latencyMs));

    const dobelAssign = sukses.length !== sesiIdSet.size;
    console.log(
      `${unit.kodeUnit}: ${jumlahRequest} request (${jumlahTersedia} loker tersedia) -> ` +
        `${sukses.length} sukses, ${kalahRace.length} kalah race (wajar), ${errorLain.length} error lain` +
        (dobelAssign ? '  ⚠️  DOBEL ASSIGN LOKER TERDETEKSI — BUG ATOMICITY!' : ''),
    );
    if (errorLain.length > 0) {
      const contoh = [...new Set(errorLain.map((r) => r.outcome))];
      console.log(`  error lain (kode unik): ${contoh.join(', ')}`);
    }
  }

  allLatencies.sort((a, b) => a - b);
  console.log('---');
  console.log(`Total: ${totalSukses} sukses, ${totalKalahRace} kalah race (wajar), ${totalErrorLain} error lain`);
  console.log(
    `Latensi mulaiSewa: p50=${percentile(allLatencies, 50)}ms p95=${percentile(allLatencies, 95)}ms p99=${percentile(allLatencies, 99)}ms max=${Math.round(allLatencies.at(-1) ?? 0)}ms`,
  );
  if (totalErrorLain > 0) {
    console.log('\n⚠️  Ada error di luar LOKER_TIDAK_TERSEDIA — cek log backend untuk detail.');
    process.exitCode = 1;
  } else {
    console.log('\n✅  Tidak ada dobel-assign loker & tidak ada error tak terduga.');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Load test gagal:', err);
  process.exitCode = 1;
});
