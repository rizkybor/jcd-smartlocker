/**
 * Bootstrap data demo lengkap SETELAH `prisma migrate reset` — dipakai
 * sekali di awal supaya app langsung bisa dieksplorasi end-to-end (dashboard
 * Company & Mitra bisa login, kiosk punya unit nyata untuk sewa/ambil/RFID)
 * tanpa harus klik-klik manual dari nol. Idempotent per akun (skip kalau
 * email sudah ada) — aman dijalankan ulang.
 *
 * Kredensial login (Super Admin & Mitra) dibaca dari `.env` (variabel
 * SEED_SUPER_ADMIN_... dan SEED_MITRA_...) — SENGAJA tidak pernah di-log ke
 * terminal di sini (§7.1, sama seperti seed.ts) — email boleh, password
 * tidak, karena sudah tersimpan di .env pengguna sendiri.
 *
 * Pakai: pnpm run seed:demo
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, AkunInternalRole, TipeSkema, ModePemakaian } from '@prisma/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function generateUnitKey(): string {
  return `uk_${randomBytes(24).toString('hex')}`;
}

/**
 * `unitKey` diperlakukan seperti secret (§7.1, schema.prisma) — SENGAJA
 * ditulis langsung ke `.env`, TIDAK PERNAH di-console.log, sama seperti
 * password Super Admin/Mitra di seed.ts.
 */
function upsertEnvVar(key: string, value: string) {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const next = regex.test(content) ? content.replace(regex, line) : `${content.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, next);
}

function nomorLokerFromIndex(index: number): string {
  return String(index + 1).padStart(3, '0');
}

/**
 * `prisma migrate reset` cuma mengosongkan tabel yang dikelola Prisma
 * (public schema) — `auth.users` Supabase Auth TIDAK ikut ter-reset (beda
 * schema, bukan tanggung jawab Prisma migrate). Jadi re-run seed setelah
 * reset sering ketemu email yang secara Auth masih terdaftar padahal baris
 * `akun_internal`/`akun_mitra`-nya sudah hilang — cari user Auth yang ada
 * lalu SINKRONKAN password-nya ke nilai `.env` saat ini (supaya kredensial
 * di .env selalu valid buat login), bukan gagal total.
 */
async function getOrCreateSupabaseUser(supabase: SupabaseClient, email: string, password: string) {
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (!created.error && created.data.user) return created.data.user;

  const sudahTerdaftar = created.error?.message?.toLowerCase().includes('already been registered');
  if (!sudahTerdaftar) {
    throw new Error(`Gagal membuat akun Supabase Auth untuk ${email}: ${created.error?.message ?? 'unknown error'}`);
  }

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Gagal mencari akun Supabase Auth existing untuk ${email}: ${error.message}`);
  const existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error(`Supabase bilang ${email} sudah terdaftar, tapi tidak ketemu di listUsers().`);

  const updated = await supabase.auth.admin.updateUserById(existing.id, { password });
  if (updated.error || !updated.data.user) {
    throw new Error(`Gagal sinkronkan password akun Supabase Auth existing ${email}: ${updated.error?.message ?? 'unknown error'}`);
  }
  return updated.data.user;
}

async function main() {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL;
  const superAdminNama = process.env.SEED_SUPER_ADMIN_NAMA;
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const mitraEmail = process.env.SEED_MITRA_EMAIL;
  const mitraNama = process.env.SEED_MITRA_NAMA;
  const mitraPassword = process.env.SEED_MITRA_PASSWORD;

  if (!superAdminEmail || !superAdminNama || !superAdminPassword) {
    throw new Error('SEED_SUPER_ADMIN_EMAIL/NAMA/PASSWORD belum lengkap di .env.');
  }
  if (!mitraEmail || !mitraNama || !mitraPassword) {
    throw new Error('SEED_MITRA_EMAIL/NAMA/PASSWORD belum lengkap di .env.');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set di .env.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000 });
  const prisma = new PrismaClient({ adapter });

  try {
    // --- 1. Super Admin (sama seperti seed.ts, diulang di sini supaya
    // seed:demo bisa dipakai sendirian setelah reset tanpa 2 langkah). ---
    let superAdmin = await prisma.akunInternal.findFirst({ where: { email: superAdminEmail } });
    if (!superAdmin) {
      console.log(`Membuat akun Super Admin ${superAdminEmail}...`);
      const authUser = await getOrCreateSupabaseUser(supabase, superAdminEmail, superAdminPassword);

      superAdmin = await prisma.akunInternal.create({
        data: { supabaseAuthUid: authUser.id, nama: superAdminNama, email: superAdminEmail, role: AkunInternalRole.SUPER_ADMIN },
      });
      console.log(`Super Admin dibuat: ${superAdmin.id}`);
    } else {
      console.log(`Super Admin ${superAdminEmail} sudah ada, lewati.`);
    }

    // --- 2. Lokasi + Mitra + skema revenue sharing 20% ---
    let lokasi = await prisma.lokasi.findFirst({ where: { nama: 'Mall Demo Jakarta' } });
    if (!lokasi) {
      lokasi = await prisma.lokasi.create({
        data: { nama: 'Mall Demo Jakarta', alamat: 'Jl. Contoh Raya No. 1, Jakarta Selatan', timezone: 'Asia/Jakarta' },
      });
      console.log(`Lokasi dibuat: ${lokasi.nama}`);
    }

    let mitra = await prisma.mitra.findFirst({ where: { nama: 'Mitra Demo Pertama' } });
    if (!mitra) {
      // bolehKelolaMember: true — supaya demo langsung bisa coba menu
      // "Member" di Dashboard Mitra tanpa langkah manual toggle Super Admin
      // dulu (§ fitur akses member RFID per-mitra, di luar cakupan PRD awal).
      mitra = await prisma.mitra.create({ data: { nama: 'Mitra Demo Pertama', kontak: '081200000000', bolehKelolaMember: true } });
      console.log(`Mitra dibuat: ${mitra.nama}`);
    }

    let mitraLokasi = await prisma.mitraLokasi.findFirst({ where: { mitraId: mitra.id, lokasiId: lokasi.id } });
    if (!mitraLokasi) {
      mitraLokasi = await prisma.mitraLokasi.create({
        data: { mitraId: mitra.id, lokasiId: lokasi.id, tipeSkema: TipeSkema.REVENUE_SHARING, persentaseAktif: 20 },
      });
      console.log('MitraLokasi (revenue sharing 20%) dibuat.');
    }

    // --- 3. Akun Mitra (login Dashboard Mitra) ---
    let akunMitra = await prisma.akunMitra.findFirst({ where: { email: mitraEmail } });
    if (!akunMitra) {
      console.log(`Membuat akun Mitra ${mitraEmail}...`);
      const authUser = await getOrCreateSupabaseUser(supabase, mitraEmail, mitraPassword);

      akunMitra = await prisma.akunMitra.create({
        data: { mitraId: mitra.id, supabaseAuthUid: authUser.id, nama: mitraNama, email: mitraEmail },
      });
      await prisma.akunMitraLokasi.create({ data: { akunMitraId: akunMitra.id, lokasiId: lokasi.id } });
      console.log(`Akun Mitra dibuat & diberi akses ke ${lokasi.nama}.`);
    } else {
      console.log(`Akun Mitra ${mitraEmail} sudah ada, lewati.`);
    }

    // --- 4. Unit kiosk demo — 2 kategori ukuran (Kecil/Besar), 5 loker ---
    let unit = await prisma.unit.findFirst({ where: { kodeUnit: 'KIOSK-DEMO-01' } });
    if (!unit) {
      const unitKey = generateUnitKey();
      unit = await prisma.unit.create({
        data: {
          lokasiId: lokasi.id,
          kodeUnit: 'KIOSK-DEMO-01',
          unitKey,
          varianKompartemen: 'Standar',
          jumlahLoker: 5,
          modePemakaian: ModePemakaian.BERBAYAR,
        },
      });

      const kategoriKecil = await prisma.lokerKategori.create({
        data: { unitId: unit.id, nama: 'Kecil', ukuranWMm: 300, ukuranHMm: 300 },
      });
      const kategoriBesar = await prisma.lokerKategori.create({
        data: { unitId: unit.id, nama: 'Besar', ukuranWMm: 400, ukuranHMm: 860 },
      });

      await prisma.loker.createMany({
        data: [
          ...Array.from({ length: 3 }, (_, i) => ({ unitId: unit!.id, lokerKategoriId: kategoriKecil.id, nomorLoker: nomorLokerFromIndex(i) })),
          ...Array.from({ length: 2 }, (_, i) => ({ unitId: unit!.id, lokerKategoriId: kategoriBesar.id, nomorLoker: nomorLokerFromIndex(3 + i) })),
        ],
      });

      await prisma.unitDurasiHarga.createMany({
        data: [
          { unitId: unit.id, lokerKategoriId: kategoriKecil.id, durasiJam: 1, harga: 5_000 },
          { unitId: unit.id, lokerKategoriId: kategoriKecil.id, durasiJam: 3, harga: 12_000 },
          { unitId: unit.id, lokerKategoriId: kategoriBesar.id, durasiJam: 1, harga: 8_000 },
          { unitId: unit.id, lokerKategoriId: kategoriBesar.id, durasiJam: 3, harga: 20_000 },
        ],
      });

      upsertEnvVar('SEED_KIOSK_DEMO_UNIT_KEY', unitKey);
      console.log(`Unit ${unit.kodeUnit} dibuat — 2 kategori, 5 loker.`);
      console.log('  X-Unit-Key ditulis ke .env sebagai SEED_KIOSK_DEMO_UNIT_KEY (bukan dicetak di sini) — salin ke client/kiosk/.env sebagai VITE_UNIT_KEY untuk coba kiosk lokal.');

      // --- 5. Contoh member RFID (fitur di luar cakupan PRD awal) ---
      const lokerEksklusif = await prisma.loker.findFirstOrThrow({ where: { unitId: unit.id, nomorLoker: nomorLokerFromIndex(4) } });
      await prisma.member.create({
        data: { mitraId: mitra.id, kode: 'DEMO-RFID-EKSKLUSIF-001', nama: 'Member Eksklusif Demo', lokerId: lokerEksklusif.id },
      });
      await prisma.member.create({
        data: { mitraId: mitra.id, kode: 'DEMO-RFID-UMUM-001', nama: 'Member Umum Demo', diskonPersen: 20 },
      });
      console.log('2 contoh member RFID dibuat (1 eksklusif, 1 umum diskon 20%).');
    } else {
      console.log(`Unit ${unit.kodeUnit} sudah ada, lewati.`);
    }

    console.log('\nSeed demo selesai. Kredensial login ada di .env (SEED_SUPER_ADMIN_*/SEED_MITRA_*) — tidak dicetak di sini.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
