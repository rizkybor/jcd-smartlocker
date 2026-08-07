# Breakdown Epic & Ticket — Smartbox (Sewa Smart Locker)

**Sumber:** diturunkan dari `docs/PRD-Smartbox.md`, `docs/ERD-Smartbox.md`, `docs/API-Contract-Smartbox.md`. Siap dipakai sebagai backlog awal sprint planning — pindahkan ke tool tracking (Linear/Jira/GitHub Projects) sesuai kebutuhan tim, dokumen ini adalah sumber isinya, bukan pengganti tool tracking.

**Notasi ticket:** `SMB-<epic><urutan>` (mis. `SMB-101` = Epic 1, ticket ke-1). Nomor tidak mengikat prioritas mutlak, hanya pengelompokan.

**Fase**: `MVP` = wajib sebelum unit pertama live (PRD §4.1). `Fase 2` = disiapkan arsitekturnya tapi tidak diimplementasikan penuh sekarang (PRD §4.2).

---

## Urutan Epic yang Direkomendasikan

Epic 0–2 adalah fondasi — hampir semua epic lain bergantung padanya. Epic 3–8 sebagian besar bisa paralel setelah fondasi siap. Urutan detail & alasan ada di §"Dependensi Antar-Epic" di akhir dokumen.

| # | Epic | Fase |
|---|---|---|
| 0 | Fondasi Repo & Infrastruktur | MVP |
| 1 | Backend Core — Data & Auth | MVP |
| 2 | Integrasi Pembayaran | MVP |
| 3 | Kiosk — Alur Sewa Loker | MVP |
| 4 | Kiosk — Alur Ambil Barang | MVP |
| 5 | Gateway Hardware & Realtime | MVP |
| 6 | Dashboard Company | MVP |
| 7 | Dashboard Mitra | MVP |
| 8 | Design System — Kelengkapan Komponen | MVP |
| 9 | Observability & Keamanan | MVP |
| 10 | i18n & Timezone | MVP (fondasi), Fase 2 (isi bahasa lain) |
| 11 | QA & Testing | MVP (berjalan paralel semua epic) |
| 12 | Backlog Fase 2 | Fase 2 |

---

## Epic 0 — Fondasi Repo & Infrastruktur

*Referensi: PRD §9.1, §9.4, §9.5, §14*

- **SMB-001** — Setup monorepo pnpm workspace (`kiosk`, `dashboard-company`, `dashboard-mitra`, `backend`, `gateway`, `@smartbox/ui`). *(§9.4)*
- **SMB-002** — Formalkan `docs/design_reference/` jadi package `@smartbox/ui` yang bisa di-*consume* oleh 3 app frontend. *(§9.1, §13.3)*
- **SMB-003** — Setup oxlint (lanjutkan `docs/design_reference/_adherence.oxlintrc.json`) + ESLint + Prettier di root monorepo. *(§9.4)*
- **SMB-004** — Provisioning 3 project Supabase: `smartbox-dev`, `smartbox-staging`, `smartbox-prod`. *(§14.1)*
- **SMB-005** — Provisioning instance Sumopod untuk staging & production (domain, TLS/Let's Encrypt). *(§9.1, §7.1, §14.1)*
- **SMB-006** — Setup akun sandbox Xendit & Midtrans (dev/staging), siapkan kredensial live (production, disimpan sesuai §7.1). *(§8, §14.1)*
- **SMB-007** — Setup akun Cloudinary (folder per environment) & WhatsApp BSP (nomor test + resmi). *(§9.1, §14.1)*
- **SMB-008** — CI pipeline GitHub Actions: lint + test + build sebagai gate PR merge; auto-deploy `develop` → staging. *(§9.5, §14.2)*
- **SMB-009** — Deploy pipeline manual/approval untuk production (tag rilis → Sumopod). *(§14.2)*
- **SMB-010** — `.env.example` + validasi environment variable pakai Zod saat startup backend (fail-fast). *(§9.5, §7.1)*
- **SMB-011** — Setup Redis (cache, rate limit, backing store BullMQ) untuk tiap environment. *(§9.2)*

---

## Epic 1 — Backend Core: Data & Auth

*Referensi: PRD §6, §7, §9.2; ERD lengkap*

- **SMB-101** — Buat skema database awal (migration Prisma/Supabase) untuk seluruh entitas di `docs/ERD-Smartbox.md`: `LOKASI`, `MITRA`, `MITRA_LOKASI`, `MITRA_LOKASI_SKEMA_HISTORI`, `UNIT`, `UNIT_DURASI_HARGA`, `LOKER`. *(ERD §Diagram)*
- **SMB-102** — Migration lanjutan: `SESI_TRANSAKSI`, `AKUN_INTERNAL`, `AKUN_MITRA`, `AKUN_MITRA_LOKASI`, `EMERGENCY_UNLOCK_LOG`, `LOG_AKTIVITAS`. *(ERD §Diagram)*
- **SMB-103** — Implementasi soft delete di seluruh entitas inti (`deleted_at`), termasuk view/RLS yang otomatis memfilter `deleted_at IS NULL`. *(PRD §6, ERD "Catatan desain")*
- **SMB-104** — Setup RLS policy per `mitra_id`/`lokasi_id` untuk isolasi data mitra. *(PRD §7, §9.2)*
- **SMB-105** — Integrasi Supabase Auth: mapping `AKUN_INTERNAL`/`AKUN_MITRA` ↔ `supabase_auth_uid`, guard role-based di backend (super_admin/ops/manager/staff). *(PRD §9.2, §9.3)*
- **SMB-106** — Endpoint & guard **khusus Super Admin** untuk provisioning user (`POST/PATCH /company/users*`) — tolak semua role lain termasuk Manager. *(PRD §5.4, §7; API Contract §5.4)*
- **SMB-107** — Implementasi `CHECK (persentase >= 0 AND persentase <= 100)` di database + validasi Zod di API untuk `MITRA_LOKASI_SKEMA_HISTORI`. *(PRD §12 poin 2; ERD)*
- **SMB-108** — Alur approval skema: endpoint ajukan (Super Admin) → approve/reject (**Manager only**, tolak role lain termasuk Super Admin). *(API Contract §5.2)*
- **SMB-109** — `LOG_AKTIVITAS` append-only: middleware/interceptor yang otomatis mencatat aksi sensitif (buka paksa pintu, approval persentase, provisioning user) — `REVOKE UPDATE, DELETE` di level Postgres untuk role aplikasi. *(PRD §7.1; ERD)*
- **SMB-110** — `EMERGENCY_UNLOCK_LOG`: endpoint input manual oleh Staff, append-only. *(PRD §5.3, §5.4)*
- **SMB-111** — Field `timezone` di `LOKASI` (IANA name) + utility konversi UTC↔timezone lokasi (`date-fns-tz`). *(PRD §7.2)*
- **SMB-112** — Scheduled job (BullMQ cron) purge `SESI_TRANSAKSI.nomor_hp` setelah 6 bulan. *(PRD §7, §12 poin 4; ERD)*

---

## Epic 2 — Integrasi Pembayaran

*Referensi: PRD §8, §9.1, §9.3; API Contract §3*

- **SMB-201** — Desain & implementasi interface `PaymentProvider` (`createQrisCharge`, `verifyWebhook`, `getStatus`). *(PRD §8, §9.3)*
- **SMB-202** — Implementasi `XenditProvider`. *(PRD §8)*
- **SMB-203** — Implementasi `MidtransProvider`. *(PRD §8)*
- **SMB-204** — Factory pemilihan provider berbasis konfigurasi (env var), tanpa hardcode SDK di logic transaksi. *(PRD §9.3)*
- **SMB-205** — Endpoint webhook `POST /webhooks/xendit` & `POST /webhooks/midtrans` + verifikasi signature per provider. *(API Contract §3)*
- **SMB-206** — Idempotency key `(provider, provider_ref_id)` unik di `SESI_TRANSAKSI`, cegah proses webhook dobel. *(PRD §9.3; ERD)*
- **SMB-207** — Integrasi WhatsApp Business API (BSP resmi) untuk kirim OTP ambil barang. *(PRD §8)*
- **SMB-208** — Rate limiting endpoint kirim OTP & verifikasi OTP. *(PRD §7.1; API Contract §1.6)*

---

## Epic 3 — Kiosk: Alur Sewa Loker

*Referensi: PRD §5.1, §5.3; API Contract §2*

- **SMB-301** — Screen Idle + sentuh untuk mulai (state machine XState, PRD §9.3). *(PRD §5.1 langkah 1)*
- **SMB-302** — Screen Menu, termasuk redirect ke layar "Unit Penuh" jika okupansi 100%. *(PRD §5.1 langkah 2)*
- **SMB-303** — Screen input Nomor HP + validasi format Indonesia. *(PRD §5.1 langkah 3; API Contract `POST /kiosk/sewa/validasi-hp`)*
- **SMB-304** — Screen pilih Durasi & harga (per konfigurasi unit) + assign loker otomatis di backend (atomik, cegah race condition). *(PRD §5.1 langkah 4; API Contract §2 catatan kritis)*
- **SMB-305** — Screen Bayar: tampilkan QRIS dinamis, countdown 5 menit, polling status bayar. *(PRD §5.1 langkah 5; API Contract §2, §7)*
- **SMB-306** — Screen Buka Pintu & Simpan Barang + struk digital. *(PRD §5.1 langkah 6)*
- **SMB-307** — Session timeout di semua layar (reset otomatis oleh interaksi, balik ke idle). *(PRD §5.3)*
- **SMB-308** — Penanganan kegagalan bayar & timeout QR (balik ke awal dengan pesan actionable). *(PRD §5.3, §5.6)*
- **SMB-309** — Local queue & retry di gateway hardware — kiosk tetap selesaikan sesi terbayar meski backend terputus sesaat. *(PRD §5.3, §9.2)*

---

## Epic 4 — Kiosk: Alur Ambil Barang

*Referensi: PRD §5.2; API Contract §2*

- **SMB-401** — Screen Menu "Ambil Barang". *(PRD §5.2 langkah 1)*
- **SMB-402** — Screen input Nomor HP (sama saat sewa). *(PRD §5.2 langkah 2)*
- **SMB-403** — Screen kirim & input OTP WhatsApp (6 digit, berlaku 5 menit, rate-limited). *(PRD §5.2 langkah 3)*
- **SMB-404** — Screen Buka Pintu ambil barang, sesi jadi selesai setelah sensor konfirmasi. *(PRD §5.2 langkah 4)*

---

## Epic 5 — Gateway Hardware & Realtime

*Referensi: PRD §8.1–§8.3, §9.1; API Contract §4, §7*

- **SMB-501** ✅ **Selesai (bagian yang bisa dikerjakan)** — Broker MQTT: `docker-compose.yml` (EMQX) untuk dev lokal; staging/produksi masih perlu provisioning terpisah per environment (§14) begitu ada. *(PRD §9.1, §14.1)*
- **SMB-502** *(blocked — belum ada unit fisik, PRD §12 poin 1)* — Gateway hardware service (Node.js/Python) di Mini PC: publish heartbeat + last-will.
- **SMB-503** *(blocked — sama seperti SMB-502)* — Publish status loker & event pintu dari sisi gateway fisik.
- **SMB-504** *(blocked — sama seperti SMB-502)* — Terima & eksekusi perintah `buka_pintu` dari sisi gateway fisik + kirim ack.
- **SMB-505** *(blocked sampai vendor dikontrak, PRD §12 poin 1)* — Komunikasi serial/RS485 gateway ↔ Main Controller Board.
- **SMB-506** ✅ **Selesai** — Backend subscriber MQTT (`server/backend/src/gateway/mqtt-client.service.ts`): sinkronkan status ke `LOKER`, deteksi unit offline dari heartbeat (in-memory, ambang 90 detik). Diverifikasi langsung terhadap broker publik (`broker.emqx.io`) — heartbeat, update status loker, event pintu macet, dan ack perintah semua terkonfirmasi terproses & tersimpan benar. *(API Contract §4.1, §7)*
- **SMB-507** ✅ **Selesai** — Fallback HTTP `POST /gateway/:kodeUnit/heartbeat` & `POST /gateway/:kodeUnit/status-loker` (auth `X-Unit-Key`, sama seperti Kiosk API), diverifikasi lewat curl. *(API Contract §4.2)*
- **SMB-508** *(ditunda — Dashboard Company/Mitra, Epic 6/7, belum dibangun)* — Supabase Realtime subscription untuk update `LOKER`/`SESI_TRANSAKSI` live. *(PRD §9.2; API Contract §7)*
- **SMB-509** — Integrasi Emergency Unlock fisik: dokumentasi SOP + hook pencatatan manual ke `EMERGENCY_UNLOCK_LOG` (SMB-110, endpoint backend-nya sudah ada dari Epic 1). *(PRD §5.3, §8.1)*
- **SMB-510** *(blocked sampai vendor dikontrak, PRD §12 poin 1)* — Validasi & sesuaikan SMB-505 dengan protokol controller board vendor final.

**Catatan implementasi (SMB-506/507):** `KioskSewaService.bukaPintu()`/`KioskAmbilService.bukaPintu()` sekarang publish perintah `buka_pintu` ke MQTT (fire-and-forget), tapi TIDAK menunggu ack — belum ada gateway fisik (SMB-502-505) yang benar-benar mengonsumsi & membalas. Status sesi/loker di database masih jadi sumber kebenaran sampai SMB-502-505 selesai.

---

## Epic 6 — Dashboard Company

*Referensi: PRD §5.4, §5.6, §7; API Contract §5*

**Overview & Unit**
- **SMB-601** — Halaman Overview (ringkasan okupansi/pendapatan/kesehatan). *(API Contract §5.1)*
- **SMB-602** — Halaman daftar Unit Locker (paginated server-side) + detail unit. *(PRD §5.6; API Contract §5.1)*
- **SMB-603** — Form Konfigurasi Unit (harga, durasi, mode `berbayar`/`gratis`, aktif/nonaktif) + modal konfirmasi untuk aksi nonaktifkan. *(PRD §4.4a, §5.6)*
- **SMB-604** — Aksi "Buka Paksa Pintu" dari dashboard + modal konfirmasi wajib alasan. *(PRD §2 Tujuan; API Contract §5.1)*

**Partner**
- **SMB-605** — Halaman Partner: kelola data mitra & lokasi, tipe skema kerja sama. *(API Contract §5.2)*
- **SMB-606** — Form ajukan persentase revenue sharing (validasi 0–100) — role Super Admin. *(PRD §12 poin 2)*
- **SMB-607** — Halaman approval Manager (approve/reject persentase) + riwayat skema historis. *(API Contract §5.2)*

**Laporan**
- **SMB-608** — Halaman Laporan transaksi lintas mitra, paginated, filter. *(API Contract §5.3)*
- **SMB-609** — Laporan bagi hasil per mitra (pakai persentase historis yang berlaku saat transaksi). *(PRD §10; ERD)*
- **SMB-610** — Ekspor CSV/PDF (async via BullMQ, hasil di Supabase Storage). *(PRD §9.2; API Contract §5.3)*

**Manajemen User & Log**
- **SMB-611** — Halaman Manajemen User (khusus Super Admin) — buat akun, tetapkan role. *(PRD §5.4, §7)*
- **SMB-612** — Halaman Log Emergency Unlock. *(API Contract §5.5)*
- **SMB-613** — Halaman Aktivitas (activity log operasional, beda dari audit keamanan). *(PRD §5.6)*

**UX lintas halaman**
- **SMB-614** — Error handling standar (loading/sukses/gagal, pesan actionable) di semua form/aksi. *(PRD §5.6)*
- **SMB-615** — Komponen `ConfirmDialog` terpasang di semua aksi sensitif (lihat Epic 8 untuk pembuatan komponennya). *(PRD §5.6)*

---

## Epic 7 — Dashboard Mitra

*Referensi: PRD §5.5; API Contract §6*

- **SMB-701** — Halaman Overview mitra (okupansi & pendapatan lokasi miliknya). *(API Contract §6)*
- **SMB-702** — Halaman Unit Locker milik mitra (read-only, terisolasi RLS). *(API Contract §6)*
- **SMB-703** — Halaman Laporan + ekspor (read-only). *(API Contract §6)*
- **SMB-704** — Verifikasi eksplisit: **tidak ada route/endpoint tulis** di app ini, termasuk uji RLS memastikan mitra tidak bisa akses data mitra lain lewat manipulasi request langsung. *(PRD §5.5, §9.2)*

---

## Epic 8 — Design System: Kelengkapan Komponen

*Referensi: PRD §13*

- **SMB-801** ✅ **Selesai (revisi kedua)** — Kalibrasi ulang canvas kiosk dari 800×1280 (asumsi awal) ke 1024×600 landscape, lalu dikoreksi lagi ke **600×1024 portrait** (ukuran final — panel 7″ 1024×600 native, mount dirotasi 90°) — token `--sl-kiosk-w/-h/-pad/-content-max` di `docs/design_reference/tokens/spacing.css`, guideline `kiosk-canvas.card.html`/`type-kiosk-scale.card.html`, dan `readme.md` sudah diperbarui. Komponen kiosk (`IdleScreen`/`QRScreen`/dll.) pakai token, bukan px hardcoded, jadi ikut ter-update otomatis; layout `client/kiosk` yang tadinya split kiri-kanan (mis. `NomorHpScreen`) sudah disusun ulang vertikal. *(PRD §12 poin 8, §13.1)*
- **SMB-802** — Komponen baru `ConfirmDialog` (Radix UI Dialog/AlertDialog, mengikuti token design system). *(PRD §9.3, §13.2)*
- **SMB-803** — Komponen baru `Toast`/notifikasi non-blocking. *(PRD §9.3, §13.2)*
- **SMB-804** — Lengkapi kontrol paginasi eksplisit di `DataTable` (kontrol halaman + info total data). *(PRD §5.6, §13.2)*
- **SMB-805** — Update enum status di komponen `CompartmentCard`/`StatusBadge` agar konsisten 5 nilai resmi. *(PRD §12 poin 9)*

---

## Epic 9 — Observability & Keamanan

*Referensi: PRD §7.1, §9.4, §9.5*

- **SMB-901** — Setup Sentry (FE & BE) di semua environment. *(PRD §9.4, §14.1)*
- **SMB-902** — Setup Grafana + Prometheus untuk metrik unit/API. *(PRD §9.4)*
- **SMB-903** — Endpoint `/health` + graceful shutdown (`SIGTERM`) di backend. *(PRD §9.5)*
- **SMB-904** — Hardening server Sumopod production (firewall, SSH key-based, update OS berkala). *(PRD §7.1, §12 poin 10)*
- **SMB-905** — Aktifkan Dependabot/`npm audit` di CI. *(PRD §7.1)*
- **SMB-906** — Setup CORS ketat per app (Dashboard Company, Dashboard Mitra, domain kiosk). *(PRD §7.1)*
- **SMB-907** — Drill backup & restore (Supabase + konfigurasi server Sumopod). *(PRD §7.1)*
- **SMB-908** — Security review/pentest ringan sebelum go-live. *(PRD §7.1)*

---

## Epic 10 — i18n & Timezone

*Referensi: PRD §7.2*

- **SMB-1001** — Setup `react-i18next`/`next-intl` di kiosk & kedua dashboard, struktur folder locale per-app. *(PRD §7.2)*
- **SMB-1002** — Migrasi seluruh teks UI kiosk ke key terjemahan `id.json` (tidak ada string hardcode). *(PRD §7.2)*
- **SMB-1003** — Migrasi teks Dashboard Company/Mitra ke key terjemahan. *(PRD §7.2)*
- **SMB-1004** — Implementasi konversi UTC↔timezone lokasi di seluruh tampilan waktu (kiosk, struk, dashboard). *(PRD §7.2, ERD)*
- **SMB-1005** *(Fase 2)* — Tambah locale `en.json` (atau lainnya) setelah keputusan bisnis bahasa mana yang diperlukan.

---

## Epic 11 — QA & Testing

*Referensi: PRD §9.4, §9.5*

- **SMB-1101** — Unit test logic kritikal: perhitungan bagi hasil, validasi sesi/timeout, assign loker atomik. *(PRD §9.4)*
- **SMB-1102** — Integration test endpoint backend (auth/RBAC per role, webhook payment, RLS isolasi mitra). *(PRD §9.4)*
- **SMB-1103** — E2E test alur kiosk penuh (Playwright, viewport 600×1024) — sewa & ambil barang, termasuk skenario gagal bayar/timeout. *(PRD §9.4)*
- **SMB-1104** — E2E test Dashboard Company (approval Manager, provisioning Super Admin, konfigurasi unit). *(PRD §9.4)*
- **SMB-1105** — Test RLS Dashboard Mitra — pastikan tidak bisa akses data mitra lain via request langsung. *(Epic 7, SMB-704)*
- **SMB-1106** — Uji beban dasar untuk endpoint publik kiosk (concurrent sewa di banyak unit). *(PRD §11)*

---

## Epic 12 — Backlog Fase 2

*Referensi: PRD §4.2, §12*

- **SMB-1201** — Verifikasi hardware Face Recognition setelah unit fisik diadakan (PRD §12 poin 6) — **prasyarat** sebelum ticket implementasi dibuat.
- **SMB-1202** — Implementasi akses RFID Card (modul autentikasi kiosk sudah disiapkan multi-metode sejak MVP).
- **SMB-1203** — Implementasi akses PIN Code.
- **SMB-1204** — Notifikasi WhatsApp otomatis (reminder sebelum sewa berakhir, perpanjangan mandiri).
- **SMB-1205** — Rekonsiliasi otomatis pembayaran ↔ payout mitra (jadwal payout, invoice otomatis).
- **SMB-1206** — Mode aksesibilitas kiosk.
- **SMB-1207** — OTA update firmware/gateway hardware dari dashboard.
- **SMB-1208** — Analitik lanjutan (heatmap okupansi, prediksi kapasitas).

---

## Dependensi Antar-Epic

```
Epic 0 (Fondasi) ─┬─► Epic 1 (Backend Core) ─┬─► Epic 2 (Payment)
                   │                          ├─► Epic 5 (Gateway/Realtime)
                   │                          ├─► Epic 6 (Dashboard Company)
                   │                          └─► Epic 7 (Dashboard Mitra)
                   └─► Epic 8 (Design System) ─┬─► Epic 3 (Kiosk Sewa)
                                                ├─► Epic 4 (Kiosk Ambil)
                                                ├─► Epic 6 (Dashboard Company, UI)
                                                └─► Epic 7 (Dashboard Mitra, UI)

Epic 9 (Observability & Keamanan) — berjalan paralel sejak Epic 0, diperdalam menjelang go-live.
Epic 10 (i18n & Timezone) — fondasinya (SMB-1001) sebaiknya masuk bareng Epic 3/4/6/7 dari awal, bukan ditambahkan belakangan.
Epic 11 (QA) — paralel dengan semua epic implementasi, bukan fase terpisah di akhir.
Epic 12 (Fase 2) — seluruhnya *setelah* MVP live, kecuali SMB-1201 (verifikasi hardware) yang bisa mulai begitu unit fisik pertama diadakan (bisa tumpang tindih dengan akhir MVP).
```

**Catatan:** Epic 3 & 4 (Kiosk) idealnya menunggu SMB-801 (kalibrasi canvas 600×1024 portrait) selesai sebelum polish visual final — tapi logic alur (state machine, API integration) bisa dikerjakan paralel di atas canvas sementara, supaya tidak ada tim yang menganggur menunggu.
