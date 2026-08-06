The physical confirmation moment: the on-screen door swings open at the same instant the real latch releases.

```jsx
const [open,setOpen] = React.useState(false);
<DoorTransition open={open} id="A-04" label={open?"Pintu terbuka - silakan ambil barang":"Membuka pintu..."} />
```

- 700ms, `--sl-ease-door` (slight overshoot = a latch springing). Never loop it; it fires once per unlock.
- The cavity label turns green only after the door has cleared, so green always means "you may reach in".
- If the hardware reports failure, do not reverse the animation — swap to a red maintenance state and show a support code.
