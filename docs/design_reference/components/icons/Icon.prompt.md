The only way to render an icon in this brand — vendored Lucide SVGs (ISC licence, `assets/icons/LICENSE.txt`), masked so they inherit text colour.

```jsx
// once per page, if assets/ is not at the page's root:
window.SL_ICON_BASE = "../../assets/icons";

<Icon name="door-open" size={24} />
<Icon name="wifi-off" size={20} color="var(--sl-status-offline)" label="Unit offline" />
<KioskButton tone="primary" size="xl" icon={<Icon name="lock-open" size={48} />}>Buka Pintu</KioskButton>
```

- Sizes: dashboard 16 inline / 20 sidebar / 24 standalone; **kiosk minimum 48**, 64 inside `xl` buttons.
- Colour: leave it inheriting. Only override with a locked status colour, never a decorative one.
- On kiosk an icon never travels alone — always pair it with a word.
- 65 glyphs are vendored. Need another? Copy it out of the Lucide repo into `assets/icons/` and add the stem to `ICON_NAMES`; never hand-draw one.
