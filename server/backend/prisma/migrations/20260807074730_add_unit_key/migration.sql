-- Tambah kredensial kiosk/gateway hardware per unit (X-Unit-Key,
-- docs/API-Contract-Smartbox.md §1.2). Tabel "unit" masih kosong (belum
-- ada endpoint pembuatan unit sebelum ini), jadi aman ditambahkan sebagai
-- NOT NULL langsung tanpa backfill.
ALTER TABLE "unit" ADD COLUMN "unit_key" TEXT NOT NULL;
CREATE UNIQUE INDEX "unit_unit_key_key" ON "unit"("unit_key");
