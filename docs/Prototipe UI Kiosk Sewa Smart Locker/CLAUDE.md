# Sewa Smart Locker — aturan project

## Format nominal Rupiah (wajib, semua komponen)
Semua komponen yang menampilkan nominal uang — kartu, tabel, chart, tooltip,
modal, dan komponen baru apa pun — WAJIB memakai helper `rpJt(angka)`
(didefinisikan di `dash-data.jsx`), bukan string hardcode:

- Nominal >= Rp1.000.000 → `Rp X,XXjt` (contoh `Rp1,15jt`)
- Nominal < Rp1.000.000 → angka penuh dengan titik ribuan (contoh `Rp345.000`)
- Jangan pernah memakai singkatan `rb`, dan jangan memakai `jt` untuk nilai
  di bawah satu juta.
- Tidak ada spasi setelah `Rp`.

Simpan nominal sebagai ANGKA di data, bukan string yang sudah diformat, supaya
angka turunan (persentase bagi hasil, subtotal, rata-rata) selalu presisi dan
konsisten dengan angka lain di layar yang sama.
