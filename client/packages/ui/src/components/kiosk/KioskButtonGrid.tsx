import type { CSSProperties, ReactNode } from 'react';

export type KioskButtonGridProps = {
  children: ReactNode;
  /** Lebar minimum tiap kolom (px) sebelum grid nambah baris baru. */
  minColumnWidth?: number;
  style?: CSSProperties;
};

/**
 * Grid tombol kiosk (Kategori/Loker/Durasi) — CSS Grid dengan kolom `1fr`
 * yang SAMA LEBAR, bukan flexbox `wrap` + `justify-content: center`.
 * Flexbox-wrap membuat baris terakhir "melayang" ke tengah dengan lebar
 * beda-beda tergantung sisa jumlah tombol (ganjil/genap) & panjang teks
 * tiap tombol — hasilnya kolom antar baris tidak sejajar. Grid `1fr`
 * memaksa semua tombol (termasuk baris terakhir yang tidak penuh) tetap
 * rata kiri di kolom grid yang sama persis, presisi terlepas dari jumlah
 * tombolnya ganjil atau genap.
 */
export function KioskButtonGrid({ children, minColumnWidth = 160, style }: KioskButtonGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
        gap: 'var(--sl-touch-gap)',
        alignItems: 'stretch',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
