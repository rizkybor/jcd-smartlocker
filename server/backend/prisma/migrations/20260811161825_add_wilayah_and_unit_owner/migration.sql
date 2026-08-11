-- AlterTable: tambah kolom wilayah administratif Lokasi sebagai NULLABLE
-- dulu supaya bisa backfill baris existing, baru di-set NOT NULL (pola
-- yang sama dipakai migration LokerKategori/Member sebelumnya).
ALTER TABLE "lokasi" ADD COLUMN     "kabupaten_kode" TEXT,
ADD COLUMN     "kabupaten_nama" TEXT,
ADD COLUMN     "kecamatan_kode" TEXT,
ADD COLUMN     "kecamatan_nama" TEXT,
ADD COLUMN     "kelurahan_kode" TEXT,
ADD COLUMN     "kelurahan_nama" TEXT,
ADD COLUMN     "provinsi_kode" TEXT,
ADD COLUMN     "provinsi_nama" TEXT;

-- Backfill Lokasi lama dengan placeholder — data pre-production (seed
-- demo), Super Admin bisa lengkapi lewat PATCH /company/lokasi/:id nanti.
UPDATE "lokasi" SET
  "provinsi_kode" = '', "provinsi_nama" = '(belum diisi)',
  "kabupaten_kode" = '', "kabupaten_nama" = '(belum diisi)',
  "kecamatan_kode" = '', "kecamatan_nama" = '(belum diisi)',
  "kelurahan_kode" = '', "kelurahan_nama" = '(belum diisi)'
WHERE "provinsi_kode" IS NULL;

ALTER TABLE "lokasi"
  ALTER COLUMN "provinsi_kode" SET NOT NULL,
  ALTER COLUMN "provinsi_nama" SET NOT NULL,
  ALTER COLUMN "kabupaten_kode" SET NOT NULL,
  ALTER COLUMN "kabupaten_nama" SET NOT NULL,
  ALTER COLUMN "kecamatan_kode" SET NOT NULL,
  ALTER COLUMN "kecamatan_nama" SET NOT NULL,
  ALTER COLUMN "kelurahan_kode" SET NOT NULL,
  ALTER COLUMN "kelurahan_nama" SET NOT NULL;

-- AlterTable: Unit.mitra_id — owner langsung (di luar cakupan PRD awal).
ALTER TABLE "unit" ADD COLUMN     "mitra_id" UUID;

-- Backfill: derive dari baris MitraLokasi PERTAMA milik lokasi_id unit itu
-- (cukup untuk data seed saat ini — 1 unit, 1 mitra_lokasi per lokasi).
UPDATE "unit" u SET "mitra_id" = (
  SELECT ml."mitra_id" FROM "mitra_lokasi" ml WHERE ml."lokasi_id" = u."lokasi_id" ORDER BY ml."created_at" ASC LIMIT 1
)
WHERE u."mitra_id" IS NULL;

ALTER TABLE "unit" ALTER COLUMN "mitra_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "unit_mitra_id_idx" ON "unit"("mitra_id");

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_mitra_id_fkey" FOREIGN KEY ("mitra_id") REFERENCES "mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
