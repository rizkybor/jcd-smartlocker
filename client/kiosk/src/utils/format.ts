/** Rupiah, titik ribuan, tanpa desimal — docs/design_reference readme.md "Content fundamentals". */
export function formatRupiah(nominal: number): string {
  return `Rp ${Math.round(nominal).toLocaleString('id-ID')}`;
}
