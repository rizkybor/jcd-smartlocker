-- Tambah kolom email penyewa di SesiTransaksi — dipakai kirim OTP ambil
-- barang lewat email (Brevo) sementara WhatsApp BSP belum tersedia
-- (docs/PRD-Smartbox.md §8, Epic 0 SMB-006). Nullable & di-purge bersamaan
-- dengan nomor_hp (§7, §12 poin 4).
ALTER TABLE "sesi_transaksi" ADD COLUMN "email_penyewa" TEXT;
