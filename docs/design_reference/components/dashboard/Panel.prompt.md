Every dashboard surface — charts, tables, forms — sits in a Panel. It owns the elevation ladder.

```jsx
<Panel title="Transaksi Hari Ini" description="Realtime" actions={<Button tone="outline" size="sm">Ekspor</Button>} flush>
  <DataTable … />
</Panel>
```

Elevation: 1 = resting card, 2 = hovered/dragged, 3 = dropdown, 4 = modal, 5 = full overlay. Never stack two elevation-1 panels inside each other.
