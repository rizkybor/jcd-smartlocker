Primary touch control for the kiosk touchscreen — use for every tappable action on the unit; never use a dashboard `Button` on a kiosk screen.

```jsx
<KioskButton tone="primary" size="xl" fullWidth onClick={next}>Sewa Loker</KioskButton>
<KioskButton tone="neutral" size="lg">Kembali</KioskButton>
```

- Sizes map to touch tokens: `md` 88px, `lg` 112px, `xl` 128px. Keep >=20px gap between two buttons.
- Colored tones carry an 8px solid "lift" (no blur) that compresses on press — the only shadow allowed on kiosk.
- Label in Lexend semibold, 32px minimum (44px on `xl`). Sentence case, verb first: "Sewa Loker", "Buka Pintu".
