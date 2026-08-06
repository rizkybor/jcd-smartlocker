The dashboard's fixed left rail — deep navy, 264px expanded / 76px collapsed.

```jsx
<Sidebar logoSrc="assets/logo-mono-light.png" activeId="units" onSelect={setView}
  items={[
    {id:"overview",label:"Ringkasan",icon:<Icon name="chart-column" />},
    {section:"Operasional"},
    {id:"units",label:"Unit Loker",icon:<Icon name="grid-2x2" />},
    {id:"alerts",label:"Peringatan",icon:<Icon name="triangle-alert" />,badge:"3"}
  ]}
  footer="v2.4 \u00b7 PT Jendela Cakra Digital" />
```

Active item is a solid `--sl-secondary` block; hover is a 8% white wash. Only the logo's light monochrome variant may be used here.
