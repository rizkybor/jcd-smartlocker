-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "tipe_skema" AS ENUM ('fixed_rental', 'revenue_sharing');

-- CreateEnum
CREATE TYPE "status_approval" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "mode_pemakaian" AS ENUM ('berbayar', 'gratis');

-- CreateEnum
CREATE TYPE "loker_status" AS ENUM ('tersedia', 'terisi', 'maintenance', 'offline', 'nonaktif');

-- CreateEnum
CREATE TYPE "metode_akses" AS ENUM ('nomor_hp', 'rfid', 'pin', 'face_recognition');

-- CreateEnum
CREATE TYPE "status_bayar_transaksi" AS ENUM ('pending', 'paid', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "payment_provider_type" AS ENUM ('xendit', 'midtrans');

-- CreateEnum
CREATE TYPE "akun_internal_role" AS ENUM ('super_admin', 'ops', 'manager', 'staff');

-- CreateEnum
CREATE TYPE "log_kategori" AS ENUM ('keamanan', 'operasional');

-- CreateTable
CREATE TABLE "lokasi" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitra" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "kontak" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mitra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitra_lokasi" (
    "id" UUID NOT NULL,
    "mitra_id" UUID NOT NULL,
    "lokasi_id" UUID NOT NULL,
    "tipe_skema" "tipe_skema" NOT NULL,
    "persentase_aktif" DECIMAL(5,2),
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mitra_lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitra_lokasi_skema_histori" (
    "id" UUID NOT NULL,
    "mitra_lokasi_id" UUID NOT NULL,
    "persentase" DECIMAL(5,2) NOT NULL,
    "status_approval" "status_approval" NOT NULL DEFAULT 'pending',
    "diajukan_oleh" UUID NOT NULL,
    "disetujui_oleh" UUID,
    "diajukan_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disetujui_at" TIMESTAMPTZ,
    "berlaku_dari" TIMESTAMPTZ,
    "berlaku_sampai" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mitra_lokasi_skema_histori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" UUID NOT NULL,
    "lokasi_id" UUID NOT NULL,
    "kode_unit" TEXT NOT NULL,
    "varian_kompartemen" TEXT,
    "jumlah_loker" INTEGER NOT NULL,
    "mode_pemakaian" "mode_pemakaian" NOT NULL DEFAULT 'berbayar',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_durasi_harga" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "durasi_jam" INTEGER NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "unit_durasi_harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loker" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "nomor_loker" TEXT NOT NULL,
    "ukuran_w_mm" DECIMAL(8,2),
    "ukuran_h_mm" DECIMAL(8,2),
    "status" "loker_status" NOT NULL DEFAULT 'tersedia',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "loker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_transaksi" (
    "id" UUID NOT NULL,
    "loker_id" UUID NOT NULL,
    "unit_durasi_harga_id" UUID NOT NULL,
    "nomor_hp" TEXT,
    "metode_akses" "metode_akses" NOT NULL DEFAULT 'nomor_hp',
    "status_bayar" "status_bayar_transaksi" NOT NULL DEFAULT 'pending',
    "payment_provider" "payment_provider_type" NOT NULL,
    "payment_provider_ref_id" TEXT,
    "payment_idempotency_key" TEXT,
    "nominal" DECIMAL(12,2) NOT NULL,
    "kode_otp_ambil_hash" TEXT,
    "id_transaksi" TEXT NOT NULL,
    "waktu_mulai" TIMESTAMPTZ,
    "waktu_selesai" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesi_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "akun_internal" (
    "id" UUID NOT NULL,
    "supabase_auth_uid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "akun_internal_role" NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "akun_internal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "akun_mitra" (
    "id" UUID NOT NULL,
    "mitra_id" UUID NOT NULL,
    "supabase_auth_uid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "akun_mitra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "akun_mitra_lokasi" (
    "id" UUID NOT NULL,
    "akun_mitra_id" UUID NOT NULL,
    "lokasi_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "akun_mitra_lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_unlock_log" (
    "id" UUID NOT NULL,
    "loker_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "catatan" TEXT,
    "waktu_kejadian" TIMESTAMPTZ NOT NULL,
    "disinkronkan_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_unlock_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_aktivitas" (
    "id" UUID NOT NULL,
    "aktor_id" UUID NOT NULL,
    "aktor_role" TEXT NOT NULL,
    "kategori" "log_kategori" NOT NULL,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitas_id" UUID,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_aktivitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mitra_lokasi_mitra_id_lokasi_id_key" ON "mitra_lokasi"("mitra_id", "lokasi_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_kode_unit_key" ON "unit"("kode_unit");

-- CreateIndex
CREATE UNIQUE INDEX "loker_unit_id_nomor_loker_key" ON "loker"("unit_id", "nomor_loker");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_transaksi_payment_idempotency_key_key" ON "sesi_transaksi"("payment_idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_transaksi_id_transaksi_key" ON "sesi_transaksi"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_transaksi_payment_provider_payment_provider_ref_id_key" ON "sesi_transaksi"("payment_provider", "payment_provider_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "akun_internal_supabase_auth_uid_key" ON "akun_internal"("supabase_auth_uid");

-- CreateIndex
CREATE UNIQUE INDEX "akun_internal_email_key" ON "akun_internal"("email");

-- CreateIndex
CREATE UNIQUE INDEX "akun_mitra_supabase_auth_uid_key" ON "akun_mitra"("supabase_auth_uid");

-- CreateIndex
CREATE UNIQUE INDEX "akun_mitra_email_key" ON "akun_mitra"("email");

-- CreateIndex
CREATE UNIQUE INDEX "akun_mitra_lokasi_akun_mitra_id_lokasi_id_key" ON "akun_mitra_lokasi"("akun_mitra_id", "lokasi_id");

-- AddForeignKey
ALTER TABLE "mitra_lokasi" ADD CONSTRAINT "mitra_lokasi_mitra_id_fkey" FOREIGN KEY ("mitra_id") REFERENCES "mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mitra_lokasi" ADD CONSTRAINT "mitra_lokasi_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mitra_lokasi_skema_histori" ADD CONSTRAINT "mitra_lokasi_skema_histori_mitra_lokasi_id_fkey" FOREIGN KEY ("mitra_lokasi_id") REFERENCES "mitra_lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mitra_lokasi_skema_histori" ADD CONSTRAINT "mitra_lokasi_skema_histori_diajukan_oleh_fkey" FOREIGN KEY ("diajukan_oleh") REFERENCES "akun_internal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mitra_lokasi_skema_histori" ADD CONSTRAINT "mitra_lokasi_skema_histori_disetujui_oleh_fkey" FOREIGN KEY ("disetujui_oleh") REFERENCES "akun_internal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_durasi_harga" ADD CONSTRAINT "unit_durasi_harga_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loker" ADD CONSTRAINT "loker_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_transaksi" ADD CONSTRAINT "sesi_transaksi_loker_id_fkey" FOREIGN KEY ("loker_id") REFERENCES "loker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_transaksi" ADD CONSTRAINT "sesi_transaksi_unit_durasi_harga_id_fkey" FOREIGN KEY ("unit_durasi_harga_id") REFERENCES "unit_durasi_harga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "akun_mitra" ADD CONSTRAINT "akun_mitra_mitra_id_fkey" FOREIGN KEY ("mitra_id") REFERENCES "mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "akun_mitra_lokasi" ADD CONSTRAINT "akun_mitra_lokasi_akun_mitra_id_fkey" FOREIGN KEY ("akun_mitra_id") REFERENCES "akun_mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "akun_mitra_lokasi" ADD CONSTRAINT "akun_mitra_lokasi_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_unlock_log" ADD CONSTRAINT "emergency_unlock_log_loker_id_fkey" FOREIGN KEY ("loker_id") REFERENCES "loker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_unlock_log" ADD CONSTRAINT "emergency_unlock_log_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "akun_internal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_aktivitas" ADD CONSTRAINT "log_aktivitas_aktor_id_fkey" FOREIGN KEY ("aktor_id") REFERENCES "akun_internal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

