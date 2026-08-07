# Sewa Smart Locker — Design System

**PT Jendela Cakra Digital** · IoT smart-locker rental for Indonesian properties.

Sewa Smart Locker rents lockers by the hour inside apartments, offices, public spaces, sports venues, malls and swimming pools. The user rents and opens a compartment **directly on the touchscreen embedded in the physical unit** — no separate app, no conventional key. Admins watch revenue, occupancy and door state in realtime from a central web dashboard.

Two surfaces, two very different design problems, one brand:

| Surface | Context | Design consequence |
| --- | --- | --- |
| **Kiosk touchscreen** | Standing user, 50–90 cm away, wet/gloved hands, bright ambient light, 15–60 s session, often a first-time user. **Reference hardware: 7″ IPS panel, 1024×600 native, mounted rotated 90° → 600×1024 CSS px, ~90×153 mm, ~170 ppi, portrait-only fixed mount** (recalibrated twice — first from an 8″/portrait assumption to landscape, then confirmed the panel is actually mounted portrait — see docs/PRD-Smartbox.md §8.1/§12 poin 8, SMB-801). | 88 px minimum touch targets, 24 px minimum type, one decision per screen (width, not height, is the scarce axis here), light backgrounds only, borders instead of shadows, status wording never colour-alone |
| **Admin dashboard** | Seated operator, desktop, long sessions, dense realtime data | 32/40/48 px controls, 12–16 px type, elevation ladder, tabular numerals, navy navigation rail |

This system contains the **shared foundations and reusable components only**. The kiosk UI and the admin dashboard products are deliberately *not* built here — they are the next two projects and both consume this system.

## Sources given

- `uploads/Smartlocker.png` — the existing logo (157×53 px PNG, transparent). **This is the only brand asset provided.** All lockups in `assets/` are derived from it (crop + recompose + luminance-mapped monochrome); no new mark was drawn.
- Written brief: company description, font recommendation (Lexend + Manrope), and the locked palette below.
- `lucide-icons/lucide` (https://github.com/lucide-icons/lucide) — attached as a local folder; 65 SVGs copied into `assets/icons/` under the ISC licence.
- Lexend and Manrope font families supplied as variable TTFs, self-hosted in `assets/fonts/`.
- No codebase, Figma file, deck or screenshots were provided. Component inventory therefore follows the brief's explicit list (kiosk components, dashboard components, motion) rather than an existing library.

## Colour system

| Role | Hex | Token |
| --- | --- | --- |
| Primary | `#1E3A8A` | `--sl-primary` |
| Secondary | `#2563EB` | `--sl-secondary` |
| Accent | `#7C3AED` | `--sl-accent` |
| Ink navy (from the logo outline) | `#0B1B45` | `--sl-ink-navy` |
| Spark (the orange dot in the mark) | `#F26419` | `--sl-spark` |

**Status colours are locked** and identical in every palette variant — never remapped, never re-tinted:

| Status | Fill | Text-safe | Token |
| --- | --- | --- | --- |
| Tersedia | `#16A34A` | `#15803D` | `--sl-status-available` / `-strong` |
| Terisi / disewa | `#EAB308` | `#A16207` | `--sl-status-occupied` / `-strong` |
| Maintenance / offline | `#DC2626` | `#B91C1C` | `--sl-status-offline` / `-strong` |
| Nonaktif / tidak dipakai | `#8A94A9` | `#454E63` | `--sl-status-neutral` |

Contrast rules for kiosk legibility:
- `#EAB308` is a **fill-only** colour. Yellow text fails contrast at every size — the word "Terisi" is always `#A16207`.
- On kiosk, status is carried by **three** signals at once: an 8 px colour bar, a dot, and the Indonesian word. A colour-blind user in bright sun must still be able to pick a free locker.
- Interactive kiosk screens are always light (`#F7F9FC` chrome, `#FFFFFF` cards). Dark UI mirrors sunlight and shows fingerprints. Dark navy is reserved for the **idle screen** and the dashboard sidebar.
- Minimum contrast target on kiosk: 7:1 for body copy, 4.5:1 for large numerals — one step above WCAG AA, because the screen may be behind glass or in glare.

## Typography

Two families, non-negotiable split:

- **Lexend** (`--sl-font-display`) — every heading, **all kiosk text**, and all numerals. Chosen because it was engineered against reading-proficiency research: lowest misreading risk on a kiosk that a stranger reads once, quickly, from a standing distance.
- **Manrope** (`--sl-font-body`) — running text, dashboard chrome, labels, hints, help copy. Adds warmth suited to public spaces (apartments, pools, malls) rather than cold industrial IoT.
- **System mono** (`--sl-font-mono`) — machine identities only: transaction IDs, unit codes (`JCD-KLP-002`), log lines.

Kiosk scale — **24 px is a hard floor, not a suggestion**:

| Token | Size | Use |
| --- | --- | --- |
| `--sl-kiosk-fs-mega` | 80 px | Countdown, one big number |
| `--sl-kiosk-fs-hero` | 56 px | Price, locker number, idle headline |
| `--sl-kiosk-fs-title` | 40 px | Step titles |
| `--sl-kiosk-fs-label` | 32 px | Button labels, field labels |
| `--sl-kiosk-fs-body` | 28 px | Instructions, list rows |
| `--sl-kiosk-fs-caption` | 24 px | Helper text, fine print — **minimum** |

Why 24 px is the floor on this hardware: the 7″ panel runs ~170 ppi (recalibrated from an earlier 8″/~189ppi assumption, SMB-801), so a 600 px-wide CSS viewport (portrait) puts one px at ≈0.15 mm — same physical pixel size as the panel's landscape native orientation, ppi doesn't change on rotation. 24 px ≈ 3.6 mm of type — comfortably readable at 50–90 cm, if anything more generous than on the old reference panel since the lower ppi makes each CSS px physically larger. Anything smaller drops below ~13 arc-minutes and a first-time user starts leaning in. The upper end of the scale is trimmed relative to a large-format kiosk (80/56/40 instead of 96/64/44) because the canvas is compact on its narrow axis, not because the user is closer.

Dashboard scale runs 11 → 48 px (`--sl-fs-*`); body is 14 px, table headers 12 px uppercase with `0.08em` tracking. Money and counts always set tabular numerals (`.sl-num`) so realtime updates don't jitter.

**Fonts are self-hosted** — no CDN, so a kiosk keeps its type when the network drops. `tokens/fonts.css` declares two variable faces from `assets/fonts/`: `Lexend-Variable.ttf` (wght 100–900) and `Manrope-Variable.ttf` (wght 200–800). Both are SIL Open Font License; licence texts sit beside them (`Lexend-OFL.txt`, `Manrope-OFL.txt`). Use the `--sl-fw-*` tokens for weights — the variable axis covers every step, so never load static cuts. The logo wordmark is a **bold serif** that neither family matches — never re-type it, always use the image asset.

## Content fundamentals

- **Language: Indonesian, on both surfaces.** Kiosk copy is 100% Bahasa Indonesia; the dashboard is Indonesian with accepted English operations terms (dashboard, export, realtime, maintenance).
- **Voice:** plain, calm, instructional. Address the user with implicit *Anda* — "Masukkan PIN loker Anda", not "Silakan Bapak/Ibu berkenan…". Never chatty, never salesy on the unit.
- **Kiosk copy is verb-first and ≤ 3 words on buttons:** "Sewa Loker", "Buka Pintu", "Kembali", "Selesai", "Batalkan". Titles ≤ 5 words: "Pilih Ukuran Loker", "Scan untuk Bayar", "Pembayaran Berhasil".
- **Casing:** Title Case for kiosk titles, buttons and step labels. Sentence case for instructions and dashboard hints. UPPERCASE only for 11–12 px dashboard eyebrow labels and the numpad's `HAPUS`.
- **Numbers:** rupiah with a full stop thousands separator and no decimals — `Rp 15.000`. Abbreviated only in stat tiles — `Rp 4,82jt`. Comma is the decimal separator (`12,4%`). Durations in words: "3 jam", "sampai 18:30".
- **Status wording is fixed vocabulary:** Tersedia · Terisi · Maintenance · Offline · Nonaktif. Do not invent synonyms ("Kosong", "Dipakai") — the same word appears on the kiosk tile, the dashboard badge and the receipt.
- **Errors name the next action, not the fault:** "Tarif tidak boleh kosong." / "Loker sedang maintenance. Silakan pilih loker lain." Never expose hardware codes to the renter; show a short support ticket number instead ("Tiket #2291").
- **No emoji, anywhere.** Public infrastructure in a shared property; emoji reads as consumer-app noise and doesn't survive the kiosk's viewing distance.
- **Never promise an app.** The differentiator is "tanpa aplikasi, tanpa kunci" — copy must not send the user to a download.

## Visual foundations

**Motifs.** The logo mark is a 2×2 grid of compartments — a rounded square, split in four, one orange spark at the centre. That grid *is* the brand motif: compartment tiles, the dashboard's card grid, the faint 88 px grid overlay on the idle screen. Repeat the grid; do not add unrelated ornament.

**Backgrounds.** Flat colour, essentially always. `--sl-n-50` for dashboard pages, `#F7F9FC` for kiosk chrome, white for cards. Exactly **one** gradient exists in the system: the idle screen's navy radial (`radial-gradient(120% 90% at 50% 0%, #1E3A8A, #0B1B45 62%, #060F2B)`), plus a 5%-white 88 px grid overlay. No photography, no illustration, no texture, no noise — the kiosk is a utility, and photographic backgrounds destroy legibility under glare.

**Cards.** White fill, `1px solid --sl-border` (`#D6DCE8`), `--sl-radius-md` (12 px), `--sl-elev-1`. On kiosk the same card becomes `2px` border, `--sl-radius-lg` (16 px), **no shadow** — a 1 px hairline vanishes at arm's length. Compartment tiles add an 8 px full-height status bar on the left edge; that bar is the one "accent edge" pattern in the system, and it is only ever used for status, never decoration.

**Shadows.** Cool navy (`rgba(11,27,69,…)`), never black — black shadows go muddy over the blue-grey neutrals. Six-step ladder: `1` resting card, `2` hover/drag, `3` dropdown, `4` modal, `5` full overlay. Inputs carry `--sl-elev-inset` (a 1 px inner top highlight) so a field reads as recessed. The kiosk's only shadow is a hard **8 px solid lift** under coloured buttons (`0 8px 0 <darker tone>`, no blur) — it reads as a physical key cap and survives glare.

**Radii.** 4 / 8 / 12 / 16 / 24 / 32 / pill. Dashboard controls 8 px; dashboard cards 12 px; kiosk buttons and tiles 16 px; kiosk QR frame 24 px. Pill is reserved for status badges, countdown pills and dots. Nothing is fully square, nothing is a circle except dots and the success badge.

**Spacing & layout.** 4 px base. Dashboard uses 16/24 px gutters, 264 px sidebar (76 px collapsed), 1440 px max content width. The kiosk is designed against the **actual vendor panel: 1024×600 native, mounted rotated 90° → 600×1024 CSS px, portrait-only, fixed mount** (recalibrated twice — landscape first, then corrected to portrait once the physical mount was confirmed, docs/PRD-Smartbox.md §8.1/§12 poin 8, SMB-801) — 24 px page gutter, 552 px content column, and a minimum 20 px gap between adjacent touch targets. Width (600 px) is the scarce axis here, not height — budget step bar + title + one content block + CTA row inside it, no horizontal scroll. Prefer stacking vertically (content above, keypad or QR below) over a left/right split — 600 px is too narrow for two side-by-side blocks with comfortable touch targets. Never put two columns of decisions on a kiosk. Fixed elements: dashboard sidebar (full height, non-scrolling) and the kiosk's step indicator pinned at the top of every flow screen.

**Interaction states.**
- *Hover* (dashboard only — the kiosk has no pointer): fill darkens one step (`--sl-*-hover`); table rows tint to `--sl-primary-tint`; sidebar items take an 8% white wash.
- *Press*: dashboard scales to `0.98`; kiosk buttons translate **down 6 px** and their lift compresses 8 px → 2 px — a physically-pressed key, the only press metaphor a gloved finger can perceive.
- *Selected*: solid navy fill, 4 px `--sl-ink-navy` border, lifted 2 px, and the orange spark bar. This is the single place `--sl-spark` appears in the whole system.
- *Focus*: 4 px violet halo (`--sl-focus`, `rgba(124,58,237,.35)`). Violet — not blue — so focus is never confused with the blue brand fills.
- *Disabled*: `--sl-n-100` fill, `--sl-n-200` border, faint text, no shadow. Offline compartments are **never hidden**, only made inert.

**Motion.** Purposeful, short, never looping — with two exceptions. Durations: 80 ms press · 140 ms hover · 220 ms UI · 400 ms screen · 700 ms door · 900 ms success · 1200 ms idle crossfade. Easing is `cubic-bezier(.2,.8,.2,1)` for everything UI; `cubic-bezier(.34,1.28,.64,1)` ("door") overshoots slightly for the two physical moments — the compartment door swing and the success badge pop. The two allowed infinite animations are the realtime pulse halo and the idle screen's slow float. `prefers-reduced-motion` collapses everything to 1 ms (`tokens/animations.css`).

**Transparency & blur.** Only on the idle screen: 8% white glass tiles with `blur(8px)` over the navy. Never blur on a light surface, never a translucent panel over data — an operator must never read a number through another number.

**Imagery.** There is none, by design. Where a photo would go in a marketing context, use flat navy with the grid overlay. If product photography is added later it should be cool-toned, daylight, no grain, no people's faces on the kiosk itself.

## Iconography

**Lucide is the icon set** — vendored, not linked. 65 glyphs were copied from the `lucide-icons/lucide` repo (attached by the user) into `assets/icons/` as raw SVGs, with the ISC licence at `assets/icons/LICENSE.txt`. No CDN, so the kiosk keeps its icons offline. Nothing was hand-drawn.

Render them only through the `Icon` component (`components/icons/`), which masks the SVG so it inherits `currentColor`:

```jsx
window.SL_ICON_BASE = "../../assets/icons"; // once per page, if assets/ isn't at the page root
<Icon name="door-open" size={24} />
<Icon name="wifi-off" size={20} color="var(--sl-status-offline)" label="Unit offline" />
```

- **Style:** Lucide's 24 px grid, 2 px stroke, round caps and joins — geometric-humanist, matching Lexend's construction. Never mix in a filled or duotone set.
- **Sizing:** dashboard 16 px inline / 20 px in the sidebar's slot / 24 px standalone. **Kiosk icons are never below 48 px**, 56–64 px inside `xl` buttons. Stroke thickens proportionally as the mask scales, which is what keeps them readable at arm's length.
- **Colour:** leave icons inheriting text colour. Override only with a locked status colour (`--sl-status-*`) — a coloured icon must always *mean* that status.
- **Icons never travel alone on the kiosk.** Every kiosk icon is paired with a word; a first-time user in a mall will not decode a glyph.
- **Vocabulary is fixed** so the same idea always looks the same: `lock` / `lock-open` for locked state, `door-open` / `door-closed` for the physical door, `qr-code` + `scan-line` for payment, `wallet` / `banknote` / `receipt` for money, `wrench` for maintenance, `wifi-off` for offline, `triangle-alert` for alerts, `grid-2x2` for a locker unit, `package` for a rental, `timer` for duration, `delete` for numpad backspace.
- **Coverage by group:** Loker & pintu (10), Pembayaran (9), Status & waktu (12), Dashboard (20), Properti (5), Navigasi (9). Need another glyph? Copy it from the Lucide repo into `assets/icons/` and add the stem to `ICON_NAMES` — never draw one.
- **Unicode glyphs and emoji: never.** The earlier placeholder glyphs (`▦`, `☷`, `⚠`, `⌫`) have all been replaced by real Lucide icons.

## Logo & assets

The logo is a horizontal lockup: the 2×2 compartment mark (navy outline, two blue tones, orange centre spark, letters S·E·W·A in the quadrants) plus a bold serif "Smart Locker" wordmark.

| File | Use |
| --- | --- |
| `assets/logo-horizontal.png` | Original upload, 157×53 — the source of truth |
| `assets/logo-horizontal-2x.png` | Upscaled horizontal lockup for display at ≥ 200 px wide |
| `assets/logo-vertical.png` | Stacked lockup — kiosk idle screen, receipts, square placements |
| `assets/logo-mark.png` | Mark only — favicons, app tiles, compact chrome |
| `assets/logo-wordmark.png` | Wordmark only — rare; when the mark already appears nearby |
| `assets/logo-mono-dark.png` | Single-tone dark, for light backgrounds and print |
| `assets/logo-mono-light.png` | Knockout for navy — sidebar, idle screen |
| `assets/fonts/` | Lexend + Manrope variable TTFs and their OFL licences |
| `assets/icons/` | 65 vendored Lucide SVGs + ISC licence |

Rules: clear space equal to the mark's corner radius ×2 on all sides; minimum horizontal width 120 px (mark alone: 32 px); never recolour, stretch, outline, add effects, or place on a busy background; never re-set the wordmark in Lexend.

⚠️ **Asset quality caveat:** the supplied PNG is 157×53 px. The derived lockups are interpolated and will look soft above roughly 300 px wide, and there is no monochrome or vector master. **Please send the original vector (SVG/AI/EPS) or a high-resolution PNG** and I'll regenerate all lockups crisply.

## Components

Reusable primitives only — no product screens. Every component is self-contained React + CSS custom properties, with a sibling `.d.ts` (props) and `.prompt.md` (when & how).

**`components/kiosk/`** — touchscreen primitives, 88 px+ targets, 24 px+ type
- `KioskButton` — the only button allowed on the unit; 88/112/128 px, 8 px solid lift, press-down feedback
- `Numpad` — on-screen numeric keypad with PIN echo cells
- `CompartmentCard` — compartment tile: available / occupied / offline / selected, size class, price
- `StepProgress` — step-by-step flow indicator (also a `compact` dashboard variant)
- `QRScreen` — full-screen QRIS payment / access-code panel with validity countdown
- `IdleScreen` — attract / screensaver state with live availability tiles

**`components/dashboard/`** — desktop admin primitives
- `Sidebar` — fixed navy navigation rail, 264 / 76 px, sections and alert badges
- `StatCard` — summary metric tile with delta and status accent rule
- `DataTable` — transaction / unit grid, tabular numerics, row hover, footer slot
- `StatusBadge` — the single source of truth for status wording and colour
- `Panel` — surface container owning the 0–5 elevation ladder
- `Field` — input / textarea / select with label, hint and error states
- `Button` — 32/40/48 px dashboard control (primary, secondary, outline, ghost, danger)

**`components/motion/`** — status-transition motion
- `DoorTransition` — compartment door swings open, 700 ms with latch overshoot
- `SuccessBurst` — payment-success rings, badge pop, drawn check, staggered copy
- `StatusPulse` — realtime "data is live" indicator; freeze it when the stream drops

**`components/icons/`**
- `Icon` — the only icon renderer; masks a vendored Lucide SVG so it inherits `currentColor`. Exports `ICON_NAMES` and `iconBase()`.

**Intentional additions** (not named in the brief, added for coherence): `Button` and `Panel` in the dashboard group — the brief asks for forms, tables and "various elevation levels", which need a shared control and a shared surface, otherwise every consuming screen re-invents them. `StatusPulse` was split out of the motion brief so the dashboard can mark realtime data without importing an animation of a door. `Icon` wraps the vendored Lucide set so consumers never inline raw SVG or reach for a CDN.

## Index

- `styles.css` — the single entry point consumers link. `@import` list only.
- `tokens/` — `fonts.css` (self-hosted `@font-face`), `colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `motion.css`, `animations.css` (named `@keyframes` + reduced-motion), `base.css` (element resets, `.sl-num`, `.sl-mono`, `.sl-kiosk` helpers)
- `assets/` — logo lockups (see table above), `fonts/`, `icons/`
- `components/kiosk/` · `components/dashboard/` · `components/motion/` · `components/icons/` — components, each with `.d.ts`, `.prompt.md`, and one `@dsCard` demo HTML per directory
- `guidelines/` — 20 specimen cards: Colours (6), Type (4), Spacing & elevation (5), Motion (2), Brand (3)
- `thumbnail.html` — homepage tile
- `SKILL.md` — Agent Skills entry point
- **Not built on purpose:** kiosk UI kit and admin dashboard UI kit. The brief asks for foundations first; both products consume this system next.
