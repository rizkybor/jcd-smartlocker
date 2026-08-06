Top-row metric tile on the admin dashboard. Values are Lexend tabular numerals so realtime updates don't jitter.

```jsx
<StatCard label="Pendapatan Hari Ini" value="Rp 4,82jt" delta="12,4%" deltaDirection="up" caption="vs kemarin" />
<StatCard label="Loker Terisi" value="128" unit="/ 180" accent="occupied" />
```

Uppercase 12px label, 30px value, 3px accent rule on top. Use `accent` to tie a tile to a status family; keep at most 4 tiles per row.
