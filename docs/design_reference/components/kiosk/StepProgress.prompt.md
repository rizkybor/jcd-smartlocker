Shows where the user is in the kiosk rental flow. Always visible at the top of every kiosk step screen.

```jsx
<StepProgress steps={["Pilih Loker","Durasi","Pembayaran","Kode Akses"]} current={2} />
```

- Max 4 steps on a kiosk. Completed steps turn green with a check; the connector fills left-to-right.
- Labels are 2 words max, Title Case Indonesian. Use `compact` inside the admin dashboard.
