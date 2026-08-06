One compartment in the kiosk's pick-a-locker grid — carries status colour, size class and price.

```jsx
<CompartmentCard id="A-04" state="available" size="m" meta="Rp 15.000 / 3 jam" onClick={pick} />
<CompartmentCard id="A-05" state="occupied" size="m" />
<CompartmentCard id="B-01" selected size="l" meta="Rp 25.000 / 3 jam" />
```

- Status never relies on colour alone: an 8px left bar, a dot, and the Indonesian word all carry it.
- Only `available` tiles are tappable. `offline` is inert and must stay visible — never hide a broken locker.
- Selected flips to solid navy with the orange spark bar; that is the one place `--sl-spark` appears.
