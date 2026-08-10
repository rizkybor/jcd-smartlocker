# Runbook Operasional — Smartbox

Checklist eksekusi manual untuk item Epic 9 (Observability & Keamanan) yang
sifatnya aksi di server produksi asli (Sumopod) atau proses non-kode, bukan
sesuatu yang bisa diverifikasi/dijalankan dari repo ini. Referensi:
`docs/Epics-Smartbox.md` Epic 9, `docs/PRD-Smartbox.md` §7.1.

## SMB-904 — Hardening server Sumopod produksi

- [ ] **SSH key-based only** — nonaktifkan login password di
      `/etc/ssh/sshd_config` (`PasswordAuthentication no`,
      `PermitRootLogin no`), restart `sshd`, uji login pakai key sebelum
      menutup sesi lama.
- [ ] **Firewall** — `ufw` (atau setara) hanya buka port yang perlu: 22
      (SSH, idealnya dibatasi ke IP tim), 80/443 (HTTP/HTTPS), tutup semua
      port lain termasuk port DB/Redis langsung ke publik (akses DB harus
      lewat Supabase, bukan expose lokal).
- [ ] **Update OS berkala** — jadwalkan `unattended-upgrades` (Ubuntu/Debian)
      atau cron `apt update && apt upgrade -y` mingguan, plus reboot
      terjadwal kalau ada update kernel.
- [ ] **User non-root untuk deploy** — proses Node.js jalan sebagai user
      biasa (bukan root), pakai `sudo` cuma untuk operasi spesifik.
- [ ] **Rotasi secret** — pastikan `.env` produksi permission `600`, tidak
      pernah ke-commit, dan ada rencana rotasi berkala untuk
      `SUPABASE_SERVICE_ROLE_KEY`/`XENDIT_SECRET_KEY`/dll.

## SMB-907 — Drill backup & restore

- [ ] **Backup Supabase** — konfirmasi Point-in-Time Recovery atau backup
      terjadwal aktif di project Supabase (Settings → Database → Backups).
- [ ] **Backup konfigurasi server** — snapshot/backup file konfigurasi
      Sumopod (nginx/Caddy config, `.env` terenkripsi di tempat terpisah,
      systemd unit file) — bukan cuma database.
- [ ] **Drill restore nyata** — minimal sekali sebelum go-live: restore
      backup Supabase ke project staging terpisah, verifikasi data utuh
      (jumlah baris `Transaksi`/`Loker`/`AkunInternal` cocok), catat waktu
      yang dibutuhkan (RTO) untuk jadi acuan SLA insiden.
- [ ] **Dokumentasikan hasil drill** — tanggal, siapa yang jalankan, RTO
      aktual, masalah yang ditemukan — supaya drill berikutnya makin cepat.

## SMB-908 — Security review / pentest ringan sebelum go-live

- [ ] **Cakupan**: auth (kebocoran token lintas dashboard — sudah diuji
      isolasi Dashboard Mitra lewat smoke test Epic 7), IDOR di endpoint
      ber-`:id`/`:kodeUnit`, rate limiting OTP (`ThrottlerModule` di
      `app.module.ts`), validasi webhook payment (signature Xendit/Midtrans),
      CORS (`CORS_ORIGIN` — sudah ketat per Epic 9 SMB-906).
- [ ] **Checklist OWASP ringan**: coba akses `/company/*` dengan token
      mitra dan sebaliknya (harus 403), coba SQL/NoSQL injection di field
      free-text (Prisma parameterized query seharusnya sudah aman secara
      default), cek header keamanan (`helmet` — belum dipasang, lihat
      catatan di bawah).
- [ ] **Opsional**: sewa pentest eksternal ringan (1-2 hari) menjelang
      go-live kalau budget memungkinkan, atau minimal internal review pakai
      checklist di atas.

> Security header standar (`helmet()`) sudah dipasang di `main.ts` (Epic 9).
