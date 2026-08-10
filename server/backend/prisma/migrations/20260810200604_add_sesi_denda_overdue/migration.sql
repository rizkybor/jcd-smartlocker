-- CreateTable
CREATE TABLE "sesi_denda" (
    "id" UUID NOT NULL,
    "sesi_transaksi_id" UUID NOT NULL,
    "jam_terlambat" INTEGER NOT NULL,
    "nominal" DECIMAL(12,2) NOT NULL,
    "status_bayar" "status_bayar_transaksi" NOT NULL DEFAULT 'pending',
    "payment_provider" "payment_provider_type" NOT NULL,
    "payment_provider_ref_id" TEXT,
    "id_transaksi" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesi_denda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesi_denda_id_transaksi_key" ON "sesi_denda"("id_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_denda_payment_provider_payment_provider_ref_id_key" ON "sesi_denda"("payment_provider", "payment_provider_ref_id");

-- AddForeignKey
ALTER TABLE "sesi_denda" ADD CONSTRAINT "sesi_denda_sesi_transaksi_id_fkey" FOREIGN KEY ("sesi_transaksi_id") REFERENCES "sesi_transaksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
