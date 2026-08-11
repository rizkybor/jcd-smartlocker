# PRD — Smartbox (Sewa Smart Locker)

**Pemilik produk:** PT Jendela Cakra Digital
**Status:** Draft v1
**Tanggal:** 2026-08-06
**Referensi desain:** `docs/Prototipe UI Kiosk Sewa Smart Locker/` (kiosk-app.jsx, dash-app.jsx, dash-super.jsx, dash-mitra.jsx, dash-data.jsx)
**Referensi bisnis & hardware:** `docs/Sewa-Smart-Locker (3).pdf` (Company Profile Smart Locker, PT Jendela Cakra Digital, 2026)
**Referensi design system:** `docs/design_reference/` (foundations — tokens, komponen kiosk/dashboard, guideline — lihat §13)
**ERD & skema database:** `docs/ERD-Smartbox.md` (diturunkan dari §6, mencakup semua keputusan soft delete/timezone/retensi/skema bagi hasil)
**API contract:** `docs/API-Contract-Smartbox.md` (kontrak Kiosk↔Backend↔Dashboard Company/Mitra↔Gateway Hardware↔provider eksternal)
**Breakdown epic & ticket:** `docs/Epics-Smartbox.md` (backlog awal siap sprint planning, 13 epic dari fondasi repo sampai backlog Fase 2)

---

## 1. Latar Belakang & Masalah

Banyak lokasi publik/semi-publik (apartemen, coworking space, kampus, mal, gym) butuh tempat penitipan barang sementara yang bisa diakses tanpa staf jaga. Model bisnisnya bagi hasil: **Smartbox** menyediakan unit locker + platform, **mitra lokasi** menyediakan tempat, pendapatan sewa dibagi dua pihak.

Prototipe UI yang sudah ada menunjukkan dua permukaan produk:
- **Kiosk** — layar sentuh di badan unit locker, dipakai pengguna akhir untuk menyewa & mengambil barang.
- **Dashboard web** — dipakai internal (Super Admin) dan mitra (Mitra) untuk memantau unit, transaksi, dan bagi hasil.

Prototipe ini murni tampilan (data dummy, tanpa backend/hardware nyata) dan menjadi acuan alur, bukan kode produksi.

## 2. Tujuan Produk

1. Pengguna akhir bisa menyewa & mengambil loker sepenuhnya mandiri (self-service), rata-rata < 60 detik per transaksi, tanpa aplikasi.
2. Mitra lokasi bisa memantau okupansi & pendapatan unitnya secara real-time tanpa hubungi Smartbox.
3. Smartbox (internal) bisa mengelola banyak unit di banyak lokasi & mitra dari satu dashboard terpusat, termasuk kontrol jarak jauh (buka paksa pintu, matikan unit, dsb).
4. Sistem tahan terhadap gangguan koneksi/hardware (unit tetap bisa menyelesaikan sesi yang sedang berjalan meski internet putus sesaat).

## 3. Target Pengguna

| Persona | Kebutuhan utama |
|---|---|
| **Penyewa** (pengguna akhir kiosk) | Cepat, tanpa akun/app, bayar QRIS, ambil barang pakai OTP WhatsApp |
| **Mitra** (pemilik lokasi) | Lihat okupansi unit miliknya, laporan pendapatan & bagi hasil, ekspor laporan |
| **Manager** (internal Smartbox) | Approve rentang persentase revenue sharing per mitra (lihat §10), keputusan bisnis level mitra/kontrak |
| **Staff** (internal Smartbox, lapangan) | Eksekusi SOP fisik di lokasi unit — termasuk penggunaan kunci **Emergency Unlock** saat pintu macet/gagal buka via sistem (lihat §5.3, §8.1) |
| **Super Admin / Ops Smartbox** | Kelola semua unit & mitra, konfigurasi harga/durasi per unit, monitoring kesehatan hardware, kontrol darurat, manajemen user internal |

## 4. Ruang Lingkup

### 4.1 MVP (Fase 1)
- Kiosk: alur sewa (nomor HP → durasi → bayar QRIS → assign loker otomatis → buka pintu) dan ambil barang (nomor HP → OTP WA → buka pintu).
- Backend API + database sebagai sumber kebenaran status loker, transaksi, sesi.
- Integrasi payment gateway QRIS (Xendit **dan** Midtrans di belakang abstraksi provider, bisa dikonfigurasi ulang — keputusan §8, bukan lagi "pilih 1") dan 1 provider WhatsApp OTP (lihat §8).
- Gateway hardware di dalam unit yang menjembatani kiosk software ↔ relay/controller pintu fisik, dan melapor status pintu (terbuka/tertutup/macet) ke backend.
- Dashboard Mitra (eksternal, read-only/monitoring — lihat §5.5): overview okupansi, daftar unit miliknya, laporan transaksi & pendapatan (dengan format Rupiah sesuai aturan `rpJt` di prototipe).
- Dashboard Company (internal, multi-role — lihat §5.4): overview seluruh unit, manajemen unit & konfigurasi (harga/durasi per unit), manajemen mitra, laporan gabungan, manajemen user internal.
- Auth berbasis role (**Super Admin, Ops, Manager, Staff** di Dashboard Company; **Mitra** di Dashboard Mitra — §3, §5.4, §5.5) dengan isolasi data antar mitra (mitra A tidak bisa lihat data mitra B).
- Penanganan sesi timeout, kegagalan bayar, loker tidak menutup, dan status "unit penuh" — sudah tergambar sebagian di prototipe kiosk.

### 4.2 Fase 2 (di luar MVP, tapi disiapkan arsitekturnya)
- Notifikasi WhatsApp otomatis: pengingat sebelum sewa berakhir, perpanjangan sewa mandiri.
- Rekonsiliasi otomatis pembayaran ↔ payout mitra (jadwal payout, invoice otomatis).
- **Multi-bahasa kiosk & dashboard** — lihat §7.2 untuk keputusan arsitektur i18n yang sudah disiapkan sejak MVP meski hanya Bahasa Indonesia yang aktif saat ini.
- Mode aksesibilitas.
- App/portal untuk penyewa (riwayat sewa, top-up saldo) — opsional, non-goal awal karena prinsip produk saat ini "tanpa aplikasi".
- OTA update firmware/gateway hardware dari dashboard.
- Analitik lanjutan (heatmap okupansi per jam, prediksi kapasitas).
- **Dikonfirmasi masuk roadmap**: metode akses tambahan selain nomor HP + OTP WA — **RFID card, face recognition, PIN code**. MVP tetap fokus ke QR/OTP WA agar tanpa aplikasi & tanpa kartu fisik; metode lain didesain untuk Fase 2, terutama use case member tetap (mis. penitipan barang pribadi jangka panjang di apartemen/kampus). **RFID & PIN Code punya dasar hardware yang jelas** (§8.1: modul RFID reader ada, PIN bisa lewat touch screen). **Face recognition masih perlu verifikasi vendor** — komponen kamera tidak ada di BOM company profile (§8.1); jangan dikomit ke roadmap Fase 2 sebagai kepastian sampai dikonfirmasi unit final punya modul kamera atau vendor menyediakannya sebagai add-on (lihat §12 poin 6). Implikasi arsitektur: modul autentikasi kiosk tetap perlu dirancang **multi-metode sejak awal** (interface umum "verifikasi identitas", bukan hardcode single-path nomor HP) supaya penambahan RFID/PIN — dan Face Recognition jika jadi terverifikasi — di Fase 2 tidak perlu rombak alur inti.
- Skenario non-sewa (penitipan sesaat tanpa pembayaran per transaksi, parcel/paket locker untuk kurir menitipkan tanpa bertemu penerima) — lihat §4.4a, **dikonfirmasi masuk cakupan produk**.

### 4.2a Fitur Ditarik Maju dari Fase 2: Member RFID/Kode Unik — Dikonfirmasi Masuk Produk

Sebagian dari roadmap Fase 2 di §4.2 ("RFID card... terutama use case member tetap") **sudah diimplementasikan lebih awal** atas permintaan bisnis langsung, sebelum WhatsApp OTP/notifikasi otomatis Fase 2 lainnya. Ringkasan fitur (detail teknis di kode: `server/backend/prisma/schema.prisma` model `Member`, `server/backend/src/kiosk/kiosk-rfid.service.ts`):

- **Setiap loker punya id sendiri** (sudah ada sejak MVP) dan **bisa diisi nomor RFID/kode unik opsional** — diinput oleh **Super Admin** di level konfigurasi loker.
- **Dua jenis member**, dibedakan lewat apakah member diikat ke 1 loker spesifik:
  1. **Member eksklusif** (`lokerId` terisi) — gratis, bebas buka loker itu kapan saja tanpa denda (loker ini otomatis **ditarik dari pool sewa umum**, tidak bisa disewa pelanggan lain). Pengaturan ini **hanya Super Admin** yang boleh melakukan, karena menyangkut kapasitas publik loker milik mitra.
  2. **Member umum** (`lokerId` kosong) — dapat **diskon persentase** dari tarif sewa normal kategori loker mana pun yang disewa, tetap sewa berdurasi biasa (tetap kena denda/suspend kalau telat ambil).
- **Identifikasi di kiosk via tap kartu RFID** (listener otomatis/keyboard-wedge, bukan layar input manual) — menggantikan nomor HP/email untuk member (kedua jalur tetap berjalan bersamaan untuk pelanggan non-member).
- **Mitra bisa mengelola member "umum" miliknya sendiri** (bukan cuma Super Admin) lewat Dashboard Mitra — **tapi HANYA kalau Super Admin memberi akses eksplisit** per mitra (`Mitra.bolehKelolaMember`, default **tidak aktif**). Ini satu-satunya pengecualian terhadap prinsip "Dashboard Mitra read-only" di §5.5, dan sengaja dibuat sebagai flag yang bisa dicabut kapan saja, bukan hak permanen begitu diberikan. Mitra **hanya bisa melihat/mengelola member miliknya sendiri** — isolasi ini ditegakkan di backend (`mitraId` selalu diambil dari akun mitra yang login, tidak pernah dari input client), bukan cuma disembunyikan di UI. Mitra **tidak pernah** bisa membuat/mengubah member eksklusif (ikat loker) — itu tetap murni domain Super Admin.
- **Super Admin wajib menentukan mitra dulu sebelum mengelola member** — meskipun Super Admin bisa mengelola member lintas semua mitra, daftar/kelola member di Dashboard Company **selalu di-scope ke 1 mitra terpilih** (dropdown "Mitra" wajib diisi dulu), bukan daftar semua mitra tercampur. Backend menolak `GET /company/members` tanpa `mitraId` (`MITRA_ID_WAJIB`) — bukan cuma dibatasi di UI.

### 4.3 Eksplisit di luar cakupan
- Pembuatan hardware fisik locker (rangka, solenoid) — Smartbox mengintegrasikan, bukan memproduksi dari nol (lihat §8 rekomendasi vendor).
- Sistem pembayaran non-QRIS (kartu kredit, VA) di fase awal.

### 4.4 Konteks Implementasi Lapangan (dari Company Profile)
Company profile mengonfirmasi target lokasi yang sejalan dengan §3: **apartemen, perkantoran, kampus, dan area publik** (mal, tempat wisata). Contoh nyata dari materi pemasaran: unit di apartemen dipakai kurir untuk menitipkan paket tanpa bertemu penerima ("penitipan paket online"), unit di kampus/kantor untuk penitipan barang pribadi harian. Ini memvalidasi asumsi produk di §1, dan menegaskan dua mode pemakaian: (a) **sewa berbayar per transaksi** (fokus MVP saat ini) vs (b) **fasilitas penitipan gratis/berlangganan** — lihat §4.4a, dikonfirmasi masuk cakupan produk.

### 4.4a Model Non-Transaksional (Fasilitas Gratis) — Dikonfirmasi Masuk Produk
Selain sewa berbayar per transaksi, produk perlu mendukung mode **penitipan tanpa pembayaran per pemakaian** — mis. pengelola gedung/apartemen/kampus menyediakan locker sebagai fasilitas gratis untuk penghuni/karyawan (dibiayai lewat kontrak Fixed Rental/Revenue Sharing ke mitra di §10, bukan dibebankan ke penyewa akhir). Implikasi desain:
- Konfigurasi Unit (§5.4) perlu atribut **mode pemakaian** (`berbayar` vs `gratis/fasilitas`) per unit, bukan asumsi semua unit selalu mengenakan tarif.
- Alur kiosk untuk unit mode `gratis`: langkah "Bayar" (§5.1 langkah 5) di-skip — sesi langsung aktif setelah pilih durasi/loker, tanpa QRIS.
- Karena tidak ada transaksi pembayaran, laporan pendapatan mitra (§5.4, §5.5) perlu membedakan **okupansi non-revenue** dari **transaksi berbayar** agar laporan bagi hasil tidak keliru menghitung unit fasilitas gratis sebagai revenue nihil/anomali.
- Belum diputuskan (tetap §12): apakah unit mode gratis punya batas durasi/kapasitas berbeda dari unit berbayar — perlu klarifikasi bisnis saat desain skema harga per unit.

## 5. Alur Utama (dari prototipe, jadi acuan requirement)

### 5.1 Kiosk — Sewa Loker
1. **Idle** → sentuh layar untuk mulai.
2. **Menu** → pilih "Sewa Loker" (disabled/redirect ke layar "Unit Penuh" jika okupansi 100%).
3. **Nomor HP** → validasi format Indonesia (awalan `08`, min 10 digit).
4. **Durasi** → pilih dari daftar durasi & harga yang dikonfigurasi Super Admin per unit; sistem memilih nomor loker otomatis.
5. **Bayar** → tampilkan QRIS dinamis, tunggu webhook pembayaran, QR punya masa berlaku (5 menit) & timeout balik ke awal.
6. **Buka pintu & simpan barang** → pintu loker terpilih terbuka, sensor mendeteksi pintu ditutup, sesi dianggap aktif; tampilkan struk digital (no. loker, durasi, berlaku sampai, ID transaksi).

### 5.2 Kiosk — Ambil Barang
1. **Menu** → "Ambil Barang".
2. **Nomor HP** yang sama dengan saat menyewa.
3. **Kirim & masukkan Kode OTP** (6 digit, dikirim via WhatsApp, berlaku 5 menit).
4. **Buka pintu** → loker yang sesuai nomor HP terbuka, sensor mendeteksi pintu ditutup → sesi selesai.

### 5.3 Aturan sesi & ketahanan
- Setiap layar alur punya session timeout (balik ke idle otomatis) yang di-reset oleh interaksi pengguna.
- Jika pintu tidak pernah menutup / sensor gagal, unit harus melapor status anomali ke dashboard (butuh alur eskalasi ke Ops, di luar cakupan tampilan kiosk itu sendiri).
- Eskalasi anomali pintu macet ditangani **Staff** secara fisik di lokasi, memakai kunci **Emergency Unlock** (§8.1) sebagai jalur terakhir saat software gagal membuka pintu. Karena aksi ini tidak melewati sistem, perlu prosedur pencatatan manual (siapa staff, kapan, loker mana) yang di-sinkronkan ke dashboard setelahnya agar riwayat sesi tetap konsisten.
- Kiosk harus tetap bisa menyelesaikan sesi yang sudah dibayar meski koneksi ke backend terputus sesaat (queue & retry lokal di gateway hardware).

### 5.4 Dashboard Company (internal — 1 aplikasi, multi-role)

**Keputusan struktur:** ada **2 dashboard terpisah secara arsitektur** — Dashboard Company (internal) dan Dashboard Mitra (§5.5, eksternal). Dashboard Company **bukan** dashboard khusus Super Admin — ini satu aplikasi yang dipakai bersama oleh **Super Admin, Ops, Manager, dan Staff**, dengan menu/aksi yang tampil dibatasi per role (RBAC, bukan 4 dashboard terpisah). **Semua konfigurasi & setting sistem terpusat di sini** — Dashboard Mitra tidak punya kemampuan ubah apa pun (lihat §5.5).

- **Overview**: ringkasan semua unit/lokasi (okupansi, pendapatan, status kesehatan). — *Super Admin, Ops, Manager*
- **Unit Locker**: daftar & detail per unit, status tiap loker (**Tersedia · Terisi · Maintenance · Offline · Nonaktif** — standar resmi §12 poin 9, §13.1), riwayat transaksi per unit. — *Super Admin, Ops*
- **Konfigurasi Unit**: atur harga & pilihan durasi per unit, mode pemakaian (`berbayar`/`gratis`, lihat §4.4a), aktif/nonaktifkan unit. — *Super Admin* (konfigurasi harga/tarif; ini yang membuat Dashboard Mitra tidak boleh punya akses serupa)
- **Partner**: kelola data mitra, lokasi, tipe skema kerja sama (`fixed_rental`/`revenue_sharing`), dan — khusus `revenue_sharing` — **persentase split per mitra** (dinegosiasikan per lokasi; **perubahan/penetapan persentase butuh approval role Manager** sebelum berlaku, lihat §10) — bukan nilai default global yang bisa diisi bebas oleh semua role. — *Super Admin mengajukan, Manager approve*
- **Laporan**: laporan transaksi & bagi hasil lintas mitra, ekspor (CSV/PDF berdasar prototipe `useExport`). — *Super Admin, Ops, Manager*
- **Manajemen User**: buat akun internal & tetapkan/ubah role — **Manager**, **Staff**, **Ops**, maupun Super Admin lain. — ***Hanya Super Admin*** **yang boleh mengakses menu ini dan memberi/mencabut akses role apa pun**. Manager, Staff, dan Ops tidak bisa membuat akun baru atau mengubah role siapa pun (termasuk role sendiri) — mereka murni penerima akses, bukan pemberi akses. Ini mencegah eskalasi hak akses dari dalam (mis. Manager tidak bisa menaikkan diri sendiri jadi Super Admin, Staff tidak bisa memberi akses ke orang lain tanpa sepengetahuan Super Admin).
- **Log Emergency Unlock**: riwayat pemakaian kunci fisik oleh Staff di lapangan (§5.3, §8.1), disinkronkan manual ke sistem. — *Super Admin, Ops (lihat), Staff (input setelah kejadian)*
- **Member RFID** *(§4.2a, ditarik maju dari Fase 2)*: kelola member eksklusif (ikat loker) & member umum (diskon) lintas semua mitra, plus tombol aktif/nonaktifkan akses "kelola member" per mitra. — ***Hanya Super Admin***

Staff pada praktiknya lebih banyak beraktivitas fisik di lokasi unit (§5.3) daripada di dashboard — akses dashboardnya kemungkinan terbatas ke pencatatan Emergency Unlock, bukan menu konfigurasi.

### 5.5 Dashboard Mitra (eksternal — monitoring-only)

**Prinsip: read-only.** Mitra **tidak bisa mengubah harga, durasi, skema kerja sama, atau konfigurasi apa pun** — semua itu murni domain Dashboard Company (§5.4). Dashboard Mitra hanya untuk memantau kinerja lokasi miliknya sendiri:

- **Overview**: okupansi unit miliknya, ringkasan pendapatan & bagi hasil bulan berjalan. — *lihat saja, tidak bisa diedit*
- **Unit Locker**: unit-unit di lokasinya saja (data terisolasi), status tiap loker. — *lihat saja*
- **Laporan**: riwayat transaksi & laporan bagi hasil miliknya, ekspor. — *lihat & ekspor, tidak bisa mengubah data*

Implikasi teknis: ini bukan sekadar batasan UI — endpoint API yang dipakai `AkunMitra` (§6) harus **tidak punya operasi tulis (write)** untuk entitas `Unit`/`Mitra`/konfigurasi harga sama sekali di level backend/RLS (§7, §9.2), bukan hanya disembunyikan di frontend.

**Pengecualian tunggal (§4.2a, fitur di luar cakupan PRD awal):** menu **Member RFID** — mitra boleh membuat/mengelola member "umum" (diskon) miliknya sendiri, tapi **hanya kalau Super Admin sudah mengaktifkan akses ini secara eksplisit** per mitra (flag `bolehKelolaMember`, default nonaktif). Mitra tetap **tidak pernah** bisa mengikat member ke loker spesifik (member eksklusif) — itu murni domain Super Admin karena menyangkut kapasitas publik loker. Kalau akses belum diberikan, menu ini tidak tampil sama sekali di Dashboard Mitra.

### 5.6 Prinsip UX Dashboard (Company & Mitra)

Standar interaksi berikut berlaku di **kedua** dashboard (§5.4, §5.5), supaya terasa satu produk yang konsisten, bukan kualitas seadanya:

- **Error handling**: setiap aksi yang bisa gagal (simpan konfigurasi, ekspor laporan, ubah role, approval persentase) harus punya state *loading*, *sukses*, dan *gagal* yang jelas — pesan error **menyebutkan langkah selanjutnya**, bukan pesan teknis mentah (selaras prinsip §13.1: "errors name the next action, not the fault", mis. "Tarif tidak boleh kosong", bukan stack trace atau kode error backend). Kegagalan jaringan/API harus dibedakan dari kegagalan validasi — retry otomatis wajar untuk kegagalan jaringan, tapi validasi harus langsung jelas ke pengguna.
- **Modal konfirmasi untuk aksi berdampak/tidak mudah dibalik**: nonaktifkan unit, hapus/nonaktifkan akun user, ubah role, approve/ubah persentase revenue sharing (§10), ubah tipe skema mitra, ekspor data besar — semua butuh modal konfirmasi eksplisit (bukan langsung eksekusi saat klik), khusus untuk aksi yang secara finansial/operasional sensitif (approve persentase, nonaktifkan unit) tampilkan ringkasan dampaknya di modal (mis. "3 loker akan berhenti menerima sewa baru").
- **Pagination**: semua daftar yang berpotensi besar (Laporan transaksi, Unit Locker, Manajemen User, riwayat Emergency Unlock) **wajib dipaginasi di level query backend** (bukan fetch semua lalu potong di frontend) — selaras `TanStack Table` + `DataTable` (§9.3, §13.2). Sertakan indikator total data & halaman saat ini, bukan infinite scroll tanpa batas yang menyulitkan audit data lintas mitra.
- **UI/UX profesional & konsisten**: ikuti token & komponen `docs/design_reference/` (§13) apa adanya — jangan re-style ad hoc per halaman. Untuk kebutuhan yang belum ada komponennya (mis. modal konfirmasi belum ada di inventaris §13.2), tambahkan sebagai komponen baru ke `@smartbox/ui` mengikuti pola/token yang sudah ada, bukan komponen sekali pakai di luar sistem desain.
- **Log aktivitas (activity log) yang terlihat pengguna**: selain audit log keamanan untuk aksi sensitif (§7.1), Dashboard Company perlu halaman **"Aktivitas"** yang menampilkan riwayat perubahan data secara umum (siapa mengubah apa, kapan) untuk entitas penting (`Unit`, `Mitra`, `AkunInternal`) — ini beda dari audit log keamanan: audit log §7.1 untuk investigasi insiden, activity log ini untuk transparansi operasional sehari-hari (mis. Super Admin ingin tahu histori perubahan harga suatu unit). Keduanya bisa berbagi tabel penyimpanan yang sama, tapi tampilkan sebagai fitur terpisah dengan tujuan berbeda.

## 6. Model Data Inti (level konsep)

`Lokasi` (punya **timezone eksplisit** — IANA name, mis. `Asia/Jakarta`/`Asia/Makassar`/`Asia/Jayapura`, lihat §7.2) — `Mitra` (relasi bagi hasil ke Lokasi, punya **tipe skema** `fixed_rental`/`revenue_sharing` dan — khusus `revenue_sharing` — **persentase split per mitra, 0–100** dengan approval Manager, lihat §10, §12 poin 2; juga punya flag `boleh_kelola_member`, §4.2a) — `Unit` (perangkat fisik, punya konfigurasi harga/durasi) — `Loker` (slot individual dalam Unit, **status enum resmi: `tersedia` · `terisi` · `maintenance` · `offline` · `nonaktif`** — standar dikunci §12 poin 9, konsisten dengan `docs/design_reference/` §13.1, bukan lagi 3 nilai versi lama) — `Sesi/Transaksi` (nomor HP penyewa **atau** member RFID §4.2a, loker, durasi, status bayar, waktu mulai/selesai — **disimpan UTC**, ditampilkan sesuai timezone `Lokasi` §7.2 — ID transaksi) — `Member` (kode RFID/unik, opsional ikat ke 1 `Loker` eksklusif atau diskon persentase umum, §4.2a) — `AkunInternal` (Super Admin/Ops/Manager/Staff, role-based) — `AkunMitra` (login dashboard mitra, terikat ke 1+ lokasi).

Simpan semua nominal uang sebagai angka (bukan string berformat) — sudah jadi aturan tetap di prototipe (`rpJt`) dan harus dipertahankan di backend agar perhitungan bagi hasil presisi.

**Soft delete wajib untuk seluruh entitas inti** (`Lokasi`, `Mitra`, `Unit`, `Loker`, `AkunInternal`, `AkunMitra`) — setiap tabel punya kolom `deleted_at` (nullable timestamp), tidak ada `DELETE` fisik dari aplikasi untuk entitas-entitas ini:
- **Alasan:** `Sesi/Transaksi` historis mereferensikan `Unit`/`Loker`/`Mitra` — kalau dihapus fisik, laporan transaksi lama & perhitungan bagi hasil (§10) jadi rusak (foreign key patah atau data yatim). Ini bukan preferensi gaya, tapi kebutuhan integritas data finansial.
- **Konsekuensi query**: semua query default harus memfilter `deleted_at IS NULL` (lewat RLS policy atau view, §9.2), supaya "menghapus" unit/mitra dari UI tidak butuh setiap query manual menambahkan filter — mudah lupa dan jadi sumber bug kalau ditangani manual di tiap tempat.
- **Konsekuensi UI**: "Hapus" di Dashboard Company (§5.4) sebenarnya adalah nonaktifkan (soft delete), bukan hilang permanen — perlu didampingi modal konfirmasi (§5.6) yang bahasanya jujur, mis. "Nonaktifkan unit ini?" bukan "Hapus unit ini?" supaya user paham datanya masih ada, hanya disembunyikan dari tampilan aktif.
- `Sesi/Transaksi` sendiri **tidak pernah dihapus** sama sekali (soft atau hard) sebagai baris data — catatan finansial (nominal, ID transaksi, waktu, unit/loker yang dipakai) tetap ada permanen untuk laporan & perhitungan bagi hasil (§10).

**Kebijakan retensi nomor HP penyewa (§7, §12 poin 4 — sudah diputuskan): 6 bulan setelah sesi selesai, lalu dihapus permanen.** Ini **bukan soft delete seluruh baris `Sesi/Transaksi`**, melainkan **penghapusan/pengosongan field nomor HP secara spesifik** pada baris transaksi yang sudah lewat 6 bulan — baris transaksinya sendiri tetap ada (nominal, waktu, unit, ID transaksi tetap utuh untuk laporan §5.4/§5.5/§10), hanya kolom nomor HP yang di-null-kan atau diganti placeholder (mis. `[dihapus]`). Konsekuensi implementasi:
- Perlu **scheduled job** (BullMQ + `pg_cron`-style trigger, atau cron di server Sumopod §9.1) yang berjalan berkala (mis. harian) mencari `Sesi/Transaksi` dengan `waktu_selesai` > 6 bulan lalu dan nomor HP belum di-null-kan, lalu menghapus nilainya — bukan proses manual.
- Setelah nomor HP dihapus, fitur yang bergantung padanya (mis. Ops mencari riwayat sewa berdasarkan nomor HP tertentu di §5.4) otomatis tidak bisa menjangkau transaksi berumur >6 bulan — ini konsekuensi yang disengaja, bukan bug.
- Field nomor HP di `Sesi/Transaksi` harus **nullable** di skema sejak awal (bukan `NOT NULL`), supaya proses purge ini valid secara skema.

## 7. Kebutuhan Non-Fungsional

- **Keandalan**: unit locker adalah aset tak berpenjaga — gateway hardware harus resilient terhadap putus internet (queue transaksi, retry) dan restart otomatis jika software macet (watchdog).
- **Keamanan**: OTP & sesi pembayaran anti-brute-force (rate limit), isolasi data antar mitra di level API (bukan hanya UI), audit log untuk aksi Super Admin (terutama buka paksa pintu), audit log untuk approval **Manager** atas persentase revenue sharing (§10), dan pencatatan setiap pemakaian **Emergency Unlock** fisik oleh **Staff** (§5.3, §8.1) walau aksinya di luar sistem. **Kontrol akses/provisioning: hanya Super Admin yang boleh membuat akun internal & menetapkan/mengubah role** (Manager, Staff, Ops, Super Admin lain — §5.4). Aturan ini harus ditegakkan di level API/RLS (endpoint create-user & assign-role hanya menerima request dari role Super Admin), bukan cuma disembunyikan di menu UI — mencegah eskalasi hak akses dari dalam sistem. Detail lebih lengkap di §7.1.
- **Observability**: setiap unit melapor heartbeat & status pintu/sensor; dashboard harus bisa menunjukkan unit offline.
- **Ketersediaan**: target uptime API ≥ 99.5%; kiosk harus tetap fungsional untuk sesi lokal walau backend downtime singkat.
- **Skalabilitas**: arsitektur multi-tenant sejak awal (banyak mitra & lokasi berbagi satu platform) sesuai keputusan skala di atas.
- **Kepatuhan**: data nomor HP pengguna adalah data pribadi — **retensi 6 bulan setelah sesi sewa selesai, lalu dihapus permanen** (keputusan bisnis, §12 poin 4) — dan tidak boleh bocor lintas mitra. Lihat §6 untuk cara ini direkonsiliasi dengan aturan soft delete transaksi.
- **Maintainability**: sistem melibatkan banyak vendor pihak ketiga (Supabase, Sumopod, Cloudinary, Xendit, Midtrans, WhatsApp BSP) dan tim kecil — arsitektur & proses kerja harus meminimalkan biaya pemeliharaan jangka panjang, bukan cuma cepat dibangun. Detail di §9.5.

### 7.1 Checklist Keamanan (mengikat, bukan sekadar rekomendasi)

Karena sistem menangani **uang (pembayaran QRIS), data pribadi (nomor HP), dan akses fisik (buka kunci loker)**, sekaligus server backend kini **self-hosted** (Sumopod, §9.1 — bukan PaaS terkelola yang biasanya sudah punya sebagian proteksi bawaan), poin-poin berikut wajib dipenuhi sebelum go-live, bukan opsional:

- **Manajemen secret**: seluruh API key (Supabase service-role key, Xendit/Midtrans secret key, Cloudinary API secret, WhatsApp BSP token) disimpan sebagai environment variable di server/Sumopod, **tidak pernah** di-commit ke Git — termasuk di file contoh (`.env.example` hanya berisi nama variabel, bukan nilai). Tambahkan `.env` ke `.gitignore` sejak commit pertama repo backend.
- **Least privilege di setiap layer**: RLS Postgres per `mitra_id`/`lokasi_id` (§7, §9.2) menegakkan isolasi data mitra di level database, bukan hanya query backend yang "biasanya" memfilter dengan benar. Service-role key Supabase (yang bisa bypass RLS) hanya dipegang backend, tidak pernah dikirim ke frontend mana pun (§9.2).
- **Transport security**: TLS wajib di semua koneksi publik — kiosk↔backend, dashboard↔backend, webhook payment↔backend. Karena server self-hosted, sertifikat TLS (mis. Let's Encrypt, auto-renewal) jadi tanggung jawab konfigurasi Sumopod sendiri, bukan otomatis seperti di PaaS terkelola.
- **Hardening server (Sumopod, self-hosted)**: firewall hanya membuka port yang perlu (mis. 443, dan port admin/SSH dibatasi IP tertentu), akses SSH pakai key-based auth (bukan password), update keamanan OS berkala — dipegang **Super Admin** sebagai penanggung jawab ops server (§12 poin 10).
- **Validasi & sanitasi input di semua boundary**: setiap endpoint publik (OTP, webhook payment, form kiosk) divalidasi dengan skema eksplisit (Zod, §9.3) — termasuk payload webhook dari Xendit/Midtrans, jangan percaya begitu saja meski dari "provider terpercaya" tanpa verifikasi signature (§8, §9.3).
- **Dependency & kerentanan pihak ketiga**: aktifkan Dependabot/`npm audit`/Snyk di CI (§9.4) untuk dependency Node.js — permukaan serangan terbesar biasanya dari library pihak ketiga yang usang, bukan kode sendiri.
- **CORS ketat**: backend API hanya menerima request dari origin Dashboard Company, Dashboard Mitra, dan domain kiosk yang dikenal — bukan wildcard `*`, terutama karena Dashboard Mitra (§5.5) harus benar-benar terisolasi dari kemampuan tulis data mitra lain.
- **Audit log tidak bisa diubah**: log untuk aksi sensitif (buka paksa pintu, approval persentase Manager, provisioning user oleh Super Admin, pemakaian Emergency Unlock) bersifat **append-only** — tidak ada endpoint untuk edit/hapus log, supaya kredibel saat investigasi insiden.
- **Backup & pemulihan**: verifikasi tier Supabase yang dipakai menyediakan backup otomatis yang memadai (§9.2); untuk server Sumopod sendiri, backup konfigurasi/env terpisah dari kode (bukan cuma mengandalkan Git). Lakukan **drill restore** minimal sekali sebelum produksi — backup yang belum pernah dites bukan backup yang bisa diandalkan.
- **Review keamanan sebelum go-live**: karena ada aliran uang & akses fisik, pertimbangkan security review/pentest ringan (internal atau eksternal) sebelum unit pertama live di lokasi publik — bukan sesuatu yang ditunda ke "nanti setelah launch".

### 7.2 Timezone & Kesiapan Multi-bahasa

**Timezone — bukan sekadar "pakai WIB", karena Indonesia punya 3 zona waktu.** Ekspansi produk ke luar Jawa/Sumatra (mis. kalau ada unit di Bali/NTT/Sulawesi = WITA, atau Papua/Maluku = WIT) berarti hardcode `Asia/Jakarta` di semua tempat akan salah menampilkan jam "berlaku sampai" di kiosk lokasi tersebut. Aturan wajib sejak awal:
- **Simpan semua timestamp di database sebagai UTC** (bawaan Postgres `timestamptz`, sudah default di Supabase) — jangan simpan sebagai waktu lokal mentah.
- Field `Lokasi` (§6) perlu atribut **timezone eksplisit** (mis. `Asia/Jakarta` / `Asia/Makassar` / `Asia/Jayapura` — nama IANA timezone, bukan asumsi offset tetap seperti `+7`, karena aturan DST tidak berlaku tapi format IANA lebih tahan terhadap perubahan aturan zona di masa depan), diisi saat unit didaftarkan Super Admin di §5.4.
- Kiosk & struk digital (§5.1 langkah 6) menampilkan waktu **sesuai timezone lokasi unit tersebut**, dikonversi dari UTC saat render — bukan timezone server backend (yang mungkin di region cloud berbeda, §9.1) dan bukan asumsi WIB untuk semua unit.
- Dashboard Company/Mitra (§5.4/§5.5) menampilkan waktu transaksi lintas lokasi — perlu jelas menunjukkan timezone yang dipakai per baris data (mis. label WIB/WITA/WIT) supaya Ops tidak salah baca saat unit tersebar di beberapa zona waktu.
- **Rekomendasi library**: `date-fns-tz` (ekstensi dari `date-fns` yang sudah direkomendasikan, §9.3) untuk konversi UTC↔timezone lokasi, hindari hitung offset manual.

**Kesiapan multi-bahasa — arsitektur disiapkan sekarang, isi cuma Bahasa Indonesia.** Sesuai §4.2, multi-bahasa kiosk masuk Fase 2, tapi supaya penambahan bahasa nanti tidak berarti menulis ulang seluruh teks UI:
- Pakai library i18n sejak MVP (`react-i18next` atau `next-intl` bila dashboard pakai Next.js, §9.1) — **semua teks UI kiosk & dashboard lewat key terjemahan** (mis. `t('kiosk.sewaLoker')`), bukan string hardcode langsung di komponen, meski saat ini cuma ada satu file locale `id.json`.
- Struktur folder locale disiapkan per-app (`kiosk/locales/id.json`, `dashboard-company/locales/id.json`, dst.) sejak awal, supaya menambah `en.json` dsb. di Fase 2 murni kerja penerjemahan, bukan refactor kode.
- **Konten kiosk tetap mengikuti aturan nada & kosakata status di §13.1** (Tersedia/Terisi/Maintenance/Offline/Nonaktif, dsb.) — begitu bahasa lain ditambahkan, kosakata status yang terkunci itu perlu terjemahan resmi yang konsisten, bukan diterjemahkan ad hoc per developer.
- Format tanggal/angka (Rupiah, §13.1) tetap mengikuti locale `id-ID` saat ini; library i18n yang dipilih harus mendukung format locale-aware untuk saat bahasa lain ditambahkan (jangan hardcode format Rupiah dengan string manipulation yang cuma benar untuk Bahasa Indonesia).

## 8. Rekomendasi Integrasi & Hardware

- **Payment gateway QRIS**: **Keputusan — dukung Xendit dan Midtrans, bisa berpindah/dikonfigurasi** (bukan pilih satu secara permanen seperti rekomendasi awal). Konsekuensi desain: backend perlu **abstraksi payment provider** (interface umum "buat transaksi QRIS", "verifikasi webhook", "cek status bayar") dengan implementasi terpisah per provider, dipilih lewat konfigurasi (env var atau per-unit/per-mitra bila suatu saat perlu multi-provider berjalan bersamaan). Jangan hardcode pemanggilan SDK Midtrans/Xendit langsung di logic transaksi — akan menyulitkan penggantian provider dan menambah risiko regresi. Field `Sesi/Transaksi` (§6) perlu menyimpan **provider mana yang dipakai per transaksi**, karena rekonsiliasi & format webhook berbeda antar provider meski keduanya QRIS. Tetap **jangan proses 2 provider aktif untuk transaksi yang sama** — "bisa ganti-ganti" berarti dapat dikonfigurasi ulang (mis. saat migrasi atau evaluasi biaya), bukan dua provider menerima pembayaran bersamaan untuk sesi yang sama.
- **WhatsApp OTP**: WhatsApp Business API resmi via BSP (mis. Qontak, Mekari Qontak, atau langsung Meta Cloud API) — hindari solusi WA tidak resmi (rawan diblokir, terlalu berisiko untuk fitur OTP yang kritikal).
- **Kontrol pintu loker**: arsitektur gateway lokal (mini-PC/industrial PC di dalam unit + board kontrol terpisah untuk relay pintu) yang direkomendasikan sebelumnya di dokumen ini **terkonfirmasi cocok dengan arsitektur unit yang ditawarkan vendor** (lihat §8.1–§8.2, dari company profile). Prioritas riset lanjutan: pastikan protokol komunikasi Main Controller Board ↔ Mini PC (serial/RS485 vs proprietary) terbuka/terdokumentasi, bukan solusi tertutup yang memaksa pakai software bawaan vendor.

### 8.1 Komponen Fisik Unit (dari Company Profile)

Setiap unit locker terdiri dari komponen berikut (referensi produk vendor `sewasmartlocker.id`, bisa berbeda per vendor final):

| Komponen | Fungsi |
|---|---|
| **Cover** | Panel atas unit, menutupi ruang kabel/instalasi bagian atas |
| **Touch Screen 7" IPS (1024×600 native, dipasang portrait → 600×1024)** | Layar sentuh kiosk untuk interaksi pengguna |
| **Mini PC — Raspberry Pi (terkonfirmasi)** | Menjalankan kiosk software (setara "gateway hardware" di §9). Layar sentuh 7″ terhubung via HDMI (video) + USB-C (daya & sentuh), plug-and-play tanpa driver/kalibrasi manual — kompatibel Raspberry Pi 4/4B/3B+/3B/2B/Zero W (spek produk layar vendor) |
| **IP Board** | Modul jaringan/komunikasi unit |
| **Controller (Main Controller Board)** | Mengontrol seluruh electric lock, memonitor status tiap loker, komunikasi ke Mini PC |
| **Power Supply Board** | Distribusi daya 12V/5V ke seluruh komponen, proteksi sistem (short circuit dll.) |
| **Electric Lock** | Kunci elektronik per kompartemen (lock/unlock) |
| **QR Code/RFID reader** | Modul pemindai untuk metode akses QR & kartu RFID |
| **Emergency Unlock (kunci fisik)** | Override manual dengan kunci konvensional untuk buka paksa saat sistem gagal total — penting untuk alur eskalasi Ops di §5.3, harus dicatat sebagai audit log tersendiri karena tidak melewati software |

Metode akses yang disebut mendukung hardware ini: **RFID Card, Face Recognition, QR Code, PIN Code**. **Catatan akurasi:** klaim ini berasal dari slide company profile yang menjelaskan kategori produk smart locker secara umum (bukan BOM/daftar komponen spesifik unit vendor ini). Dicocokkan ke tabel komponen fisik di atas: **QR Code & RFID punya komponen nyata** ("QR Code/RFID reader"), **PIN Code bisa dilayani touch screen** (tanpa hardware tambahan) — tapi **tidak ada modul kamera/sensor wajah di daftar komponen**. Artinya Face Recognition **belum terkonfirmasi didukung unit fisik ini** — kemungkinan butuh modul kamera tambahan (add-on) yang belum tercantum, atau klaim itu hanya menggambarkan kapabilitas kategori produk secara umum, bukan unit yang akan dibeli. Lihat §4.2 untuk keputusan cakupan MVP vs Fase 2, dan §12 poin 6 untuk status verifikasi ini.

### 8.2 Arsitektur Data & Kontrol Unit (dari Company Profile)

Alur singkat di dalam satu unit, dari internet ke pintu fisik:

`Internet/LAN` → **Router** (akses jaringan) → **Mini PC/Industrial PC — Raspberry Pi** (kontrol sistem, pemrosesan data, autentikasi pengguna via RFID Reader / QR-Barcode Scanner) → **Power Supply Board** (distribusi daya) → **Main Controller Board** (kontrol semua lock, monitor status, komunikasi ke Mini PC) → **Electric Lock** (buka/tutup tiap kompartemen).

Terpisah, **Server/PC** pusat menjalankan software management, data monitoring, dan user management — ini setara peran **Backend API + Dashboard** di §9, mengonfirmasi pembagian tanggung jawab "kiosk software lokal" vs "backend terpusat" yang sudah direncanakan.

### 8.3 Varian Ukuran & Spesifikasi Fisik Unit

Vendor menawarkan 5 varian konfigurasi kompartemen (tinggi total unit tetap 1920mm termasuk kaki adjustable, lebar total 800mm/2 kolom × 400mm, kedalaman 450–500mm, material Steel Sheet SPCC dengan finishing powder coating, pilihan warna: merah, hitam, putih, abu-abu, biru):

| Varian | Konfigurasi | Ukuran per kompartemen (W×H mm) |
|---|---|---|
| A | 2 kolom × 2 baris (Jumbo) | 400 × 860 |
| B | 2 kolom × 3 baris | 400 × 573.3 |
| C | 2 kolom × 4 baris | 400 × 430 |
| D | 2 kolom × 5 baris | 400 × 344 |
| E | 2 kolom × 6 baris | 400 × 286 |

Implikasi produk: model data `Unit` (§6) perlu menyimpan **varian/konfigurasi kompartemen** karena tiap unit fisik punya jumlah & ukuran loker berbeda — bukan asumsi seragam. Dimensi bisa disesuaikan per proyek (custom order), jadi jangan hardcode 5 varian ini sebagai enum tertutup di skema; simpan sebagai atribut fleksibel (jumlah loker + ukuran per loker) per unit.

## 9. Rekomendasi Tech Stack

Prinsip pemilihan: 1 bahasa dominan di seluruh stack untuk tim kecil, ekosistem matang untuk real-time & IoT, mudah di-hosting di Indonesia/Asia Tenggara. Repo saat ini **belum punya kode aplikasi** (belum ada `package.json`) — hanya prototipe statis (§5, header) dan design system foundations (§13). Baris yang ditandai **"Keputusan"** di bawah ini sudah final (hosting server via Sumopod, database Supabase, storage gambar Cloudinary, payment Xendit/Midtrans) — sisanya (framework spesifik, library utilitas §9.3–§9.4, dsb.) masih rekomendasi awal yang bisa didiskusikan lebih lanjut.

### 9.1 Bahasa, Framework & Layanan Inti

| Layer | Rekomendasi | Alasan |
|---|---|---|
| **Kiosk app** | React + TypeScript, dibundel dengan Vite, jalan di **browser kiosk-mode** (Chromium `--kiosk`) di atas **Raspberry Pi OS** (Mini PC-nya terkonfirmasi Raspberry Pi, §8.1) | Prototipe sudah React — tinggal migrasi dari script-tag CDN ke build proper (TS, bundling, code-splitting) tanpa ganti paradigma. Kiosk-mode Chromium paling umum & stabil untuk unattended device; Raspberry Pi OS (Debian-based) mendukung Chromium kiosk-mode + systemd autostart secara native, tidak perlu OS custom. |
| **Dashboard web** | **2 aplikasi terpisah**: Dashboard Company (internal, multi-role — §5.4) dan Dashboard Mitra (eksternal, read-only — §5.5), keduanya React + TypeScript + Vite, atau **Next.js** bila butuh SSR/SEO untuk halaman publik | Dipisah jadi 2 deployment/domain berbeda (bukan 1 app dengan role-gating saja) karena beda audiens (internal vs eksternal) dan beda permukaan risiko keamanan — mitra tidak perlu bisa mengakses bundle/route milik dashboard internal sama sekali. Keduanya tetap berbagi `@smartbox/ui` (baris di bawah). |
| **UI/Design system** | Formalkan `docs/design_reference/` (§13) sebagai package internal (`@smartbox/ui`), bukan mulai dari nol | Sudah ada tokens & komponen primitif (kiosk + dashboard) — tinggal dikonsumsi kedua app di atas. |
| **Backend API** | Node.js + TypeScript (NestJS atau Fastify) | TypeScript end-to-end (tipe data transaksi/nominal dibagi ke frontend), NestJS cocok untuk struktur modular multi-tenant (module per domain: unit, mitra, transaksi). |
| **Realtime status unit/loker** | MQTT broker (mis. EMQX) antara gateway hardware ↔ backend, + WebSocket/SSE dari backend ↔ dashboard | MQTT adalah standar IoT untuk perangkat unattended dengan koneksi tidak stabil (QoS, last-will untuk deteksi offline). Jangan pakai HTTP polling langsung dari tiap unit. |
| **Gateway hardware (di dalam unit)** | Node.js atau Python service di **Raspberry Pi** (Mini PC, §8.1), komunikasi serial/RS485 ke Main Controller Board via GPIO/USB-serial, publish status ke MQTT | Memisahkan "otak kiosk" dari kontrol fisik; lihat §8.2 untuk pemetaan ke arsitektur vendor. Raspberry Pi terkonfirmasi (bukan lagi "Linux SBC" generik) — Node.js (`mqtt.js` + `serialport` npm package, satu bahasa dengan kiosk/backend) tetap pilihan default kecuali protokol Main Controller Board ternyata butuh library Python-only (masih perlu dikonfirmasi vendor, §12 poin 1). |
| **Payment** | Xendit **dan** Midtrans SDK, di belakang abstraksi provider (lihat §8) | Keputusan: dukung kedua provider, bisa dikonfigurasi ulang tanpa ubah logic transaksi. |
| **Notifikasi/OTP** | WhatsApp Business API (BSP resmi) | Lihat §8. |
| **Hosting server (backend API)** | **Sumopod, di server sendiri** (Docker-based deploy, bukan platform managed pihak ketiga seperti Render) | Keputusan: backend NestJS/Fastify di-deploy via Sumopod di infrastruktur milik sendiri, bukan PaaS terkelola. Database tetap terpisah di **Supabase** (§9.2), bukan self-host Postgres, agar RLS & sumber kebenaran data tetap terpusat di Supabase — hanya layer compute/API yang self-hosted. |
| **Storage gambar/foto** | **Cloudinary** | Keputusan: gambar (bukti foto anomali unit di §5.3, aset logo/lockup §13, foto kondisi unit) lewat Cloudinary — dapat transformasi/resize/optimasi gambar otomatis (mis. thumbnail untuk tabel dashboard) yang tidak disediakan Supabase Storage. |
| **Storage dokumen non-gambar** | **Supabase Storage** (lihat §9.2) | Laporan ekspor (CSV/PDF, §5.4/§5.5) tetap di Supabase Storage — satu platform dengan database untuk file yang tidak butuh transformasi gambar. |
| **Hosting kiosk & dashboard (aset statis)** | Kiosk: dibundel ke image/Mini PC (§8.1), bukan di-hosting web publik. Dashboard: bisa ikut di-deploy di server sendiri lewat Sumopod (satu platform dengan backend), atau tetap di Vercel/Cloudflare Pages bila ingin CDN statis terpisah | Dashboard admin tidak harus 1 platform dengan backend API; pilih berdasarkan kemudahan CI/CD, bukan keharusan teknis. |
| **CI/CD** | GitHub Actions → build kiosk & dashboard → deploy backend ke **server sendiri via Sumopod** (build image, push, trigger deploy) → OTA/manual rollout ke gateway hardware | Standar, terintegrasi dengan repo yang sudah ada; karena self-hosted, pipeline perlu langkah tambahan (SSH/webhook deploy ke Sumopod) yang tidak diperlukan pada PaaS terkelola. |

### 9.2 Database & Penyimpanan

**Keputusan: database utama pakai Supabase** (bukan self-managed PostgreSQL di cloud generik seperti direkomendasikan sebelumnya). Supabase pada dasarnya adalah PostgreSQL terkelola + beberapa layanan bawaan yang relevan langsung untuk kebutuhan produk ini:

| Kebutuhan | Rekomendasi | Alasan |
|---|---|---|
| **Database utama** | **Supabase (Postgres terkelola)** | Tetap Postgres di baliknya, jadi semua alasan sebelumnya tetap berlaku: ACID untuk transaksi finansial, relasi Lokasi–Mitra–Unit–Loker–Transaksi natural sebagai skema relasional. **Row Level Security (RLS) Postgres bawaan Supabase langsung cocok** untuk isolasi data antar mitra (§7) dan histori persentase revenue sharing per mitra (§10) — kebutuhan yang sudah diidentifikasi sebelum keputusan ini, tinggal diimplementasi sebagai RLS policy per `mitra_id`/`lokasi_id`. RLS policy sekaligus tempat paling tepat menegakkan filter **soft delete** (§6) — `WHERE deleted_at IS NULL` dibuat bagian dari policy/view, bukan diulang manual di tiap query aplikasi. |
| **ORM/query layer** | Prisma **atau** Supabase JS/TS client langsung (`@supabase/supabase-js`) | Prisma tetap dipakai untuk migration & type-safety di backend NestJS bila arsitektur tetap punya backend API custom (§9.1). Jika sebagian logic CRUD sederhana ingin langsung dari frontend dashboard, Supabase client bisa dipakai — **tapi tetap wajib lewat RLS**, jangan andalkan validasi di frontend saja (selaras §7: isolasi data harus di level API/DB, bukan hanya UI). |
| **Auth** | **Supabase Auth** (bawaan) sebagai basis, dengan tabel role kustom (Super Admin/Ops/Manager/Staff/Mitra, §3, §9.1) dipetakan lewat `custom claims`/tabel `profil_user` + RLS policy per role | Mengurangi kebutuhan membangun JWT/refresh-token dari nol; role granular (approval Manager, eksekusi Staff, §10/§5.3) tetap perlu dimodelkan eksplisit di atas Supabase Auth, bukan bawaan otomatis. **Endpoint pembuatan user & penetapan role (Supabase Admin API / `auth.admin.createUser`, update `profil_user`) hanya boleh dipanggil dari backend dengan pengecekan role pemanggil = Super Admin** (§5.4, §7) — jangan expose Supabase service-role key ke frontend/dashboard mana pun, termasuk Dashboard Company, supaya provisioning user tidak bisa dilakukan langsung dari client. |
| **Realtime dashboard** | **Supabase Realtime** (berbasis Postgres logical replication) untuk update live di dashboard (okupansi, status unit) | Menggantikan kebutuhan membangun WebSocket/SSE server sendiri dari backend ke dashboard — cukup subscribe perubahan tabel `Loker`/`Sesi` yang di-update backend/gateway. **Tetap terpisah dari MQTT** (§9.1) yang menjembatani gateway hardware ↔ backend — Supabase Realtime tidak menggantikan MQTT karena bukan protokol untuk perangkat IoT unattended dengan QoS/last-will. |
| **Object storage — dokumen** | **Supabase Storage** | Untuk lampiran laporan ekspor (CSV/PDF, §5.4/§5.5) — satu platform dengan database, mengurangi jumlah vendor untuk file yang tidak butuh transformasi gambar. |
| **Object storage — gambar/foto** | **Cloudinary** (lihat §9.1) | Bukti foto anomali unit (§5.3), foto kondisi unit, dan aset gambar lain — Cloudinary menyediakan transformasi/resize/optimasi otomatis (mis. thumbnail untuk tabel dashboard) yang tidak ada di Supabase Storage. URL Cloudinary hasil upload disimpan sebagai field di Postgres (Supabase), bukan file-nya sendiri. |
| **Cache & rate limiting** | Redis (terpisah dari Supabase — Supabase tidak menyediakan ini) | Menyimpan counter rate-limit OTP/pembayaran (§7) dan sebagai backing store job queue di bawah. |
| **Job queue (async)** | BullMQ (di atas Redis), dijalankan sebagai proses/worker di **server sendiri** (§9.1, via Sumopod), termasuk **scheduled job (cron) harian untuk purge nomor HP** (§6, §7 — retensi 6 bulan) | Karena backend punya proses persisten di server sendiri (bukan serverless), BullMQ lebih natural daripada memindah logic ke Supabase Edge Functions — cukup satu server untuk API + worker. Dipakai untuk retry webhook pembayaran (§8, dua provider — Xendit & Midtrans punya format retry berbeda), pengiriman OTP WA, purge data pribadi kedaluwarsa, dan proses Fase 2 (§4.2) seperti reminder otomatis. |
| **Local queue di gateway hardware** | SQLite (`better-sqlite3` bila Node.js) | Tidak berubah — ini di sisi gateway hardware, bukan di Supabase/server backend. Resiliency saat unit offline (§5.3, §7) — sesi yang sudah dibayar tetap bisa diselesaikan lokal lalu disinkronkan saat koneksi pulih. |

**Implikasi ke §7 (NFR) & §12 (risiko):** dengan server backend **self-hosted** (Sumopod, bukan PaaS terkelola seperti Render), tanggung jawab uptime bergeser — **Supabase** tetap SLA vendor pihak ketiga (database/auth/storage/realtime), tapi **ketersediaan server backend sekarang jadi tanggung jawab tim sendiri**: patching OS, restart otomatis saat proses crash (watchdog/process manager, mis. `pm2` atau restart policy Docker), monitoring resource (CPU/RAM/disk), TLS/sertifikat, dan backup konfigurasi server. Target uptime API ≥ 99.5% (§11) tidak lagi terbantu SLA managed platform untuk layer compute ini — perlu observability (§9.4: Grafana/Prometheus, Sentry) benar-benar terpasang di server sendiri sejak awal, bukan opsional. Ini menambah beban operasional untuk tim kecil dibanding opsi PaaS terkelola, tapi memberi kontrol penuh & kemungkinan biaya lebih rendah dalam jangka panjang.

### 9.3 Utilitas & Library Pendukung

| Kebutuhan | Rekomendasi | Alasan |
|---|---|---|
| **Validasi data** | Zod (skema tervalidasi di backend, bisa dibagi tipe-nya ke frontend) | Validasi nomor HP format Indonesia (§5.1), format OTP, payload webhook — satu sumber kebenaran skema, bukan validasi manual di banyak tempat. |
| **Form & state form (dashboard)** | React Hook Form + Zod resolver | Form konfigurasi unit/mitra (§5.4) cukup kompleks (harga, durasi, tipe skema, persentase) — butuh validasi & error state yang konsisten. |
| **Data fetching & cache (frontend)** | TanStack Query | Dashboard butuh refetch/cache data realtime (okupansi, laporan) tanpa reinvent loading/error state manual. |
| **State machine alur kiosk** | XState (atau state machine ringan custom) | Alur kiosk (§5.1–§5.2) punya banyak state & transisi eksplisit (timeout, gagal bayar, unit penuh) — state machine lebih mudah diaudit & ditest daripada nested `if` di komponen. |
| **Tabel data (dashboard)** | TanStack Table (dipasangkan dengan `DataTable` dari design system, §13.2), **pagination server-side** (bukan ambil semua data lalu potong di client) | Sorting/filtering/paginasi laporan transaksi tanpa membangun ulang logic tabel; server-side pagination wajib untuk data yang bisa tumbuh besar (riwayat transaksi lintas mitra, §5.6). |
| **Modal konfirmasi & dialog** | Radix UI Dialog/AlertDialog (headless, accessible) dibungkus jadi komponen `@smartbox/ui` (`ConfirmDialog`) mengikuti token `docs/design_reference/` (§13) | Belum ada di inventaris komponen §13.2 — perlu ditambahkan sebagai komponen baru untuk kebutuhan modal konfirmasi aksi sensitif (§5.6), bukan dibangun ad hoc per halaman. Radix dipilih karena accessible by default (focus trap, keyboard nav) tanpa styling bawaan yang harus di-override. |
| **Notifikasi toast/error non-blocking** | Radix UI Toast atau `sonner`, dibungkus jadi komponen `@smartbox/ui` | Untuk feedback sukses/gagal aksi (§5.6) yang tidak butuh modal blocking — konsisten dengan pesan error yang actionable (§13.1). |
| **Grafik/analitik (dashboard)** | Recharts atau visx | Untuk visual okupansi/pendapatan di Overview (§5.4/§5.5) dan analitik Fase 2 (§4.2). |
| **QR code** | `qrcode` (backend, generate QRIS/kode akses) + rendering `<img>`/SVG di kiosk via komponen `QRScreen` (§13.2) | QR dibuat sekali di backend saat transaksi dibuat, bukan di-generate ulang di client — konsisten dengan payload yang diverifikasi webhook. |
| **Tanggal, durasi & timezone** | `date-fns` + `date-fns-tz` (bukan Moment.js, sudah deprecated secara de facto) | Perhitungan durasi sewa, countdown QR 5 menit (§5.1), "berlaku sampai" di struk. `date-fns-tz` khusus untuk konversi UTC↔timezone lokasi (§7.2, §6) — semua timestamp disimpan UTC di database, dikonversi ke timezone `Lokasi` saat ditampilkan. |
| **Internasionalisasi (i18n)** | `react-i18next` (kiosk & Dashboard Company/Mitra bila bukan Next.js) atau `next-intl` (bila dashboard pakai Next.js, §9.1) | Menyiapkan arsitektur multi-bahasa sejak MVP (§7.2, §4.2) — semua teks lewat key terjemahan meski saat ini cuma ada `id.json`, supaya penambahan bahasa di Fase 2 tidak perlu refactor kode. |
| **Auth & otorisasi backend** | `@supabase/supabase-js` (verifikasi token Supabase Auth di backend NestJS) + guard role-based custom di atas RLS Postgres (§9.2) | Role Super Admin/Ops/**Manager**/**Staff**/Mitra (§3, §9.1) tetap perlu scope permission granular di atas Supabase Auth — guard per-role di backend, bukan pengecekan role manual di tiap controller. |
| **Keamanan HTTP** | `helmet`, `express-rate-limit`/throttler bawaan NestJS | Proteksi header dasar & rate limit endpoint publik (OTP, webhook) sesuai §7. |
| **Logging terstruktur** | `pino` | Log JSON terstruktur, murah secara performa, cocok dikirim ke agregator log/observability (§9.4). |
| **Payment provider abstraction** | Interface internal (mis. `PaymentProvider` dengan method `createQrisCharge`, `verifyWebhook`, `getStatus`), diimplementasikan terpisah oleh `XenditProvider` dan `MidtransProvider`, dipilih via factory berbasis konfigurasi | Mendukung keputusan "bisa ganti-ganti provider" di §8 — kode transaksi selalu memanggil interface umum, bukan SDK provider langsung, sehingga penggantian/penambahan provider tidak menyentuh logic inti. |
| **Validasi webhook payment** | Verifikasi signature bawaan SDK Midtrans/Xendit (masing-masing punya skema signature berbeda, ditangani di provider masing-masing) + idempotency key disimpan di Postgres (Supabase, §9.2) | Cegah transaksi dobel dari retry webhook (§8); idempotency key perlu menyertakan identitas provider karena format ID transaksi Xendit & Midtrans tidak sama. |
| **MQTT client (gateway hardware)** | `mqtt.js` (Node.js) atau `paho-mqtt`/`gmqtt` (Python) | Publish status pintu/sensor ke broker EMQX (§9.1) dengan QoS & last-will untuk deteksi offline. |

### 9.4 Tooling Repo & Kualitas Kode

| Kebutuhan | Rekomendasi | Alasan |
|---|---|---|
| **Package manager & monorepo** | pnpm workspaces (opsional Turborepo bila build makin berat) | Repo ini akan punya beberapa package (`kiosk`, `dashboard`, `backend`, `@smartbox/ui`, `gateway`) — workspace tunggal menghindari duplikasi dependency & memudahkan berbagi tipe TypeScript antar package. |
| **Linting design-system adherence** | **oxlint**, lanjutkan pola yang sudah ada di `docs/design_reference/_adherence.oxlintrc.json` | Repo ini **sudah** punya konfigurasi oxlint yang menegakkan pemakaian token/komponen `docs/design_reference/` dengan benar (larang hex/px mentah, larang import internal komponen, validasi props). Pertahankan pola ini saat `@smartbox/ui` diformalkan (§9.1), jangan diganti tool lint lain untuk urusan ini. |
| **Linting umum & format** | ESLint (`typescript-eslint`) untuk aturan umum di luar cakupan oxlint + Prettier | oxlint saat ini fokus ke adherence design system; aturan TypeScript/React umum tetap perlu ESLint sampai coverage oxlint setara. |
| **Testing unit/komponen (frontend)** | Vitest + React Testing Library | Selaras dengan Vite (§9.1), lebih cepat dari Jest untuk frontend. |
| **Testing backend** | Jest (bawaan NestJS) atau Vitest bila ingin satu test runner di seluruh monorepo | Unit & integration test untuk logic kritikal: perhitungan bagi hasil (§10), validasi sesi/timeout (§5.3). |
| **Testing end-to-end** | Playwright | Simulasikan alur kiosk penuh (§5.1–§5.2) di viewport kiosk **600×1024 portrait** (ukuran final, §8.1/§12 poin 8, SMB-801 revisi kedua — panel 7″ 1024×600 native dipasang rotasi 90°) dan alur dashboard admin. |
| **Observability** | Grafana + Prometheus (metrik unit/API), Sentry (error tracking FE/BE) | Kritis karena unit unattended — butuh alert cepat saat unit offline/pintu macet (§7). |

### 9.5 Praktik Maintainability

Tim kecil + banyak vendor pihak ketiga (§7) berarti biaya pemeliharaan jangka panjang harus ditekan sejak desain awal, bukan ditambal belakangan:

| Praktik | Rekomendasi | Alasan |
|---|---|---|
| **Validasi konfigurasi saat startup** | Validasi seluruh environment variable (Supabase URL/key, Xendit/Midtrans key, Cloudinary config, dsb.) pakai skema Zod saat proses backend start, gagal cepat dengan pesan jelas bila ada yang hilang/salah format | Kesalahan konfigurasi di server self-hosted (§9.1, Sumopod) lebih mudah lolos tanpa validasi PaaS terkelola — lebih baik gagal saat startup daripada error samar saat transaksi nyata berjalan. |
| **Pemisahan environment** | Environment terpisah untuk development/staging/production — masing-masing punya project Supabase, kredensial payment (mode sandbox Xendit/Midtrans), dan instance Sumopod sendiri | Mencegah testing tidak sengaja memengaruhi data produksi (§7, terutama karena ada transaksi uang nyata); staging jadi tempat validasi sebelum deploy ke unit fisik yang sudah dipakai penyewa. |
| **Migration database terkelola** | Migration Prisma (atau Supabase CLI migration) selalu lewat file migration yang di-commit & direview, **tidak pernah** edit skema langsung di Supabase Studio untuk production | Perubahan skema (mis. field baru `tipe_skema`, §10) perlu jejak audit & bisa di-rollback; edit manual di dashboard Supabase tidak tercatat di riwayat kode. |
| **Automated testing sebagai gate CI** | CI (GitHub Actions, §9.1) menjalankan lint (oxlint + ESLint), test (Vitest/Jest/Playwright, tabel di atas), dan build sebelum PR bisa di-merge — bukan manual sebelum deploy | Mencegah regresi masuk ke `main` tanpa terdeteksi, terutama untuk logic finansial (perhitungan bagi hasil, §10) yang mahal kalau salah di produksi. |
| **Health check & graceful shutdown** | Endpoint `/health` di backend untuk dicek Sumopod/monitoring; proses Node menangani `SIGTERM` untuk selesaikan request yang sedang berjalan sebelum mati saat redeploy | Server self-hosted (§9.1) tidak otomatis punya zero-downtime deploy seperti PaaS terkelola — restart naif bisa memutus transaksi kiosk yang sedang berjalan. |
| **Dokumentasi arsitektur hidup** | README per package (`kiosk`, `dashboard-company`, `dashboard-mitra`, `backend`, `gateway`) berisi cara jalan lokal + link ke bagian relevan PRD ini; catat keputusan besar (Supabase, Sumopod, abstraksi payment provider) sebagai ADR (Architecture Decision Record) ringkas saat diimplementasikan | PRD ini adalah sumber kebenaran keputusan produk/arsitektur saat ini, tapi begitu development mulai, kode & README perlu tetap sinkron dengan keputusan yang berubah — jangan biarkan PRD basi jadi satu-satunya dokumentasi. |
| **Konsistensi versi Node/tooling** | Kunci versi Node.js (`.nvmrc`/`engines` di `package.json`) dan versi pnpm di seluruh monorepo (§9.4) | Server self-hosted (Sumopod) dan mesin developer harus pakai versi runtime yang sama persis — beda versi Node adalah sumber bug "jalan di laptop saya" yang umum di deployment self-hosted. |

## 10. Skema Bisnis Mitra (dari Company Profile)

Company profile mendefinisikan **dua skema kerja sama mitra lokasi**, bukan satu skema bagi hasil tunggal seperti asumsi awal di §1/§6 — ini update penting untuk model data `Mitra`/`Lokasi` dan tabel `Laporan`:

| | **Fixed Rental (Sewa Murni)** | **Revenue Sharing (Bagi Hasil)** |
|---|---|---|
| **Skema** | Mitra sewa unit dengan harga tetap, kontrol & 100% pendapatan sewa milik mitra | Smartbox & mitra bagi hasil otomatis dari pendapatan sewa |
| **Harga indikatif** | Rp 1.150.000/bulan, minimum kontrak 2 tahun | Biaya awal fleksibel, disesuaikan potensi area (belum ada angka baku) |
| **Include** | Instalasi, Dashboard Admin & operasional | Instalasi, Dashboard real-time, **gratis jasa maintenance** |
| **Exclude** | Jasa maintenance, ongkir & operasional pemasangan fisik | Ongkir & operasional pemasangan fisik |
| **Risiko mitra** | Mitra tanggung sendiri jasa maintenance | Nol risiko awal bagi mitra (model "pendapatan pasif") |

**Dampak ke produk:**
- Model data `Mitra` (§6) perlu field **tipe skema** (`fixed_rental` vs `revenue_sharing`), bukan asumsi satu formula bagi hasil untuk semua mitra.
- Untuk mitra `fixed_rental`: dashboard mitra tetap tampilkan pendapatan kotor 100% miliknya (tidak ada perhitungan split), laporan cukup rekap transaksi.
- Untuk mitra `revenue_sharing`: **persentase split bersifat dinamis/bervariasi per mitra** (dinegosiasikan sesuai potensi area, bukan satu angka baku untuk semua mitra — konsisten dengan "Biaya awal fleksibel, disesuaikan potensi area" di company profile). Konsekuensi desain: field persentase split harus disimpan **per relasi Mitra–Lokasi**, bukan konstanta global/kode-keras di aplikasi, dan idealnya punya riwayat perubahan (persentase bisa direnegosiasi saat perpanjangan kontrak) — perlu tabel/versi histori, bukan cuma satu kolom `persentase` yang di-overwrite.
- Status kontrak **jasa maintenance gratis** (khusus `revenue_sharing`) harus tercermin di tiket Ops (mis. prioritas SLA berbeda dari mitra fixed rental yang self-maintain).
- Ini **menjawab** risiko #2 di §12 (skema bagi hasil belum jelas): kerangka 2 skema sudah ada, dan sifat persentase revenue sharing sudah dikonfirmasi dinamis per mitra (by design, bukan keputusan bisnis yang masih menggantung) — model data harus mendukung variasi ini sejak awal, bukan diperlakukan sebagai konstanta.

## 11. Metrik Keberhasilan (indikatif, sesuaikan dengan target bisnis)

- Tingkat penyelesaian sesi sewa (mulai → pintu terbuka) ≥ 95%.
- Rata-rata waktu transaksi sewa < 60 detik, ambil barang < 45 detik.
- Unit uptime (online & fungsional) ≥ 98% per bulan.
- Waktu Ops merespons unit offline/anomali < 15 menit (butuh alerting).

## 12. Risiko & Pertanyaan Terbuka

1. Vendor hardware locker & controller pintu final belum dikontrak — company profile (§8.1–§8.3) memberi arsitektur & spesifikasi acuan (Mini PC, Main Controller Board, Power Supply Board, Electric Lock, dsb.), tapi masih perlu due diligence vendor (kualitas, harga, dukungan purna jual) sebelum komit — tetap blocker terbesar untuk timeline. **Sebagian terjawab**: Mini PC terkonfirmasi **Raspberry Pi** (dari spek produk layar sentuh 7″ yang dibeli — kompatibel Raspberry Pi 4/4B/3B+/3B/2B/Zero W, HDMI + USB-C plug-and-play), jadi OS (Raspberry Pi OS) & runtime gateway (§9.1) sudah bisa dipastikan. Yang **masih** belum terjawab: protokol komunikasi Main Controller Board ↔ Raspberry Pi (serial/RS485 vs proprietary, §8) — ini yang tetap memblokir SMB-502–505/510 (Epic 5, gateway hardware service) sampai Main Controller Board final dikontrak/diperiksa langsung.
2. **Terjawab**: kerangka skema bagi hasil sudah ada (lihat §10, §5.4) — Fixed Rental (Rp 1.150.000/bulan, min. 2 tahun, 100% pendapatan mitra) vs Revenue Sharing (persentase split dinamis/dinegosiasikan per mitra sesuai potensi area). **Rentang persentase revenue sharing: 0–100%** (batas penuh, tidak ada batas bisnis tambahan yang mempersempit rentang ini). **Approval persentase per mitra adalah wewenang role Manager** — form input di Dashboard Company (§5.4) perlu validasi input persentase di rentang 0–100 (inclusive), dan approval Manager tetap wajib sebelum berlaku berapa pun nilainya. Sisa yang masih terbuka: kebijakan renegosiasi persentase saat perpanjangan kontrak (§10) belum didefinisikan.
3. **Terjawab** (lihat §5.3, §8.1): **Staff adalah role yang memegang & menggunakan kunci fisik Emergency Unlock** di lapangan. Perlu SOP & audit trail — siapa staff yang bertugas, kapan dipakai, dicatat manual/terpisah dari sistem karena aksinya tidak melewati software (lihat §5.3).
4. **Terjawab**: kebijakan retensi data nomor HP penyewa — **disimpan 6 bulan setelah sesi sewa selesai, lalu dihapus permanen** (bukan anonimisasi, bukan disimpan selamanya). Detail implementasi (scheduled job purge, field nullable, baris transaksi tetap ada) di §6 dan §7.
5. Berapa proyeksi jumlah unit di 6–12 bulan pertama — dengan hosting server sendiri via Sumopod (§9.1, §12 poin 10, bukan lagi cloud multi-region generik), ini sekarang menentukan **kapasitas server yang perlu disiapkan/di-scale sendiri** (CPU/RAM/koneksi MQTT bersamaan), bukan pilihan region cloud.
6. **Terjawab (persiapan arsitektur saja, verifikasi ditunda)**: belum ada unit fisik — akan diadakan nanti. RFID Card dan PIN Code tetap **masuk roadmap Fase 2** (lihat §4.2) karena punya dasar hardware yang jelas dari spesifikasi umum §8.1. **Face Recognition disiapkan di level arsitektur** (modul autentikasi kiosk tetap dirancang multi-metode, §4.2) **tapi statusnya tetap "belum terverifikasi"** sampai unit fisik benar-benar diadakan dan dicek langsung apakah modul kamera tersedia (bukan lagi soal menghubungi vendor lebih dulu, tapi soal menunggu procurement §12 poin 1 selesai). Jangan komit tanggal rilis Fase 2 untuk Face Recognition sebelum verifikasi fisik ini terjadi.
7. **Terjawab**: model non-transaksional (penitipan gratis/fasilitas gedung) **masuk cakupan produk** (lihat §4.4a) — perlu didesain sebagai varian skema pemakaian terpisah dari sewa berbayar.
8. **Terjawab (revisi kedua)**: ukuran layar kiosk final **dikunci ke 7″ IPS, panel 1024×600 native** (spesifikasi company profile, §8.1) — bukan referensi 8″ 1280×800 portrait yang dipakai `docs/design_reference/`. Konsekuensi: kanvas kiosk & breakpoint di `docs/design_reference/` (§13.1) harus **disesuaikan ulang** sebelum kiosk UI dibangun dari komponennya. **Revisi kedua**: orientasi mount ternyata **portrait** (panel dirotasi 90° → viewport efektif 600×1024), bukan landscape seperti diputuskan pertama kali — kanvas & seluruh layar `client/kiosk` sudah dikalibrasi ulang lagi ke 600×1024 portrait (susun vertikal, bukan split kiri-kanan). Ini pekerjaan desain lanjutan (re-kalibrasi canvas, grid, dan skala ulang komponen kiosk seperti `IdleScreen`/`QRScreen`/`Numpad`), bukan lagi soal menunggu keputusan vendor.
9. **Terjawab**: kosakata status loker resmi **dikunci mengikuti 5 nilai design system: Tersedia · Terisi · Maintenance · Offline · Nonaktif** — ini standar resmi untuk enum `Loker.status` di backend, dipakai identik di kiosk, dashboard, dan struk. §5.4 ("kosong/terisi/rusak", 3 nilai) sudah usang dan digantikan oleh standar ini — lihat pembaruan di §5.4/§6.
10. **Terjawab**: penanggung jawab ops server Sumopod (§9.1, §9.2, §7.1) adalah **Super Admin** — bukan Ops, Staff, atau pihak eksternal. Super Admin memegang akses server produksi (SSH, env config, restart/deploy) dan jadi kontak pertama untuk SOP incident response saat server backend down. Ini konsisten dengan §5.4 yang sudah menetapkan Super Admin sebagai satu-satunya role dengan akses penuh ke provisioning & konfigurasi sistem.

## 13. Design System (dari `docs/design_reference/`)

Selain dua prototipe JSX di header, tersedia satu **design system foundations** terpisah dan lebih matang di `docs/design_reference/` — token, primitif komponen, dan guideline, belum jadi layar produk jadi (kiosk UI & dashboard UI eksplisit "not built on purpose", disiapkan sebagai next project yang mengonsumsi sistem ini). Ini jadi acuan visual utama begitu implementasi UI dimulai.

### 13.1 Yang sudah dikunci (siap dipakai)
- **Warna**: primary `#1E3A8A` (navy), secondary `#2563EB`, accent violet `#7C3AED`, spark oranye `#F26419` dari logo. Status **terkunci lintas semua varian palet**: Tersedia `#16A34A`, Terisi `#EAB308` (fill-only, teks selalu `#A16207`), Maintenance/Offline `#DC2626`, Nonaktif `#8A94A9`.
- **Tipografi**: Lexend untuk semua heading, seluruh teks kiosk, dan angka; Manrope untuk running text/dashboard; mono hanya untuk ID transaksi & kode unit. **24 px adalah batas bawah mutlak** untuk semua teks kiosk (alasan: panel ~189 ppi, jarak baca 50–90 cm).
- **Target sentuh kiosk**: minimum 88 px, nyaman 112 px, CTA utama 128 px — bukan saran, jadi konstrain wajib untuk semua tombol kiosk (selaras dengan §7 kebutuhan aksesibilitas praktis, walau bukan mode aksesibilitas formal).
- **Kanvas kiosk acuan — SUDAH DIKALIBRASI ULANG DUA KALI (SMB-801)**: `docs/design_reference/` sekarang memakai token `--sl-kiosk-w`/`--sl-kiosk-h` = **600×1024px, portrait-only** (~170ppi, gutter 24px, content-max 552px), sesuai hardware final (§8.1, §12 poin 8) — panel 7″ IPS 1024×600 native yang sama, dipasang rotasi 90°. Referensi lama (8″ tablet, 800×1280 portrait, ~189ppi; lalu sempat dikalibrasi ke 1024×600 landscape sebelum orientasi mount dikonfirmasi ulang) sudah diganti di token, guideline (`guidelines/kiosk-canvas.card.html`, `type-kiosk-scale.card.html`), dan `readme.md` design system. Implikasi desain: lebar (600px) sekarang jadi sumbu yang paling sempit (bukan tinggi), jadi setiap layar kiosk harus muat step bar + judul + satu blok konten + baris CTA tanpa scroll horizontal — susun vertikal (konten atas, keypad/QR bawah) lebih diutamakan daripada split kiri-kanan.
- **Bahasa & nada**: 100% Bahasa Indonesia di kiosk saat ini, *Anda* implisit, tombol ≤3 kata verb-first ("Sewa Loker", "Buka Pintu"), tanpa emoji, **tidak pernah menjanjikan aplikasi** — selaras persis dengan prinsip "tanpa aplikasi" di §1/§4.2. Konten ini akan dipetakan ke key i18n (§7.2) saat diimplementasikan, bukan hardcode string — satu-satunya locale aktif adalah `id`, tapi strukturnya sudah siap tambah bahasa lain di Fase 2.
- **Kosakata status terkunci**: Tersedia · Terisi · Maintenance · Offline · Nonaktif — **sudah dikonfirmasi sebagai standar resmi enum `Loker.status` di backend** (§12 poin 9, §6). Sinonim tidak boleh dipakai ("Kosong", "Dipakai"), kata yang sama harus muncul identik di tile kiosk, badge dashboard, dan struk.
- **Format angka**: Rupiah titik ribuan tanpa desimal (`Rp 15.000`), disingkat hanya di stat tile (`Rp 4,82jt`) — konsisten dengan aturan `rpJt` yang sudah dicatat di §6.
- **Motion**: durasi & easing terdefinisi per konteks (80 ms tekan tombol, 700 ms animasi pintu, 900 ms sukses bayar), `prefers-reduced-motion` menyusutkan semua ke 1 ms.

### 13.2 Inventaris komponen siap pakai
- **Kiosk** (`components/kiosk/`): `KioskButton`, `Numpad`, `CompartmentCard` (tile status loker), `StepProgress`, `QRScreen` (panel QRIS full-screen dengan countdown masa berlaku — langsung cocok untuk §5.1 langkah 5), `IdleScreen`.
- **Dashboard** (`components/dashboard/`): `Sidebar`, `StatCard`, `DataTable`, `StatusBadge`, `Panel`, `Field`, `Button`.
- **Motion** (`components/motion/`): `DoorTransition` (animasi buka pintu 700 ms — cocok untuk §5.1 langkah 6), `SuccessBurst` (konfirmasi bayar sukses), `StatusPulse` (indikator data realtime, harus "freeze" saat stream mati — relevan untuk NFR observability di §7).
- **Gap yang harus ditambahkan** (belum ada di inventaris saat ini, dibutuhkan §5.6/§9.3): `ConfirmDialog` (modal konfirmasi aksi sensitif), komponen `Toast`/notifikasi non-blocking, dan komponen paginasi eksplisit untuk `DataTable` (kontrol halaman + info total data) bila belum termasuk propsnya saat ini. Tambahkan mengikuti pola token/komponen yang sudah ada (§13.1), jangan bangun terpisah dari sistem desain.

### 13.3 Implikasi untuk implementasi
- Saat kiosk & dashboard mulai dibangun (di luar cakupan dokumen ini), **konsumsi `docs/design_reference/` sebagai design system**, bukan membangun ulang dari prototipe JSX lama — prototipe JSX tetap jadi acuan **alur/flow** (§5), sedangkan `docs/design_reference/` jadi acuan **visual & komponen**.
- Ukuran layar kiosk **sudah diputuskan dan kanvas design system sudah dikalibrasi ulang** (7″ panel 1024×600 native, mount portrait → 600×1024, §12 poin 8, SMB-801) — tidak ada lagi pekerjaan tertunda di titik ini, kiosk UI (Epic 3/4, `client/kiosk`) sudah dibangun di atas canvas final ini.
- Enum status loker **sudah diputuskan** (5 nilai design system, §12 poin 9, §6) — tinggal diimplementasikan sebagai standar di skema database & UI, tidak perlu menunggu keputusan lagi.
- Satu item masih perlu dilengkapi sebelum build dimulai: komponen `ConfirmDialog`/`Toast`/paginasi (§13.2) sebelum Dashboard Company/Mitra (§5.4–§5.6) mulai diimplementasikan.

## 14. Strategi Lingkungan (Development / Staging / Production)

Karena backend self-hosted via Sumopod (§9.1) dan tidak ada jaring pengaman PaaS terkelola, **3 lingkungan terpisah wajib ada sebelum unit fisik pertama live** — bukan opsional, mengingat ada transaksi uang nyata (§7.1, §9.5 sudah menyinggung prinsip ini; bagian ini merincikannya).

### 14.1 Perbandingan 3 Lingkungan

| Aspek | Development | Staging | Production |
|---|---|---|---|
| **Tujuan** | Kerja harian developer, eksperimen bebas | Validasi sebelum rilis — "seperti production tapi aman untuk dites" | Melayani unit fisik & transaksi nyata |
| **Project Supabase** | 1 project terpisah (`smartbox-dev`), boleh reset kapan saja | 1 project terpisah (`smartbox-staging`), data mendekati realistis tapi bukan data nyata | 1 project khusus (`smartbox-prod`), akses dibatasi ketat |
| **Instance Sumopod** | Opsional — banyak developer cukup jalankan backend lokal (`localhost`), Sumopod dev instance hanya untuk kebutuhan integrasi (mis. webhook perlu URL publik) | 1 instance Sumopod terpisah dari production, domain `staging.*` | 1 instance Sumopod produksi, domain resmi, hardening penuh (§7.1) |
| **Payment gateway** | Xendit/Midtrans **mode sandbox**, kredensial test | Xendit/Midtrans **mode sandbox** (bukan live) — staging tidak pernah memproses uang asli | Xendit/Midtrans **mode live**, kredensial production disimpan sesuai §7.1 |
| **WhatsApp OTP** | Nomor test/sandbox BSP, atau mock (OTP di-log ke console, tidak benar-benar dikirim) | Nomor test BSP sungguhan (supaya tim bisa validasi pesan asli terkirim) | Nomor resmi terverifikasi BSP (§8) |
| **Cloudinary** | Folder/preset terpisah (`smartbox-dev/`), boleh dihapus isinya kapan saja | Folder terpisah (`smartbox-staging/`) | Folder/akun produksi (`smartbox-prod/`), sesuai §9.1/§9.2 |
| **Data** | Data dummy/seed, di-reset bebas | Data mendekati realistis (seed representatif: beberapa mitra, unit, skema campuran fixed/revenue-sharing) — **tidak pernah pakai data penyewa asli** (nomor HP dummy, PRD §7) | Data nyata, retensi & RLS berlaku penuh (§7.2) |
| **Kiosk yang terhubung** | Simulator/browser biasa (bukan hardware fisik) | Idealnya 1 unit fisik "kiosk staging" khusus (kalau ada) — kalau belum ada unit fisik (§12 poin 1), tetap browser simulator dengan viewport 600×1024 (§8.1, §13.1) | Unit fisik sungguhan di lokasi mitra |
| **Observability** | Opsional, log lokal cukup | Sentry + Grafana/Prometheus aktif (uji alerting sebelum production, §9.4) | Sentry + Grafana/Prometheus wajib aktif penuh (§7, §9.4) |
| **Akses** | Semua developer | Tim internal (Super Admin, Ops, developer) — **tidak untuk mitra** | Dibatasi sesuai role (§5.4/§5.5); akses server (SSH) hanya Super Admin (§12 poin 10) |
| **Deploy trigger** | Push ke branch fitur → auto-deploy ke dev (opsional) | Merge ke branch `staging`/`develop` → auto-deploy (CI, §9.1) | Tag rilis / merge ke `main` → **deploy manual atau approval eksplisit**, tidak auto-deploy tanpa review |

### 14.2 Alur promosi kode

```
branch fitur → PR → (lint + test + build, §9.5) → merge ke `develop`
                                                        │
                                                        ▼
                                          auto-deploy ke Staging
                                                        │
                                          validasi manual + E2E (Playwright, §9.4)
                                                        │
                                                        ▼
                                    tag rilis / merge ke `main`
                                                        │
                                          approval eksplisit (Super Admin/PIC teknis)
                                                        │
                                                        ▼
                                          deploy ke Production (Sumopod)
```

- **Tidak ada jalur langsung** dari branch fitur ke Production — semua perubahan wajib lewat Staging dulu, termasuk hotfix (kecuali insiden kritis yang eksplisit didokumentasikan sebagai pengecualian, bukan kebiasaan).
- Migration database (Prisma/Supabase migration, §9.5) dijalankan terurut: dev → staging → production, tidak pernah langsung ke production tanpa tervalidasi di staging lebih dulu.

### 14.3 Prinsip kunci

- **Isolasi total secara kredensial**: tidak ada satu pun API key/secret yang dipakai bersama antar 2 lingkungan atau lebih (§7.1) — kebocoran/kesalahan di dev tidak boleh bisa menyentuh data/transaksi production.
- **Staging = tempat menguji hal yang menakutkan untuk dites langsung di production**: migration skema, perubahan RLS policy, penggantian payment provider (§8), upgrade dependency besar (§9.4).
- **Production tidak pernah jadi tempat eksperimen** — kalau sesuatu "cuma perlu dicek cepat di production", itu tanda staging belum representatif dan perlu diperbaiki, bukan alasan untuk melewati staging.
- Rencana ini konsisten dengan §9.5 (pemisahan environment sudah disinggung di sana sebagai praktik maintainability) — bagian ini adalah rincian operasionalnya.

---

*Dokumen ini adalah draft berbasis prototipe UI, company profile vendor (`docs/Sewa-Smart-Locker (3).pdf`), design system (`docs/design_reference/`), dan ERD (`docs/ERD-Smartbox.md`). Database utama sudah diputuskan memakai **Supabase** (§9.2), server backend di-hosting sendiri via **Sumopod** (§9.1, §12 poin 10) dengan 3 lingkungan terpisah (§14), storage gambar via **Cloudinary** dan dokumen via **Supabase Storage** (§9.1/§9.2), payment gateway mendukung **Xendit & Midtrans** yang bisa dikonfigurasi ulang (§8), dan ukuran layar kiosk sudah dikunci **dan kanvas design system sudah dikalibrasi ulang** ke **7″ panel 1024×600 native, mount portrait → 600×1024** (§8.1, §12 poin 8, SMB-801). Perlu direview bersama tim bisnis (target lokasi, kebijakan renegosiasi persentase), dan tim hardware (kontrak vendor locker, §12 poin 1) sebelum masuk fase desain teknis rinci.*
