Tabular data in the dashboard — transaction logs, unit lists, compartment states. Put it in a `flush` Panel.

```jsx
<DataTable striped columns={[
  {key:"id",header:"ID Transaksi"},
  {key:"unit",header:"Unit"},
  {key:"amount",header:"Nominal",numeric:true,align:"right"},
  {key:"status",header:"Status",render:r=><StatusBadge status={r.status} />}
]} rows={rows} footer={<span>Menampilkan 3 dari 248</span>} />
```

First column is semibold (it is the row identity). Money and counts must set `numeric` so columns align. Row hover tints to `--sl-primary-tint`.
