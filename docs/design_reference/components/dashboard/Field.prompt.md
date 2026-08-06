One component covers input, textarea and select so labels, hints and error states stay identical across every dashboard form.

```jsx
<Field label="Nama Unit" required placeholder="Contoh: Apartemen Green Bay Lobby A" hint="Muncul di dashboard dan struk." />
<Field label="Tipe Properti" options={[{value:"apt",label:"Apartemen"},{value:"mall",label:"Mall"}]} />
<Field label="Tarif per Jam" error="Tarif tidak boleh kosong." />
```

40px tall, subtle inset shadow, focus ring in `--sl-focus-ring` (violet). Errors replace hints — never show both.
