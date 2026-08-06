Fires once when payment clears or a rental completes — the kiosk's only celebratory moment.

```jsx
<SuccessBurst title="Pembayaran Berhasil" detail="Loker A-04 - berlaku sampai 18:30" />
```

- Sequence: two rings out (0-900ms), badge pop with latch overshoot, check draws at 180ms, title 220ms, detail 320ms.
- Green only. No confetti, no sound-implying sparkles — public space, calm brand.
- Total under 1s: the user is standing at the unit and the next screen must arrive quickly.
