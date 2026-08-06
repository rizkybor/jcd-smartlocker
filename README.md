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
│   ├── backend/                # @smartbox/backend — API (NestJS/Fastify + Supabase)
│   └── gateway/                # @smartbox/gateway — service di Mini PC dalam unit locker
└── docs/
```

## Setup

```bash
nvm use          # Node versi sesuai .nvmrc
pnpm install      # install semua workspace
cp .env.example server/backend/.env   # isi sesuai environment (lihat docs/PRD-Smartbox.md §14)
```

> Status saat ini: skeleton monorepo (Epic 0, `docs/Epics-Smartbox.md`). Tiap app masih placeholder — lihat script `dev`/`build` di `package.json` masing-masing untuk ticket scaffolding berikutnya.

## Environment

Lihat `docs/PRD-Smartbox.md` §14 untuk strategi Development/Staging/Production — 3 project Supabase terpisah, instance Sumopod terpisah, kredensial payment sandbox vs live.
