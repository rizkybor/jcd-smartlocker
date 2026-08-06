# API Contract — Smartbox (Sewa Smart Locker)

**Sumber:** diturunkan dari `docs/PRD-Smartbox.md` (alur §5, model data §6, keamanan §7.1, integrasi §8, tech stack §9) dan `docs/ERD-Smartbox.md`. Dokumen ini mendefinisikan kontrak antara **Kiosk**, **Backend API**, **Dashboard Company**, **Dashboard Mitra**, **Gateway Hardware**, dan **provider eksternal** (Xendit/Midtrans, WhatsApp BSP).

**Status:** draft kontrak awal — nama endpoint/payload bisa berubah saat implementasi, tapi struktur & prinsipnya (auth, RBAC, format error, pagination) mengikat sejak sekarang.

---

## 1. Konvensi Umum

### 1.1 Base URL per lingkungan
Mengikuti PRD §14 (Strategi Lingkungan):

| Lingkungan | Base URL (indikatif) |
|---|---|
| Development | `http://localhost:3000/api` |
| Staging | `https://api-staging.smartbox.example/api` |
| Production | `https://api.smartbox.example/api` |

### 1.2 Autentikasi

| Klien | Mekanisme |
|---|---|
| **Kiosk** | Tanpa login pengguna (§1, prinsip "tanpa aplikasi") — endpoint publik tapi rate-limited (§7.1) dan diikat ke `kode_unit` yang terdaftar. Kiosk sendiri (gateway hardware) diautentikasi ke backend pakai **API key per-unit** (bukan akun manusia), dikirim via header `X-Unit-Key`. |
| **Dashboard Company** | Supabase Auth JWT (§9.2) di header `Authorization: Bearer <token>`. Backend verifikasi token, ambil role dari tabel `AKUN_INTERNAL` (super_admin/ops/manager/staff), tegakkan RBAC per endpoint (§7). |
| **Dashboard Mitra** | Sama (Supabase Auth JWT), tapi token mengikat ke `AKUN_MITRA` → hanya endpoint di §5 (read-only) yang bisa diakses; tidak ada endpoint tulis untuk role ini di level routing backend sama sekali (§5.5 — bukan cuma disembunyikan di UI). |
| **Webhook provider** (Xendit/Midtrans) | Verifikasi signature bawaan SDK provider (§8, §9.3) — bukan JWT. Request tanpa signature valid ditolak `401` sebelum diproses lebih lanjut. |
| **Gateway hardware → backend** | API key per-unit (sama seperti kiosk, karena kiosk software & gateway hardware berjalan di Mini PC yang sama, §8.1) + MQTT client credential terpisah untuk jalur realtime (§9.1). |

### 1.3 Format response standar

**Sukses:**
```json
{
  "data": { },
  "meta": { }
}
```

**Gagal** (selaras prinsip §5.6/§13.1 — pesan actionable, bukan pesan teknis mentah ke kiosk):
```json
{
  "error": {
    "code": "LOKER_TIDAK_TERSEDIA",
    "message": "Loker yang dipilih baru saja terisi. Silakan pilih loker lain.",
    "requestId": "a1b2c3d4"
  }
}
```
- `code` — mesin-terbaca, dipakai frontend untuk logic (mis. redirect ke layar tertentu).
- `message` — sudah dalam Bahasa Indonesia siap tampil (i18n key di-resolve di backend untuk kiosk, atau dikirim sebagai key untuk di-resolve frontend dashboard — lihat §7.2 catatan i18n, keputusan detail ini menyusul saat implementasi).
- `requestId` — untuk korelasi ke log terstruktur (`pino`, §9.3) saat investigasi.
- **Kode error hardware/internal tidak pernah dikirim ke kiosk** (§5.6) — hanya `requestId`/nomor tiket.

### 1.4 Pagination (wajib untuk semua list endpoint — §5.6)

Request: `?page=1&pageSize=25&sort=-created_at`

Response:
```json
{
  "data": [ ],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 342,
    "totalPages": 14
  }
}
```
`pageSize` maksimum dibatasi backend (mis. 100) — tidak boleh diminta ambil semua data sekaligus (§5.6).

### 1.5 Idempotency

- Webhook payment: idempotency key `(provider, provider_ref_id)` — request kedua dengan kombinasi sama tidak memproses ulang transaksi, langsung kembalikan status tersimpan (§8, ERD `SESI_TRANSAKSI.payment_idempotency_key`).
- Endpoint kiosk yang membuat data (`POST /kiosk/sewa/mulai`, dst.) menerima header `Idempotency-Key` opsional dari kiosk untuk retry aman saat koneksi terputus (§5.3).

### 1.6 Rate limiting (§7.1)

| Endpoint | Batas indikatif |
|---|---|
| `POST /kiosk/ambil/kirim-otp` | 3x / nomor HP / 15 menit |
| `POST /kiosk/ambil/verifikasi-otp` | 5x percobaan / sesi, lalu terkunci |
| `POST /webhooks/*` | Tidak dibatasi rate (provider legitimate), tapi wajib lolos verifikasi signature dulu |
| Endpoint dashboard | Rate limit umum per akun untuk cegah abuse, longgar dibanding endpoint publik kiosk |

---

## 2. Kiosk API (publik, per-unit)

Semua endpoint di bawah diawali `/kiosk` dan mengirim `X-Unit-Key` (§1.2). Alur mengikuti PRD §5.1–§5.2.

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/kiosk/unit/status` | Status unit saat ini: okupansi, apakah unit penuh, daftar durasi & harga (§5.1 langkah 2, 4) | `X-Unit-Key` |
| `POST` | `/kiosk/sewa/validasi-hp` | Validasi format nomor HP Indonesia (§5.1 langkah 3) — validasi ringan, tidak membuat data | `X-Unit-Key` |
| `POST` | `/kiosk/sewa/mulai` | Buat `SESI_TRANSAKSI` baru berstatus `pending`: input nomor HP + `unit_durasi_harga_id` → backend assign `loker_id` otomatis (loker `tersedia` pertama) | `X-Unit-Key` |
| `POST` | `/kiosk/sewa/:sesiId/bayar` | Buat charge QRIS via `PaymentProvider` aktif (§8) → return `qr_image_url` + `expired_at` (5 menit, §5.1) | `X-Unit-Key` |
| `GET` | `/kiosk/sewa/:sesiId/status` | Poll status bayar (`pending`/`paid`/`failed`/`expired`) — dipakai kiosk sambil menunggu webhook; realtime lewat Supabase Realtime jadi opsi lebih responsif (§9.2) | `X-Unit-Key` |
| `POST` | `/kiosk/sewa/:sesiId/buka-pintu` | Hanya berhasil jika `status_bayar = paid` — trigger perintah buka pintu ke gateway hardware (§8.2), lalu tunggu konfirmasi sensor pintu tertutup sebelum sesi jadi `aktif` | `X-Unit-Key` |
| `GET` | `/kiosk/sewa/:sesiId/struk` | Data struk digital: no. loker, durasi, berlaku sampai (dikonversi ke timezone lokasi, §7.2), ID transaksi (§5.1 langkah 6) | `X-Unit-Key` |
| `POST` | `/kiosk/ambil/mulai` | Input nomor HP untuk ambil barang → cari `SESI_TRANSAKSI` aktif dengan nomor HP cocok (§5.2 langkah 2) | `X-Unit-Key` |
| `POST` | `/kiosk/ambil/kirim-otp` | Kirim OTP 6 digit via WhatsApp (§8) ke nomor HP terkait, berlaku 5 menit | `X-Unit-Key`, rate-limited (§1.6) |
| `POST` | `/kiosk/ambil/verifikasi-otp` | Verifikasi OTP → jika cocok, izinkan buka pintu | `X-Unit-Key`, rate-limited |
| `POST` | `/kiosk/ambil/:sesiId/buka-pintu` | Trigger buka pintu loker terkait, sesi jadi `selesai` setelah sensor konfirmasi tertutup (§5.2 langkah 4) | `X-Unit-Key` |

**Catatan alur kritis — assign loker otomatis (`POST /kiosk/sewa/mulai`):**
Harus **atomik** di level database (transaksi SQL dengan row lock atau `SELECT ... FOR UPDATE` pada kandidat `LOKER`) supaya dua kiosk/sesi tidak bisa mengklaim loker `tersedia` yang sama secara bersamaan (race condition) — mengingat unit hanya punya satu Mini PC yang menjalankan satu sesi kiosk pada satu waktu (§8.1), risiko ini lebih ke skenario retry ganda dari kiosk yang sama, tapi tetap wajib diproteksi di level database, bukan asumsi aplikasi.

---

## 3. Webhook Payment API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/webhooks/xendit` | Terima notifikasi status pembayaran dari Xendit — verifikasi signature (`x-callback-token` header), update `SESI_TRANSAKSI.status_bayar` |
| `POST` | `/webhooks/midtrans` | Sama, format signature Midtrans berbeda (§8, §9.3) — ditangani oleh `MidtransProvider` masing-masing |

**Alur (via `PaymentProvider` abstraction, §8/§9.3):**
```
Xendit/Midtrans → POST /webhooks/{provider}
                     │
                     ▼
        verifyWebhook(payload, signature)  →  gagal → 401, log, stop
                     │  berhasil
                     ▼
        cek idempotency (provider, provider_ref_id) sudah diproses? → ya → return 200 tanpa proses ulang
                     │  belum
                     ▼
        update SESI_TRANSAKSI.status_bayar
                     │
                     ▼
        publish event realtime (Supabase Realtime, §9.2) → kiosk polling/dashboard update otomatis
                     │
                     ▼
        return 200 ke provider (wajib cepat, <5 detik — provider retry kalau timeout)
```
Response ke provider **selalu 200** kalau payload sudah diverifikasi & diproses (termasuk kasus idempotent-duplicate) — response non-200 memicu retry provider yang tidak perlu.

---

## 4. Gateway Hardware ↔ Backend

Sesuai §9.1: **MQTT untuk status realtime, bukan HTTP polling** dari tiap unit. HTTP dipakai untuk aksi request/response (kiosk API di §2), MQTT untuk laporan status satu arah.

### 4.1 Topik MQTT

| Topik | Arah | Payload (ringkas) | Keterangan |
|---|---|---|---|
| `unit/{kode_unit}/heartbeat` | Gateway → Broker | `{ "timestamp": "...", "status": "online" }` | Interval tetap (mis. tiap 30 detik); **last-will** MQTT terpasang supaya broker otomatis publish `offline` kalau koneksi gateway putus tanpa graceful disconnect (§9.1) |
| `unit/{kode_unit}/loker/{nomor}/status` | Gateway → Broker | `{ "status": "tersedia/terisi/maintenance/offline/nonaktif" }` | Enum 5 nilai resmi (§6, ERD `LOKER.status`) — backend subscribe & sinkronkan ke database |
| `unit/{kode_unit}/pintu/{nomor}/event` | Gateway → Broker | `{ "event": "terbuka/tertutup/macet", "timestamp": "..." }` | Sensor pintu — `macet` memicu alur eskalasi Ops (§5.3) |
| `unit/{kode_unit}/perintah` | Backend → Broker → Gateway | `{ "aksi": "buka_pintu", "loker": "...", "sesi_id": "..." }` | Perintah dari backend (dipicu endpoint `/kiosk/*/buka-pintu` di §2, atau buka paksa dari Dashboard Company §5) |
| `unit/{kode_unit}/perintah/ack` | Gateway → Broker | `{ "sesi_id": "...", "hasil": "sukses/gagal", "alasan": "..." }` | Konfirmasi perintah dieksekusi — backend menunggu ini sebelum menandai sesi aktif/selesai |

QoS minimal **1** (at-least-once) untuk topik status/perintah — kehilangan pesan status loker/pintu tidak bisa diterima untuk sistem yang menangani akses fisik & uang.

### 4.2 Fallback HTTP (opsional, saat MQTT tidak tersedia)
`POST /gateway/{kode_unit}/heartbeat` dan `POST /gateway/{kode_unit}/status-loker` sebagai fallback kalau broker MQTT sedang down — bukan jalur utama, tapi mencegah unit terlihat "hilang total" dari monitoring saat cuma broker yang bermasalah.

---

## 5. Dashboard Company API (internal, multi-role — §5.4)

Semua endpoint diawali `/company`, wajib `Authorization: Bearer <supabase-jwt>`. Kolom **Role** menunjukkan siapa yang **boleh mengakses** — backend menegakkan ini di guard, bukan cuma UI (§7).

### 5.1 Overview & Unit

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/company/overview` | Ringkasan semua unit/lokasi (okupansi, pendapatan, kesehatan) | super_admin, ops, manager |
| `GET` | `/company/units` | Daftar unit, **paginated** (§5.6), filter per lokasi/mitra | super_admin, ops |
| `GET` | `/company/units/:id` | Detail unit + daftar loker + riwayat transaksi | super_admin, ops |
| `POST` | `/company/units` | Buat unit baru (kode, lokasi, varian kompartemen, harga/durasi awal) | super_admin |
| `PATCH` | `/company/units/:id` | Ubah konfigurasi unit (harga, durasi, mode pemakaian `berbayar`/`gratis` §4.4a, aktif/nonaktif) | super_admin |
| `DELETE` | `/company/units/:id` | **Soft delete** (`deleted_at`, §6) — bukan hapus fisik; wajib disertai body `{ "alasan": "..." }` untuk `LOG_AKTIVITAS` | super_admin |
| `PATCH` | `/company/lokers/:id/status` | Override manual status loker (mis. tandai `maintenance`) | super_admin, ops |
| `POST` | `/company/units/:id/buka-paksa` | Remote force-open pintu tertentu (§2 Tujuan Produk) — **wajib** body `{ "loker_id", "alasan" }`, dicatat ke `LOG_AKTIVITAS` kategori `keamanan` (§7.1) | super_admin, ops |

### 5.2 Partner (Mitra & Skema Bagi Hasil)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/company/mitra` | Daftar mitra, paginated | super_admin, ops, manager |
| `POST` | `/company/mitra` | Buat mitra baru + relasi lokasi (`MITRA_LOKASI`) | super_admin |
| `PATCH` | `/company/mitra/:id` | Ubah data dasar mitra | super_admin |
| `POST` | `/company/mitra-lokasi/:id/ajukan-skema` | **Super Admin mengajukan** persentase baru (0–100, §12 poin 2) → buat baris `MITRA_LOKASI_SKEMA_HISTORI` status `pending` | super_admin |
| `POST` | `/company/skema-histori/:id/approve` | **Manager approve** — baris jadi `approved`, `persentase_aktif` di `MITRA_LOKASI` ter-update, baris lama diberi `berlaku_sampai` | **manager only** |
| `POST` | `/company/skema-histori/:id/reject` | Manager tolak pengajuan | **manager only** |
| `GET` | `/company/mitra-lokasi/:id/skema-histori` | Riwayat lengkap persentase (audit trail, ERD §`MITRA_LOKASI_SKEMA_HISTORI`) | super_admin, ops, manager |

`POST /skema-histori/:id/approve` **menolak** request dari role selain `manager` dengan `403`, bahkan dari `super_admin` — approval adalah wewenang eksklusif Manager (§10, §12 poin 2), termasuk kalau Super Admin yang sama juga berperan ganda (tidak dianjurkan secara organisasi, tapi kalaupun terjadi, dicegah di kode).

### 5.3 Laporan

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/company/laporan/transaksi` | Laporan transaksi lintas mitra, paginated, filter tanggal/lokasi/mitra | super_admin, ops, manager |
| `GET` | `/company/laporan/bagi-hasil` | Laporan bagi hasil per mitra (pakai `persentase` yang berlaku saat transaksi terjadi, bukan persentase sekarang — §10) | super_admin, ops, manager |
| `POST` | `/company/laporan/export` | Generate ekspor CSV/PDF (async via BullMQ, §9.2), hasil disimpan Supabase Storage, response berisi URL unduh | super_admin, ops, manager |

### 5.4 Manajemen User (khusus Super Admin — §5.4, §7)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/company/users` | Daftar akun internal, paginated | **super_admin only** |
| `POST` | `/company/users` | Buat akun internal baru + tetapkan role (manager/staff/ops/super_admin) — panggil Supabase Admin API di backend (§9.2) | **super_admin only** |
| `PATCH` | `/company/users/:id/role` | Ubah role akun | **super_admin only** |
| `DELETE` | `/company/users/:id` | Soft delete (nonaktifkan) akun | **super_admin only** |

Endpoint di grup ini **menolak semua role selain `super_admin`** di level guard backend, termasuk `manager` — sesuai keputusan eksplisit "hanya Super Admin yang boleh memberi akses" (§7).

### 5.5 Emergency Unlock & Aktivitas

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| `GET` | `/company/emergency-unlock-log` | Riwayat pemakaian kunci fisik, paginated | super_admin, ops (lihat) |
| `POST` | `/company/emergency-unlock-log` | **Staff** input manual setelah kejadian fisik (§5.3) — dicatat `append-only` (§7.1) | staff, super_admin |
| `GET` | `/company/aktivitas` | Activity log operasional (§5.6) — siapa mengubah apa, kapan | super_admin, ops, manager |

---

## 6. Dashboard Mitra API (eksternal, read-only — §5.5)

Semua endpoint diawali `/mitra`, wajib JWT `AKUN_MITRA`. **Tidak ada satu pun endpoint `POST`/`PATCH`/`DELETE` di grup ini** — ini bukan kelalaian dokumentasi, tapi keputusan desain: kalau suatu saat ada kebutuhan mitra mengubah sesuatu, itu harus jadi keputusan sadar baru (dan kemungkinan tetap lewat alur approval Dashboard Company), bukan ditambahkan diam-diam.

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/mitra/overview` | Okupansi & pendapatan lokasi miliknya |
| `GET` | `/mitra/units` | Unit-unit di lokasinya saja — **RLS di level database** (§9.2) memfilter otomatis by `mitra_id`, bukan filter di kode aplikasi (defense in depth) |
| `GET` | `/mitra/laporan` | Riwayat transaksi & bagi hasil miliknya, paginated |
| `POST` | `/mitra/laporan/export` | Ekspor laporan miliknya sendiri — satu-satunya `POST` di grup ini, tapi tetap **read-side operation** (generate file dari data yang sudah ada, bukan menulis data baru ke entitas inti) |

---

## 7. Realtime (Supabase Realtime + MQTT)

| Channel/Topik | Konsumen | Isi |
|---|---|---|
| Supabase Realtime — tabel `LOKER` | Dashboard Company, Dashboard Mitra (RLS-filtered) | Update status loker langsung ke UI tanpa polling (§9.2) |
| Supabase Realtime — tabel `SESI_TRANSAKSI` | Dashboard Company, Dashboard Mitra | Update okupansi/laporan realtime |
| MQTT `unit/+/heartbeat` | Backend (subscriber) | Deteksi unit offline (last-will, §4.1) → tulis ke `LOKASI`/`UNIT` status kesehatan → trigger alert (Sentry/Grafana, §9.4) |

Kiosk **tidak** subscribe Supabase Realtime langsung (menjaga kiosk software tetap sederhana & tidak bergantung koneksi persisten ke Supabase) — kiosk pakai polling `GET /kiosk/sewa/:sesiId/status` (§2) selama menunggu pembayaran, dengan interval pendek (mis. 2 detik) dibatasi durasi QR (5 menit).

---

## 8. Yang belum final

- Nama endpoint & struktur payload di atas masih level kontrak konsep — akan disesuaikan format persisnya (mis. penamaan `camelCase` vs `snake_case` di JSON) saat setup NestJS module pertama.
- Detail resolusi i18n untuk `message` di format error (§1.3) — apakah backend selalu mengirim Bahasa Indonesia jadi (untuk kiosk) atau translation key (untuk dashboard yang bisa multi-bahasa di Fase 2, §7.2) — perlu diputuskan saat modul i18n mulai diimplementasikan.
- Endpoint spesifik untuk metode akses Fase 2 (RFID/PIN/Face Recognition, §4.2, §12 poin 6) belum didetailkan — menunggu verifikasi hardware dulu, supaya tidak mendesain API untuk hardware yang mungkin belum ada.
