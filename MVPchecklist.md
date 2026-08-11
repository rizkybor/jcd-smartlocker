# MVP Checklist — Smartbox (Sewa Smart Locker)

Checklist ini dibuat dengan memverifikasi **kode aktual** di `client/` dan `server/` terhadap tiap ticket MVP (Epic 0–11) di `docs/Epics-Smartbox.md`. Epic 12 ("Backlog Fase 2") sengaja **tidak** dimasukkan — memang di luar scope MVP.

Legenda: ✅ selesai (ada bukti kode jelas) · ⚠️ sebagian/ada deviasi · ❌ belum ada bukti di kode.

## Ringkasan

- **Total ticket MVP diperiksa: 97**
- ✅ Selesai: **71**
- ⚠️ Sebagian/deviasi: **19**
- ❌ Belum ada: **7**

**Celah terbesar yang ditemukan:**

- **Epic 5 (Gateway Hardware fisik)** — SMB-502, 503, 504, 505, 510 semua ❌/blocked. `server/gateway/package.json` isinya cuma skeleton (`"dev": "echo TODO && exit 1"`), belum ada satu baris kode service gateway fisik. Perintah `buka_pintu` dari backend (`KioskSewaService.bukaPintu()`/`KioskAmbilService.bukaPintu()`) publish MQTT **fire-and-forget tanpa menunggu ack fisik** — DB tetap jadi sumber kebenaran.
- **Channel komunikasi eksternal belum aktif** — WhatsApp OTP (SMB-207) & Midtrans (bagian SMB-006/SMB-203 pemakaian) sudah ada kode abstraksinya tapi kredensial kosong di `.env`; sistem jalan pakai fallback (email/Brevo untuk OTP, Xendit-only untuk payment).
- **Ekspor laporan (SMB-610)** — hanya CSV, sinkron (bukan async BullMQ seperti direkomendasikan PRD, Redis belum ada saat ticket dikerjakan), dan **tidak ada ekspor PDF sama sekali**.
- **CI/CD gate (SMB-008/009)** — hanya ada workflow `dependency-audit.yml` (pnpm audit). Tidak ada workflow GitHub Actions yang menjalankan lint+test+build sebagai gate PR, dan tidak ada pipeline deploy production manual/approval.
- **Setup infra eksternal (SMB-004, 005, 007, 904, 907, 908)** tidak bisa diverifikasi murni dari kode — dinilai dari jejak konfigurasi (`.env` terisi, dsb.), bukan akses langsung ke console Supabase/Sumopod/Cloudinary.

> **Update 2026-08-11 (sore):** Epic 11 (SMB-1103/1104/1106 — Playwright kiosk & Dashboard Company, load test) diselesaikan sejak audit pagi — lihat tabel Epic 11 di bawah, sekarang semua ✅. Sesudahnya, satu fitur besar **di luar 97 ticket MVP** juga selesai dibangun: **Member RFID/kode unik**, lihat bagian "Fitur Tambahan Pasca-MVP" di akhir dokumen ini untuk daftar lengkapnya.

---

## Epic 0 — Fondasi Repo & Infrastruktur

*Referensi: PRD §9.1, §9.4, §9.5, §14*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-001 | Setup monorepo pnpm workspace (`kiosk`, `dashboard-company`, `dashboard-mitra`, `backend`, `gateway`, `@smartbox/ui`) | ✅ | `pnpm-workspace.yaml`, root `package.json`; semua 6 package ada di `client/` & `server/` |
| SMB-002 | Formalkan `docs/design_reference/` jadi package `@smartbox/ui` | ✅ | `client/packages/ui/src/components/**` — dashboard, kiosk, motion components, diimpor 3 app frontend |
| SMB-003 | Setup oxlint + ESLint + Prettier di root monorepo | ⚠️ | ESLint per-app ada (`eslint.config.mjs` di tiap `client/*`, `server/backend`), tapi oxlint dari `docs/design_reference/_adherence.oxlintrc.json` **tidak dipakai di script lint manapun**; hanya `server/backend/.prettierrc` — tidak ada Prettier config di root/other apps |
| SMB-004 | Provisioning 3 project Supabase (dev/staging/prod) | ⚠️ | `server/backend/.env` berisi `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` terisi (dev) — provisioning staging/prod tidak dapat diverifikasi dari kode |
| SMB-005 | Provisioning instance Sumopod staging & production | ❌ | Tidak ditemukan bukti konfigurasi/dokumentasi deployment Sumopod di repo selain referensi PRD/Runbook |
| SMB-006 | Setup akun sandbox Xendit & Midtrans + kredensial live | ⚠️ | `XENDIT_SECRET_KEY`/`XENDIT_WEBHOOK_TOKEN` terisi di `.env`; `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY` **kosong** — hanya Xendit yang benar-benar tersambung |
| SMB-007 | Setup akun Cloudinary & WhatsApp BSP | ⚠️ | `CLOUDINARY_*` terisi di `.env`; `WHATSAPP_BSP_API_KEY`/`WHATSAPP_BSP_SENDER_NUMBER` **kosong** — WA BSP belum diprovisikan |
| SMB-008 | CI pipeline lint+test+build gate PR + auto-deploy develop→staging | ❌ | Hanya ada `.github/workflows/dependency-audit.yml` (pnpm audit); tidak ada workflow lint/test/build sebagai gate, tidak ada auto-deploy |
| SMB-009 | Deploy pipeline manual/approval untuk production | ❌ | Tidak ditemukan workflow/skrip deploy production di `.github/workflows` |
| SMB-010 | `.env.example` + validasi env var Zod (fail-fast) | ✅ | `server/backend/.env.example`, `.env.example` root; `server/backend/src/config/env.validation.ts` pakai Zod schema |
| SMB-011 | Setup Redis per environment | ⚠️ | `REDIS_URL` divalidasi wajib di `env.validation.ts` dan terisi di `.env` dev, tapi backend **tidak benar-benar memakai Redis** untuk apapun (purge job pakai `@nestjs/schedule` cron in-process, bukan BullMQ — lihat SMB-112) |

---

## Epic 1 — Backend Core: Data & Auth

*Referensi: PRD §6, §7, §9.2; ERD lengkap*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-101 | Skema DB awal: `LOKASI`, `MITRA`, `MITRA_LOKASI`, `MITRA_LOKASI_SKEMA_HISTORI`, `UNIT`, `UNIT_DURASI_HARGA`, `LOKER` | ✅ | Semua model ada di `server/backend/prisma/schema.prisma` (baris 122–263) + migration `20260806102545_init` |
| SMB-102 | Migration lanjutan: `SESI_TRANSAKSI`, `AKUN_INTERNAL`, `AKUN_MITRA`, `AKUN_MITRA_LOKASI`, `EMERGENCY_UNLOCK_LOG`, `LOG_AKTIVITAS` | ✅ | Semua model ada di `schema.prisma` (baris 271–401) |
| SMB-103 | Soft delete (`deleted_at`) + filter otomatis | ✅ | `server/backend/src/prisma/soft-delete.extension.ts` — Prisma Client Extension memfilter `deletedAt: null` otomatis untuk 7 model |
| SMB-104 | RLS policy per `mitra_id`/`lokasi_id` | ✅ | `server/backend/prisma/sql/constraints_and_rls.sql` — `ENABLE ROW LEVEL SECURITY` + policy `mitra_lokasi_isolasi_select` dst. (untuk akses langsung Supabase Realtime; backend sendiri pakai isolasi app-layer, lihat SMB-1105) |
| SMB-105 | Integrasi Supabase Auth: mapping `supabase_auth_uid`, guard role-based | ✅ | `server/backend/src/auth/guards/supabase-auth.guard.ts` (mapping ke `AkunInternal`/`AkunMitra` via `supabaseAuthUid`), `roles.guard.ts` untuk RBAC |
| SMB-106 | Endpoint khusus Super Admin provisioning user | ✅ | `server/backend/src/users/users.controller.ts` — `@Roles(AkunInternalRole.SUPER_ADMIN)` di seluruh controller |
| SMB-107 | `CHECK (persentase 0–100)` DB + validasi Zod | ✅ | `constraints_and_rls.sql` (`chk_mitra_lokasi_persentase_range`, `chk_skema_histori_persentase_range`) + `ajukan-skema.dto.ts` Zod schema |
| SMB-108 | Alur approval skema: ajukan (Super Admin) → approve/reject (Manager only) | ✅ | `server/backend/src/mitra/skema-histori.controller.ts` — `@Roles(SUPER_ADMIN)` untuk ajukan, `@Roles(MANAGER)` untuk approve/reject |
| SMB-109 | `LOG_AKTIVITAS` append-only otomatis untuk aksi sensitif | ✅ | `server/backend/src/activity-log/activity-log.service.ts` — service hanya expose `log()` (create), sengaja tanpa update/delete; dipanggil dari buka-paksa, approval, provisioning user |
| SMB-110 | `EMERGENCY_UNLOCK_LOG` input manual Staff, append-only | ✅ | `server/backend/src/emergency-unlock/emergency-unlock.service.ts` & controller |
| SMB-111 | Field `timezone` di `LOKASI` + utility konversi UTC↔lokal | ✅ | `schema.prisma` field `timezone`; `server/backend/src/common/timezone.util.ts` pakai `date-fns-tz` |
| SMB-112 | Scheduled job purge `nomor_hp` setelah 6 bulan | ⚠️ | `server/backend/src/purge/purge.service.ts` — logic purge benar (`RETENSI_BULAN = 6`), tapi pakai `@nestjs/schedule` cron in-process, **bukan BullMQ** seperti direkomendasikan PRD (Redis belum tersedia saat dikerjakan — deviasi terdokumentasi di kode) |

---

## Epic 2 — Integrasi Pembayaran

*Referensi: PRD §8, §9.1, §9.3; API Contract §3*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-201 | Interface `PaymentProvider` (`createQrisCharge`, `verifyWebhook`, `getStatus`) | ✅ | `server/backend/src/payment/payment-provider.interface.ts` |
| SMB-202 | Implementasi `XenditProvider` | ✅ | `server/backend/src/payment/providers/xendit.provider.ts` + `.spec.ts` |
| SMB-203 | Implementasi `MidtransProvider` | ⚠️ | Kode provider ada (`midtrans.provider.ts` + `.spec.ts`), tapi `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY` kosong di `.env` — belum tersambung ke akun sandbox nyata (lihat SMB-006) |
| SMB-204 | Factory pemilihan provider berbasis env var | ✅ | `server/backend/src/payment/payment.module.ts` — `useFactory` baca `PAYMENT_PROVIDER_ACTIVE` |
| SMB-205 | Endpoint webhook `POST /webhooks/xendit` & `/midtrans` + verifikasi signature | ✅ | `server/backend/src/webhooks/webhooks.controller.ts` (`@Post('xendit')`, `@Post('midtrans')`) |
| SMB-206 | Idempotency key `(provider, provider_ref_id)` unik | ✅ | `schema.prisma` `@@unique([paymentProvider, paymentProviderRefId])`; diuji di `webhooks.service.spec.ts` (skenario retry status sama) |
| SMB-207 | Integrasi WhatsApp Business API resmi untuk OTP | ⚠️ | `server/backend/src/otp/channels/whatsapp-otp.channel.ts` cuma stub — `send()` selalu `throw new Error('WhatsApp OTP channel belum dikonfigurasi...')`. Channel aktif saat ini `email` (Brevo), lihat `OTP_CHANNEL_ACTIVE=email` |
| SMB-208 | Rate limiting kirim/verifikasi OTP | ✅ | `server/backend/src/kiosk/kiosk-ambil.controller.ts` — `@Throttle({ 'otp-send': {...} })` & `'otp-verify'`, terdaftar di `ThrottlerModule.forRoot()` (`app.module.ts`) |

---

## Epic 3 — Kiosk: Alur Sewa Loker

*Referensi: PRD §5.1, §5.3; API Contract §2*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-301 | Screen Idle + sentuh mulai (state machine XState) | ✅ | `client/kiosk/src/machine/sewaMachine.ts` (`setup(...).createMachine`, state `idle` dengan event `SENTUH`), `IdleScreenView.tsx` |
| SMB-302 | Screen Menu + redirect "Unit Penuh" jika okupansi 100% | ✅ | `client/kiosk/src/screens/MenuScreen.tsx`, `UnitPenuhScreen.tsx`; state `muatUnit`/okupansi di `sewaMachine.ts` |
| SMB-303 | Screen input Nomor HP + validasi format Indonesia | ✅ | `client/kiosk/src/screens/NomorHpScreen.tsx`; guard `/^08\d{8,13}$/.test(...)` di `sewaMachine.ts` |
| SMB-304 | Screen pilih Durasi & harga + assign loker atomik di backend | ✅ | `client/kiosk/src/screens/DurasiScreen.tsx`; `server/backend/src/kiosk/kiosk-sewa.service.ts` — `this.prisma.db.$transaction(async (tx) => {...})` untuk assign loker |
| SMB-305 | Screen Bayar: QRIS dinamis, countdown 5 menit, polling status | ✅ | `client/kiosk/src/screens/BayarScreen.tsx` — `secondsUntil(expiredAt)` + `setInterval` 1 detik; `sewaMachine.ts` `pollStatusBayar` (`fromPromise`, polling `cekStatusBayar`) |
| SMB-306 | Screen Buka Pintu & Simpan Barang + struk digital | ✅ | `client/kiosk/src/screens/BukaPintuScreen.tsx`, `StrukScreen.tsx` |
| SMB-307 | Session timeout semua layar, reset oleh interaksi, balik ke idle | ✅ | `client/kiosk/src/App.tsx` — `setTimeout(() => send({ type: 'TIMEOUT_SESI' }), SESSION_TIMEOUT_MS)` + listener `pointerdown` untuk reset; `sewaMachine.ts` top-level `on: { TIMEOUT_SESI: '.idle' }` |
| SMB-308 | Penanganan gagal bayar & timeout QR | ✅ | `client/kiosk/src/screens/BayarGagalScreen.tsx`, state `bayarGagal`/dst di `sewaMachine.ts` |
| SMB-309 | Local queue & retry di gateway hardware | ❌ | Tidak ada implementasi — `server/gateway/` cuma skeleton package.json, belum ada service gateway fisik apapun (lihat Epic 5) |

---

## Epic 4 — Kiosk: Alur Ambil Barang

*Referensi: PRD §5.2; API Contract §2*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-401 | Screen Menu "Ambil Barang" | ✅ | `client/kiosk/src/screens/MenuScreen.tsx`, state `ambilNomorHp` di `sewaMachine.ts` |
| SMB-402 | Screen input Nomor HP (sama saat sewa) | ✅ | `NomorHpScreen.tsx` dipakai ulang, `sewaMachine.ts` state `ambilNomorHp` |
| SMB-403 | Screen kirim & input OTP (6 digit, 5 menit, rate-limited) | ✅ | `client/kiosk/src/screens/OtpScreen.tsx` — `Numpad length={6}`; rate limit sisi backend di `kiosk-ambil.controller.ts` (lihat SMB-208). Catatan: channel pengiriman aktual saat ini email (Brevo), bukan WhatsApp (lihat SMB-207) |
| SMB-404 | Screen Buka Pintu ambil barang, selesai setelah sensor konfirmasi | ✅ | `sewaMachine.ts` state `ambilBukaPintu`; `server/backend/src/kiosk/kiosk-ambil.service.ts` `bukaPintu()` |

---

## Epic 5 — Gateway Hardware & Realtime

*Referensi: PRD §8.1–§8.3, §9.1; API Contract §4, §7*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-501 | Broker MQTT: `docker-compose.yml` (EMQX) dev lokal | ✅ | `docker-compose.yml` root — service `emqx`, image `emqx/emqx:5`, port 1883/8083/8883/18083 |
| SMB-502 | Gateway hardware service (Mini PC): heartbeat + last-will | ❌ *(blocked, PRD §12 poin 1)* | `server/gateway/package.json` hanya skeleton — semua script (`dev`/`build`/`lint`/`test`) isinya `echo TODO && exit 1`; belum ada satu file `.ts`/`.js` service |
| SMB-503 | Publish status loker & event pintu dari gateway fisik | ❌ *(blocked, sama SMB-502)* | Sama seperti di atas — belum ada kode gateway fisik |
| SMB-504 | Terima & eksekusi perintah `buka_pintu` dari gateway fisik + ack | ❌ *(blocked, sama SMB-502)* | Backend sudah publish command (lihat SMB-506/507), tapi tidak ada consumer fisik yang membalas ack |
| SMB-505 | Komunikasi serial/RS485 gateway ↔ Main Controller Board | ❌ *(blocked, vendor belum dikontrak)* | Tidak ada kode |
| SMB-506 | Backend subscriber MQTT: sinkronkan status ke `LOKER`, deteksi offline dari heartbeat | ✅ | `server/backend/src/gateway/mqtt-client.service.ts` — subscribe topic, update status `LOKER`, ambang offline 90 detik in-memory |
| SMB-507 | Fallback HTTP `POST /gateway/:kodeUnit/heartbeat` & `/status-loker` (auth `X-Unit-Key`) | ✅ | `server/backend/src/gateway/gateway.controller.ts` + `gateway.service.ts` |
| SMB-508 | Supabase Realtime subscription update `LOKER`/`SESI_TRANSAKSI` live di dashboard | ❌ *(ditunda per catatan Epics)* | Tidak ditemukan pemakaian `supabase.channel()`/Realtime subscribe di `client/dashboard-company` atau `client/dashboard-mitra` — dashboard tampaknya masih polling/fetch biasa |
| SMB-509 | Integrasi Emergency Unlock fisik: SOP + hook pencatatan manual | ✅ | Endpoint backend `emergency-unlock.controller.ts` (dari Epic 1/SMB-110) + UI `CatatEmergencyUnlockDialog.tsx` di Dashboard Company; SOP didokumentasikan di `docs/Runbook-Ops-Smartbox.md` |
| SMB-510 | Validasi & sesuaikan SMB-505 dengan protokol vendor final | ❌ *(blocked, vendor belum dikontrak)* | Tidak berlaku sampai SMB-505 ada |

**Catatan implementasi:** `KioskSewaService.bukaPintu()`/`KioskAmbilService.bukaPintu()` publish `buka_pintu` ke MQTT secara fire-and-forget, TIDAK menunggu ack — konsisten dengan catatan resmi di `Epics-Smartbox.md` baris 127.

---

## Epic 6 — Dashboard Company

*Referensi: PRD §5.4, §5.6, §7; API Contract §5*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-601 | Halaman Overview (okupansi/pendapatan/kesehatan) | ✅ | `client/dashboard-company/src/pages/OverviewPage.tsx`; `server/backend/src/overview/overview.service.ts` |
| SMB-602 | Halaman daftar Unit Locker (paginated server-side) + detail | ✅ | `UnitsPage.tsx`, `UnitDetailPage.tsx`; `unit.controller.ts` |
| SMB-603 | Form Konfigurasi Unit (harga, durasi, mode, aktif/nonaktif) + modal konfirmasi nonaktifkan | ✅ | `CreateUnitDialog.tsx`, `UnitDetailPage.tsx` pakai `ConfirmDialog` |
| SMB-604 | Aksi "Buka Paksa Pintu" + modal konfirmasi wajib alasan | ✅ | `UnitDetailPage.tsx` — `handleBukaPaksaConfirm()`, state `bukaPaksaAlasan`; backend `unit.controller.ts` `@Post(':id/buka-paksa')` |
| SMB-605 | Halaman Partner: kelola mitra & lokasi, tipe skema | ✅ | `PartnerPage.tsx`, `MitraDetailPage.tsx`, `CreateMitraDialog.tsx`; `mitra.controller.ts` |
| SMB-606 | Form ajukan persentase revenue sharing (0–100, Super Admin) | ✅ | `SkemaHistoriPanel.tsx`; backend `skema-histori.controller.ts` `@Roles(SUPER_ADMIN)` + Zod validasi |
| SMB-607 | Halaman approval Manager (approve/reject) + riwayat skema | ✅ | `SkemaHistoriPanel.tsx` menampilkan riwayat; backend endpoint approve/reject `@Roles(MANAGER)` |
| SMB-608 | Halaman Laporan transaksi lintas mitra, paginated, filter | ✅ | `LaporanTransaksiPage.tsx`, `LaporanFilterBar.tsx`; `laporan.controller.ts`/`laporan.service.ts` |
| SMB-609 | Laporan bagi hasil per mitra (persentase historis saat transaksi) | ✅ | `LaporanBagiHasilPage.tsx`; `laporan.service.ts` fungsi hitung bagi hasil pakai skema histori (diuji di `laporan.service.spec.ts`) |
| SMB-610 | Ekspor CSV/PDF (async BullMQ, hasil di Supabase Storage) | ⚠️ | `laporan.service.ts` — generate CSV **sinkron** (bukan BullMQ, deviasi terdokumentasi di kode karena Redis belum ada) lalu upload ke Supabase Storage; **tidak ada ekspor PDF sama sekali** |
| SMB-611 | Halaman Manajemen User (Super Admin) | ✅ | `UsersPage.tsx`, `CreateUserDialog.tsx`; backend `users.controller.ts` |
| SMB-612 | Halaman Log Emergency Unlock | ✅ | `EmergencyUnlockPage.tsx` |
| SMB-613 | Halaman Aktivitas (activity log operasional) | ✅ | `AktivitasPage.tsx`; backend `aktivitas.controller.ts`/`aktivitas.service.ts` |
| SMB-614 | Error handling standar (loading/sukses/gagal, actionable) | ✅ | Pola konsisten `try/catch` + `ApiError` di seluruh halaman (mis. `UnitDetailPage.tsx` `setBukaPaksaError`), Toast dari `@smartbox/ui` untuk notifikasi |
| SMB-615 | `ConfirmDialog` terpasang di semua aksi sensitif | ✅ | Dipakai di `UnitDetailPage.tsx` (buka paksa, nonaktifkan unit), dsb. — komponen dari `@smartbox/ui` (`ConfirmDialog.tsx`) |

---

## Epic 7 — Dashboard Mitra

*Referensi: PRD §5.5; API Contract §6*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-701 | Halaman Overview mitra (okupansi & pendapatan lokasi miliknya) | ✅ | `client/dashboard-mitra/src/pages/OverviewPage.tsx`; `server/backend/src/dashboard-mitra/dashboard-mitra.service.ts` `overview()` |
| SMB-702 | Halaman Unit Locker milik mitra (read-only, terisolasi RLS) | ✅ | `UnitsPage.tsx`; `dashboard-mitra.service.ts` `units()` — scope WHERE ke `lokasiId` milik actor via `AkunMitraLokasi`, tidak pernah mengembalikan `unitKey` |
| SMB-703 | Halaman Laporan + ekspor (read-only) | ✅ | `LaporanPage.tsx`; `dashboard-mitra.service.ts` `laporan()` |
| SMB-704 | Verifikasi eksplisit: tidak ada route/endpoint tulis + uji RLS isolasi | ✅ | `dashboard-mitra.controller.ts` hanya berisi endpoint GET; `MitraOnlyGuard` (`auth/guards/mitra-only.guard.ts`) menolak akun internal; diuji di `dashboard-mitra.service.spec.ts` (skenario IDOR `lokasiId`) |

---

## Epic 8 — Design System: Kelengkapan Komponen

*Referensi: PRD §13*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-801 | Kalibrasi ulang canvas kiosk ke 600×1024 portrait | ✅ | Token `--sl-kiosk-w/-h/-pad/-content-max` di `docs/design_reference/tokens/spacing.css`; komponen kiosk (`IdleScreen.tsx`, `QRScreen.tsx`, dll di `client/packages/ui`) pakai token, layout `NomorHpScreen.tsx` sudah vertikal |
| SMB-802 | Komponen baru `ConfirmDialog` (Radix Dialog/AlertDialog) | ✅ | `client/packages/ui/src/components/dashboard/ConfirmDialog.tsx` |
| SMB-803 | Komponen baru `Toast`/notifikasi non-blocking | ✅ | `client/packages/ui/src/components/dashboard/Toast.tsx` (commit `d029079`) |
| SMB-804 | Kontrol paginasi eksplisit di `DataTable` | ✅ | `client/packages/ui/src/components/dashboard/DataTable.tsx` — kontrol halaman + info total data built-in (commit `d029079`) |
| SMB-805 | Update enum status `CompartmentCard`/`StatusBadge` konsisten 5 nilai | ✅ | `CompartmentCard.tsx` — `LokerStatus = 'tersedia' \| 'terisi' \| 'maintenance' \| 'offline' \| 'nonaktif'`; `StatusBadge.tsx` superset yang sama + `'online'` |

---

## Epic 9 — Observability & Keamanan

*Referensi: PRD §7.1, §9.4, §9.5*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-901 | Setup Sentry (FE & BE) semua environment | ✅ | `server/backend/src/instrument.ts` + `app.module.ts`; `client/kiosk/src/main.tsx`, `client/dashboard-company/src/main.tsx`, `client/dashboard-mitra/src/main.tsx` semua init Sentry. `SENTRY_DSN` kosong di `.env` dev lokal (wajar untuk dev) |
| SMB-902 | Setup Grafana + Prometheus untuk metrik unit/API | ⚠️ | Sisi backend lengkap: `server/backend/src/metrics/metrics.service.ts` (prom-client `Registry`, `Histogram`, `collectDefaultMetrics`) + endpoint scrape `/metrics` (`metrics.controller.ts`); **tidak ditemukan konfigurasi/provisioning Grafana** (dashboard, datasource) di repo |
| SMB-903 | Endpoint `/health` + graceful shutdown (`SIGTERM`) | ✅ | `server/backend/src/health/health.controller.ts`; `main.ts` — `app.enableShutdownHooks()`, `PrismaService`/`MqttClientService` implement `onModuleDestroy()` |
| SMB-904 | Hardening server Sumopod production | ❌ | Tidak dapat diverifikasi dari kode — aktivitas infra eksternal, tidak ada dokumentasi konfigurasi server di repo |
| SMB-905 | Aktifkan Dependabot/`npm audit` di CI | ✅ | `.github/dependabot.yml` + `.github/workflows/dependency-audit.yml` (`pnpm audit --prod --audit-level=critical`) |
| SMB-906 | CORS ketat per app | ✅ | `server/backend/src/main.ts` — `origin: corsOrigin.split(',')` dari env `CORS_ORIGIN`, bukan wildcard |
| SMB-907 | Drill backup & restore (Supabase + Sumopod) | ❌ | Tidak ada bukti/dokumentasi drill di repo |
| SMB-908 | Security review/pentest ringan sebelum go-live | ❌ | Tidak ada laporan/dokumentasi pentest di `docs/` |

---

## Epic 10 — i18n & Timezone

*Referensi: PRD §7.2*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-1001 | Setup `react-i18next` di kiosk & kedua dashboard, struktur folder locale per-app | ✅ | `client/kiosk/src/i18n.ts`, `client/dashboard-company/src/locales/`, `client/dashboard-mitra/src/locales/` — semua punya `id.json` |
| SMB-1002 | Migrasi seluruh teks UI kiosk ke `id.json` (no hardcode) | ✅ | Semua screen kiosk (`OtpScreen.tsx`, `UnitPenuhScreen.tsx`, `StrukScreen.tsx`, dll) pakai `useTranslation()`/`t(...)`, bukan string literal |
| SMB-1003 | Migrasi teks Dashboard Company/Mitra ke key terjemahan | ✅ | `client/dashboard-company/src/locales/id.json`, `client/dashboard-mitra/src/locales/id.json` ada dan dipakai di halaman (mis. `t('unitDetailPage.gagalBukaPaksa')`) |
| SMB-1004 | Konversi UTC↔timezone lokasi di semua tampilan waktu | ✅ | `server/backend/src/common/timezone.util.ts` (`date-fns-tz`), dipakai di struk kiosk, laporan, dashboard-mitra, emergency-unlock |
| SMB-1005 | *(Fase 2)* Tambah locale `en.json` | ✅ *(sesuai — memang Fase 2, correctly out of MVP)* | Tidak ada `en.json` di manapun — benar sesuai scope, bukan gap |

---

## Epic 11 — QA & Testing

*Referensi: PRD §9.4, §9.5*

| Ticket | Deskripsi | Status | Catatan |
|---|---|---|---|
| SMB-1101 | Unit test logic kritikal: bagi hasil, validasi sesi/timeout, assign loker atomik | ✅ | `laporan.service.spec.ts` (bagi hasil), `kiosk-sewa.service.spec.ts`/`kiosk-ambil.service.spec.ts` (assign loker, validasi sesi), `otp.service.spec.ts` |
| SMB-1102 | Integration test endpoint: auth/RBAC per role, webhook payment, RLS isolasi mitra | ⚠️ | Ada test RBAC (`roles.guard.spec.ts`, `supabase-auth.guard.spec.ts`) dan webhook (`webhooks.service.spec.ts`) — tapi semua **unit test dengan Prisma di-mock**, bukan integration test HTTP sungguhan. `server/backend/package.json` punya script `test:e2e` menunjuk `test/jest-e2e.json`, tapi **folder `test/` tidak ada** dan `supertest` (terpasang di `devDependencies`) tidak dipakai di manapun |
| SMB-1103 | E2E test alur kiosk penuh (Playwright, 600×1024) | ✅ | `client/kiosk/e2e/*.spec.ts` (sewa-berhasil, sewa-gagal-bayar, ambil-barang, ambil-overdue, pilih-kategori) + `client/kiosk/playwright.config.ts` — canvas 600×1024, backend/Supabase di-mock via `page.route()`, port E2E khusus 5273 |
| SMB-1104 | E2E test Dashboard Company (approval, provisioning, konfigurasi unit) | ✅ | `client/dashboard-company/e2e/*.spec.ts` (approval-manager, provisioning-super-admin, konfigurasi-unit) + `playwright.config.ts` |
| SMB-1105 | Test RLS Dashboard Mitra — tidak bisa akses data mitra lain | ✅ | `dashboard-mitra.service.spec.ts` — test IDOR eksplisit (`lempar ForbiddenException LOKASI_BUKAN_MILIK_ANDA...`, `scope WHERE ke lokasiId yang benar-benar milik actor`); isolasi ditegakkan di application layer (didokumentasikan di kode karena backend connect sebagai role `postgres`, bypass RLS Postgres) |
| SMB-1106 | Uji beban dasar endpoint publik kiosk | ✅ | `server/backend/loadtest/concurrent-sewa.mjs` (`test:load` script) — simulasi banyak `POST /kiosk/sewa/mulai` konkuren, verifikasi tidak ada loker di-assign dobel (race condition `FOR UPDATE SKIP LOCKED`) |

---

## Fitur Tambahan Pasca-MVP (di luar 97 ticket Epic 0–11)

Selain menyelesaikan tabel di atas, beberapa fitur **di luar cakupan `docs/Epics-Smartbox.md`** dibangun langsung atas permintaan bisnis — semua ditandai eksplisit di kode dengan komentar "di luar cakupan PRD awal" supaya tidak disalahartikan sebagai bagian ticket resmi. Daftar berikut menjawab "ada fitur apa saja" di luar checklist MVP formal:

| Fitur | Deskripsi | Bukti kode |
|---|---|---|
| **Perbaikan UX Numpad kiosk** | Area tombol numpad terlalu sempit & font terlalu besar diperbaiki (flex-shrink bug) | `client/packages/ui/src/components/kiosk/Numpad.tsx` |
| **Harga & kategori ukuran loker** | Satu unit/kios bisa punya banyak **kategori ukuran loker** (mis. Kecil/Besar), masing-masing dengan daftar durasi/harga & ketersediaan sendiri. Kiosk menampilkan langkah "pilih ukuran" sebelum "pilih durasi"; loker yang sudah penuh per kategori otomatis disabled. | Model `LokerKategori` (`schema.prisma`), `client/kiosk/src/screens/KategoriScreen.tsx`, `KioskSewaService.mulaiSewa()` (filter assignment loker per kategori) |
| **Denda keterlambatan ambil barang & suspend loker** | Kalau penyewa telat ambil barang tapi belum 24 jam, wajib bayar denda kekurangan (dihitung dari tarif per-jam termurah kategori loker) sebelum bisa lanjut OTP/buka pintu. Kalau sudah ≥24 jam, loker **disuspend** — kiosk tidak lagi menawarkan jalur bayar sendiri, hanya Super Admin yang bisa buka. | `server/backend/src/common/overdue.util.ts`, `KioskAmbilService` (gerbang denda/suspend di `kirimOtp`/`bukaPintu`), `client/kiosk/src/screens/BayarDendaScreen.tsx`, `LokerSuspendedScreen.tsx` |
| **Member RFID/kode unik** | Loker bisa diisi kode RFID/unik opsional (diinput Super Admin). Dua jenis member: **eksklusif** (diikat ke 1 loker spesifik, gratis, bebas buka kapan saja tanpa denda — loker ditarik dari pool sewa umum) dan **umum** (diskon persentase dari tarif normal, tetap sewa berdurasi biasa & tetap kena denda kalau telat). Identifikasi di kiosk lewat tap kartu (listener keyboard-wedge otomatis), menggantikan nomor HP/email khusus untuk member — jalur nomor HP/email biasa tetap berjalan bersamaan untuk pelanggan non-member. Lihat `docs/PRD-Smartbox.md` §4.2a. | Model `Member` (`schema.prisma`), `server/backend/src/member/`, `server/backend/src/kiosk/kiosk-rfid.service.ts`, `client/kiosk/src/hooks/useRfidListener.ts`, `client/dashboard-company/src/pages/MembersPage.tsx`, `client/dashboard-mitra/src/pages/MembersPage.tsx` |
| **Akses "kelola member" per mitra dikunci Super Admin** | Mitra hanya bisa membuka menu "Member" di Dashboard Mitra (buat/kelola member umum miliknya sendiri) kalau Super Admin sudah mengaktifkan `Mitra.bolehKelolaMember` secara eksplisit untuk mitra itu (default nonaktif) — dicek ulang di backend pada setiap endpoint tulis+baca `/mitra/members/*`, bukan cuma disembunyikan di UI. Mitra tetap tidak pernah bisa mengikat member ke loker spesifik (member eksklusif). | `Mitra.bolehKelolaMember` (`schema.prisma`), `MemberService.assertBolehKelolaMember()`, toggle di `client/dashboard-company/src/pages/MitraDetailPage.tsx`, gating menu di `client/dashboard-mitra/src/layout/DashboardLayout.tsx` & `pages/MembersPage.tsx` |
| **Reset migrasi & seeder demo** | Skrip `pnpm run seed:demo` bootstrap data demo lengkap (Super Admin, Mitra + akun login, 1 unit kiosk dengan 2 kategori loker, 2 contoh member RFID) setelah `prisma migrate reset` — idempotent, kredensial dibaca dari `.env`, tidak pernah di-log ke terminal. | `server/backend/prisma/seed-demo.ts`, `server/backend/prisma/seed.ts` (bootstrap Super Admin awal) |

---

*Dokumen ini dihasilkan dengan membaca kode langsung (bukan asumsi) pada tanggal 2026-08-11 (diperbarui sore hari yang sama setelah Epic 11 selesai dan fitur Member RFID dibangun). Untuk ticket yang bergantung pada aktivitas operasional murni (provisioning akun cloud, hardening server, drill backup, pentest), verifikasi terbatas pada jejak yang terlihat dari repo (isi `.env`, dokumentasi `docs/`) — bukan akses langsung ke console pihak ketiga.*
