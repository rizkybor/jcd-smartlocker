-- AlterTable
ALTER TABLE "sesi_transaksi" ADD COLUMN     "member_id" UUID;

-- CreateTable
CREATE TABLE "member" (
    "id" UUID NOT NULL,
    "mitra_id" UUID NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kontak" TEXT,
    "loker_id" UUID,
    "diskon_persen" DECIMAL(5,2),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_kode_key" ON "member"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "member_loker_id_key" ON "member"("loker_id");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_mitra_id_fkey" FOREIGN KEY ("mitra_id") REFERENCES "mitra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_loker_id_fkey" FOREIGN KEY ("loker_id") REFERENCES "loker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_transaksi" ADD CONSTRAINT "sesi_transaksi_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
