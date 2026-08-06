The kiosk's full-screen QR moment — payment via QRIS, or the access code handed back after renting.

```jsx
<QRScreen title="Scan untuk Bayar" subtitle="Gunakan aplikasi e-wallet atau m-banking"
  amount="Rp 15.000" secondsLeft={296}
  footer={<KioskButton tone="neutral">Batalkan</KioskButton>} />
```

- QR sits on pure white inside a 2px bordered card — never on a tint, never over a photo.
- Default 360px, minimum 320px on the 8" reference panel (~76-85mm printed) so a phone reads it from 30cm.
- The countdown pill uses the occupied/yellow family (time pressure), not red (that means fault).
