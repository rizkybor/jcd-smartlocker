# jcd-smartlocker — Smartbox (Sewa Smart Locker)

Monorepo untuk produk Smartbox — sistem sewa smart locker self-service (kiosk) dengan dashboard internal & mitra.

## Dokumentasi

Seluruh keputusan produk, arsitektur, dan kontrak teknis ada di [`docs/`](docs/):

- [`docs/PRD-Smartbox.md`](docs/PRD-Smartbox.md) — Product Requirements Document (sumber kebenaran utama)
- [`docs/ERD-Smartbox.md`](docs/ERD-Smartbox.md) — skema database
- [`docs/API-Contract-Smartbox.md`](docs/API-Contract-Smartbox.md) — kontrak API Kiosk↔Backend↔Dashboard↔Gateway
- [`docs/Epics-Smartbox.md`](docs/Epics-Smartbox.md) — breakdown epic & ticket
- [`docs/design_reference/`](docs/design_reference/) — design system foundations (tokens, komponen)
- [`docs/Prototipe UI Kiosk Sewa Smart Locker/`](docs/Prototipe%20UI%20Kiosk%20Sewa%20Smart%20Locker/) — prototipe alur (acuan flow, bukan kode produksi)

## Struktur repo

```
jcd-smartlocker/
├── client/
│   ├── kiosk/                 # @smartbox/kiosk — touchscreen app (PRD §5.1-§5.2)
│   ├── dashboard-company/     # @smartbox/dashboard-company — internal, multi-role (PRD §5.4)
│   ├── dashboard-mitra/       # @smartbox/dashboard-mitra — eksternal, read-only (PRD §5.5)
│   └── packages/
│       └── ui/                # @smartbox/ui — design system package (PRD §13.3)
├── server/
│   ├── backend/                # @smartbox/backend — API NestJS + TypeScript (scaffolded)
│   └── gateway/                # @smartbox/gateway — service di Mini PC dalam unit locker
└── docs/
```

## Setup

```bash
nvm use          # Node versi sesuai .nvmrc
pnpm install      # install semua workspace
cp server/backend/.env.example server/backend/.env   # isi sesuai environment (lihat docs/PRD-Smartbox.md §14)
pnpm --filter @smartbox/backend run dev
```

> Status saat ini (Epic 0, `docs/Epics-Smartbox.md`): `server/backend` sudah di-scaffold NestJS dasar — `ConfigModule` dengan validasi environment variable via Zod (fail-fast, §9.5), endpoint `GET /health`, graceful shutdown. Belum ada module domain (auth, unit, mitra, dst. — lihat Epic 1). App lain (`client/*`, `server/gateway`) masih placeholder — lihat script `dev`/`build` di `package.json` masing-masing.

## Database (Epic 1)

Skema di `server/backend/prisma/schema.prisma` (13 model, sinkron dengan `docs/ERD-Smartbox.md`) sudah diterapkan ke project Supabase development — tabel, enum, foreign key, CHECK constraint persentase 0–100, dan RLS policy isolasi mitra semuanya sudah hidup.

**Cara diterapkan:** bukan lewat `prisma migrate dev` biasa — sandbox development saat ini tidak punya akses jaringan ke port Postgres (5432/6543), jadi:
1. SQL migration awal (`prisma/migrations/<timestamp>_init/migration.sql`, di-generate via `prisma migrate diff --from-empty` yang tidak butuh koneksi DB) dijalankan manual lewat Supabase SQL Editor.
2. Suplemen `prisma/sql/constraints_and_rls.sql` (CHECK constraint + RLS) dijalankan manual juga lewat SQL Editor.

**TODO housekeeping:** tabel `_prisma_migrations` Supabase belum tahu migrasi `init` ini sudah diterapkan (karena diterapkan manual, bukan lewat `prisma migrate deploy`). Begitu Anda run Prisma CLI dari mesin dengan akses jaringan penuh ke Supabase (laptop sendiri, bukan sandbox ini), jalankan dulu:
```bash
pnpm --filter @smartbox/backend exec prisma migrate resolve --applied <nama_folder_migration_init>
```
supaya riwayat migrasi Prisma sinkron, baru migration berikutnya bisa jalan normal lewat `prisma migrate dev`.

## Environment

Lihat `docs/PRD-Smartbox.md` §14 untuk strategi Development/Staging/Production — 3 project Supabase terpisah, instance Sumopod terpisah, kredensial payment sandbox vs live.
