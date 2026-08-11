-- Suplemen SQL di luar cakupan Prisma schema — dijalankan SETELAH migration
-- Prisma pertama berhasil (mis. via `prisma db execute --file
-- prisma/sql/constraints_and_rls.sql --schema prisma/schema.prisma`, atau
-- ditempel ke akhir file migration.sql yang di-generate Prisma).
--
-- Prisma tidak mengelola CHECK constraint custom & RLS policy Postgres
-- secara native di schema.prisma, jadi ditulis manual di sini. Referensi:
-- docs/PRD-Smartbox.md §7, §7.1, §9.2, §12 poin 2; docs/ERD-Smartbox.md.

-- ---------------------------------------------------------------------------
-- 1. CHECK constraint persentase 0–100 (§12 poin 2)
-- ---------------------------------------------------------------------------

ALTER TABLE mitra_lokasi
  ADD CONSTRAINT chk_mitra_lokasi_persentase_range
  CHECK (persentase_aktif IS NULL OR (persentase_aktif >= 0 AND persentase_aktif <= 100));

ALTER TABLE mitra_lokasi_skema_histori
  ADD CONSTRAINT chk_skema_histori_persentase_range
  CHECK (persentase >= 0 AND persentase <= 100);

-- Member RFID/kode unik (fitur di luar cakupan PRD awal) — diskon_persen
-- 0-100 kalau diisi, DAN saling eksklusif dengan loker_id (member terikat
-- loker spesifik = gratis, tidak boleh sekaligus punya diskon; member umum
-- = wajib py diskon, tidak boleh terikat loker) — lihat catatan schema.prisma.
ALTER TABLE member
  ADD CONSTRAINT chk_member_diskon_persen_range
  CHECK (diskon_persen IS NULL OR (diskon_persen >= 0 AND diskon_persen <= 100));

ALTER TABLE member
  ADD CONSTRAINT chk_member_loker_xor_diskon
  CHECK ((loker_id IS NOT NULL AND diskon_persen IS NULL) OR (loker_id IS NULL));

-- ---------------------------------------------------------------------------
-- 2. Proteksi append-only (§7.1) — TIDAK diterapkan lewat REVOKE Postgres.
--
--    Kenapa: DATABASE_URL/DIRECT_URL backend connect sebagai role `postgres`
--    (superuser) lewat Supabase connection pooler — superuser BYPASS semua
--    REVOKE/GRANT dan RLS di Postgres, jadi REVOKE UPDATE/DELETE di sini
--    tidak akan pernah efektif untuk query yang dijalankan Prisma. Membuat
--    role Postgres non-superuser terpisah khusus untuk backend adalah opsi
--    yang lebih ketat tapi menambah kompleksitas (Supabase tidak
--    menyediakan ini out-of-the-box untuk custom role dengan mudah).
--
--    Keputusan untuk sekarang: proteksi append-only untuk
--    emergency_unlock_log, log_aktivitas, dan sesi_transaksi ditegakkan di
--    APPLICATION LAYER — PrismaService (src/prisma/prisma.service.ts) hanya
--    expose `create`/`findMany`/dst. untuk tabel-tabel ini lewat service
--    khusus yang sengaja tidak punya method update/delete untuk baris yang
--    sudah ada. Code review adalah lapisan pertahanan utama untuk aturan
--    ini, dicatat di sini supaya keputusannya terdokumentasi dan tidak
--    diulang jadi pertanyaan lagi nanti.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Row Level Security — isolasi data antar mitra (§7, §9.2)
--
--    RLS di sini relevan untuk akses LANGSUNG dari frontend ke Supabase
--    (Supabase Realtime subscription dari Dashboard Company/Mitra, §9.2 —
--    Realtime tetap menghormati RLS meski query lewat backend/Prisma tidak).
--    Role yang dicek policy ini adalah `authenticated` (role bawaan
--    Supabase untuk user yang sudah login lewat Supabase Auth), BUKAN role
--    `postgres` yang dipakai backend/Prisma.
-- ---------------------------------------------------------------------------

ALTER TABLE mitra_lokasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE loker ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesi_transaksi ENABLE ROW LEVEL SECURITY;

-- Akun internal (Super Admin/Ops/Manager/Staff) akses penuh lintas mitra —
-- isolasi hanya berlaku untuk AkunMitra. Asumsi: backend mengautentikasi
-- via Supabase Auth, `auth.uid()` tersedia sebagai fungsi Supabase bawaan.
--
-- Policy di bawah ini KERANGKA AWAL — perlu disesuaikan begitu tabel
-- profil_user/pemetaan role final (SMB-105) selesai diimplementasikan.
-- Prinsipnya: AkunMitra hanya boleh SELECT baris yang lokasi/mitra-nya
-- terhubung lewat akun_mitra_lokasi miliknya sendiri.

CREATE POLICY mitra_lokasi_isolasi_select ON mitra_lokasi
  FOR SELECT
  TO authenticated
  USING (
    -- Akun internal: selalu boleh (dicek via klaim role di JWT / tabel
    -- akun_internal, bukan lewat RLS jika backend pakai service-role key
    -- untuk operasi Dashboard Company — lihat catatan di §9.2).
    EXISTS (
      SELECT 1 FROM akun_mitra_lokasi aml
      JOIN akun_mitra am ON am.id = aml.akun_mitra_id
      WHERE am.supabase_auth_uid = auth.uid()
        AND aml.lokasi_id = mitra_lokasi.lokasi_id
    )
  );

CREATE POLICY unit_isolasi_select ON unit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM akun_mitra_lokasi aml
      JOIN akun_mitra am ON am.id = aml.akun_mitra_id
      WHERE am.supabase_auth_uid = auth.uid()
        AND aml.lokasi_id = unit.lokasi_id
    )
  );

CREATE POLICY loker_isolasi_select ON loker
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit u
      JOIN akun_mitra_lokasi aml ON aml.lokasi_id = u.lokasi_id
      JOIN akun_mitra am ON am.id = aml.akun_mitra_id
      WHERE am.supabase_auth_uid = auth.uid()
        AND u.id = loker.unit_id
    )
  );

CREATE POLICY sesi_transaksi_isolasi_select ON sesi_transaksi
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loker l
      JOIN unit u ON u.id = l.unit_id
      JOIN akun_mitra_lokasi aml ON aml.lokasi_id = u.lokasi_id
      JOIN akun_mitra am ON am.id = aml.akun_mitra_id
      WHERE am.supabase_auth_uid = auth.uid()
        AND l.id = sesi_transaksi.loker_id
    )
  );

-- CATATAN PENTING (§5.5, §9.2): Dashboard Mitra TIDAK PUNYA endpoint tulis
-- sama sekali di level backend (lihat docs/API-Contract-Smartbox.md §6) —
-- jadi policy di atas sengaja hanya FOR SELECT. Kalau nanti backend
-- mengakses tabel-tabel ini pakai Supabase service-role key (bypass RLS,
-- dipakai Dashboard Company), maka RLS di atas TIDAK berlaku untuk request
-- itu — isolasi untuk Dashboard Company harus tetap ditegakkan eksplisit di
-- application layer (WHERE clause manual), bukan mengandalkan RLS semata.
--
-- TODO sebelum production: policy ini masih kerangka awal, perlu direview
-- ulang begitu SMB-105 (integrasi Supabase Auth) selesai dan pola akses
-- akun_internal vs akun_mitra ke backend sudah final.
