-- Tandai kapan verifikasi OTP ambil-barang sukses (docs/PRD-Smartbox.md
-- §5.2 langkah 3) — dicek endpoint buka-pintu ambil supaya pintu tidak
-- bisa dibuka tanpa OTP terverifikasi lebih dulu.
ALTER TABLE "sesi_transaksi" ADD COLUMN "otp_verified_at" TIMESTAMPTZ;
