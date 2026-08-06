On-screen numpad for kiosk PIN codes and phone numbers — the kiosk has no physical keyboard, so all numeric entry uses this.

```jsx
const [pin,setPin] = React.useState("");
<Numpad value={pin} onChange={setPin} length={6} mask label="Masukkan PIN loker Anda" />
```

- Keys are 112px tall `KioskButton`s in `secondary`; HAPUS / backspace are `neutral` so destructive keys read as chrome.
- Echo cells are 64x88; the next empty cell carries the focus ring. Use `mask` for PINs, unmasked for phone numbers.
