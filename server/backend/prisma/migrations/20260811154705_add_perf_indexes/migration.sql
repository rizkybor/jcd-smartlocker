-- CreateIndex
CREATE INDEX "emergency_unlock_log_waktu_kejadian_idx" ON "emergency_unlock_log"("waktu_kejadian");

-- CreateIndex
CREATE INDEX "log_aktivitas_kategori_created_at_idx" ON "log_aktivitas"("kategori", "created_at");

-- CreateIndex
CREATE INDEX "loker_loker_kategori_id_idx" ON "loker"("loker_kategori_id");

-- CreateIndex
CREATE INDEX "member_mitra_id_idx" ON "member"("mitra_id");

-- CreateIndex
CREATE INDEX "sesi_transaksi_loker_id_status_bayar_idx" ON "sesi_transaksi"("loker_id", "status_bayar");

-- CreateIndex
CREATE INDEX "sesi_transaksi_nomor_hp_idx" ON "sesi_transaksi"("nomor_hp");

-- CreateIndex
CREATE INDEX "sesi_transaksi_member_id_idx" ON "sesi_transaksi"("member_id");

-- CreateIndex
CREATE INDEX "sesi_transaksi_created_at_idx" ON "sesi_transaksi"("created_at");

-- CreateIndex
CREATE INDEX "unit_lokasi_id_idx" ON "unit"("lokasi_id");

-- CreateIndex
CREATE INDEX "unit_durasi_harga_unit_id_idx" ON "unit_durasi_harga"("unit_id");

-- CreateIndex
CREATE INDEX "unit_durasi_harga_loker_kategori_id_idx" ON "unit_durasi_harga"("loker_kategori_id");
