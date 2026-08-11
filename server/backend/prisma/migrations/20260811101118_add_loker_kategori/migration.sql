/*
  Fitur harga & pilihan per ukuran loker (di luar cakupan PRD awal —
  permintaan bisnis langsung): loker dikelompokkan per LokerKategori dalam
  satu unit, harga (UnitDurasiHarga) & assignment otomatis saat sewa
  di-filter per kategori, bukan campur rata seluruh unit.

  Migrasi ini BACKFILL data lama secara eksplisit (bukan cuma DDL) — setiap
  unit yang sudah ada diberi SATU LokerKategori default "Standar" (dimensi
  diambil dari loker manapun di unit itu yang sudah punya ukuran_w_mm/
  ukuran_h_mm terisi, kalau ada — DB dev saat migrasi ini dibuat semuanya
  masih NULL, jadi tidak ada data hilang), lalu seluruh Loker & UnitDurasiHarga
  unit itu diarahkan ke kategori default itu. Baris `ukuran_w_mm`/
  `ukuran_h_mm` di `loker` PINDAH ke `loker_kategori` (satu kategori =
  ukuran seragam untuk semua loker di kategori itu).
*/

-- CreateTable
CREATE TABLE "loker_kategori" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "ukuran_w_mm" DECIMAL(8,2),
    "ukuran_h_mm" DECIMAL(8,2),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "loker_kategori_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loker_kategori_unit_id_nama_key" ON "loker_kategori"("unit_id", "nama");

-- AddForeignKey
ALTER TABLE "loker_kategori" ADD CONSTRAINT "loker_kategori_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: satu LokerKategori "Standar" per unit yang sudah ada, dimensi
-- diambil dari loker pertama di unit itu yang punya ukuran terisi (bisa NULL).
INSERT INTO "loker_kategori" ("id", "unit_id", "nama", "ukuran_w_mm", "ukuran_h_mm", "updated_at")
SELECT gen_random_uuid(), u."id", 'Standar',
       (SELECT l."ukuran_w_mm" FROM "loker" l WHERE l."unit_id" = u."id" AND l."ukuran_w_mm" IS NOT NULL LIMIT 1),
       (SELECT l."ukuran_h_mm" FROM "loker" l WHERE l."unit_id" = u."id" AND l."ukuran_h_mm" IS NOT NULL LIMIT 1),
       CURRENT_TIMESTAMP
FROM "unit" u;

-- AlterTable: tambah kolom nullable dulu, backfill, baru NOT NULL — tabel
-- `loker`/`unit_durasi_harga` sudah punya baris, tidak bisa langsung NOT
-- NULL tanpa default.
ALTER TABLE "loker" ADD COLUMN "loker_kategori_id" UUID;
ALTER TABLE "unit_durasi_harga" ADD COLUMN "loker_kategori_id" UUID;

UPDATE "loker" l SET "loker_kategori_id" = lk."id"
FROM "loker_kategori" lk WHERE lk."unit_id" = l."unit_id" AND lk."nama" = 'Standar';

UPDATE "unit_durasi_harga" udh SET "loker_kategori_id" = lk."id"
FROM "loker_kategori" lk WHERE lk."unit_id" = udh."unit_id" AND lk."nama" = 'Standar';

ALTER TABLE "loker" ALTER COLUMN "loker_kategori_id" SET NOT NULL;
ALTER TABLE "unit_durasi_harga" ALTER COLUMN "loker_kategori_id" SET NOT NULL;

-- AlterTable: ukuran pindah ke loker_kategori (seragam per kategori).
ALTER TABLE "loker" DROP COLUMN "ukuran_h_mm",
DROP COLUMN "ukuran_w_mm";

-- AddForeignKey
ALTER TABLE "unit_durasi_harga" ADD CONSTRAINT "unit_durasi_harga_loker_kategori_id_fkey" FOREIGN KEY ("loker_kategori_id") REFERENCES "loker_kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loker" ADD CONSTRAINT "loker_loker_kategori_id_fkey" FOREIGN KEY ("loker_kategori_id") REFERENCES "loker_kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
