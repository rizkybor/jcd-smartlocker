import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';

export type DataTableColumn<T> = {
  key?: keyof T & string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  numeric?: boolean;
  wrap?: boolean;
  render?: (row: T) => ReactNode;
};

export type DataTablePaginationMeta = { page: number; pageSize: number; totalItems: number; totalPages: number };

export type DataTablePaginationProps = {
  meta: DataTablePaginationMeta;
  onPageChange: (page: number) => void;
  /** Kata benda jamak untuk teks ringkasan, mis. "unit", "mitra", "transaksi" (§5.6). */
  itemLabel: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T, index: number) => void;
  striped?: boolean;
  density?: 'default' | 'compact';
  /**
   * Kontrol paginasi eksplisit bawaan (SMB-804) — dipakai lewat
   * `pagination={{ meta, onPageChange, itemLabel: 'unit' }}` alih-alih tiap
   * halaman menulis ulang tombol Sebelumnya/Berikutnya + teks
   * "Halaman X dari Y" sendiri-sendiri.
   */
  pagination?: DataTablePaginationProps;
  /** Footer custom penuh — dipakai kalau butuh konten selain paginasi standar. Diabaikan kalau `pagination` diisi. */
  footer?: ReactNode;
  style?: CSSProperties;
};

/** Tabel data dashboard (docs/design_reference/components/dashboard/DataTable.jsx). */
export function DataTable<T>({ columns, rows, onRowClick, striped, density = 'default', pagination, footer, style }: DataTableProps<T>) {
  const resolvedFooter = pagination ? <PaginationFooter {...pagination} /> : footer;

  return (
    <div style={{ width: '100%', overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-fs-14)' }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                style={{
                  textAlign: c.align || 'left',
                  padding: 'var(--sl-space-3) var(--sl-space-5)',
                  background: 'var(--sl-n-50)',
                  borderBottom: 'var(--sl-border-w) solid var(--sl-border)',
                  fontSize: 'var(--sl-fs-12)',
                  fontWeight: 'var(--sl-fw-bold)',
                  letterSpacing: 'var(--sl-ls-caps)',
                  textTransform: 'uppercase',
                  color: 'var(--sl-text-muted)',
                  whiteSpace: 'nowrap',
                  width: c.width,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <DataTableRow key={ri} row={r} rowIndex={ri} columns={columns} onRowClick={onRowClick} striped={striped} density={density} />
          ))}
        </tbody>
      </table>
      {resolvedFooter ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sl-space-4) var(--sl-space-5)', fontSize: 'var(--sl-fs-13)', color: 'var(--sl-text-muted)' }}>
          {resolvedFooter}
        </div>
      ) : null}
    </div>
  );
}

function PaginationFooter({ meta, onPageChange, itemLabel }: DataTablePaginationProps) {
  return (
    <>
      <span>
        Halaman {meta.page} dari {meta.totalPages} — {meta.totalItems} {itemLabel}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button tone="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          Sebelumnya
        </Button>
        <Button tone="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          Berikutnya
        </Button>
      </div>
    </>
  );
}

function DataTableRow<T>({
  row,
  rowIndex,
  columns,
  onRowClick,
  striped,
  density,
}: {
  row: T;
  rowIndex: number;
  columns: DataTableColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
  striped?: boolean;
  density: 'default' | 'compact';
}) {
  const [hover, setHover] = useState(false);
  const stripedBg = striped && rowIndex % 2 ? 'var(--sl-n-25)' : 'transparent';

  return (
    <tr
      onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: onRowClick ? 'pointer' : 'default',
        background: hover ? 'var(--sl-primary-tint)' : stripedBg,
        transition: 'background var(--sl-dur-fast) var(--sl-ease-standard)',
      }}
    >
      {columns.map((c, ci) => (
        <td
          key={ci}
          style={{
            textAlign: c.align || 'left',
            padding: `${density === 'compact' ? 'var(--sl-space-2)' : 'var(--sl-space-4)'} var(--sl-space-5)`,
            borderBottom: 'var(--sl-border-w) solid var(--sl-border)',
            color: ci === 0 ? 'var(--sl-text-strong)' : 'var(--sl-text-body)',
            fontWeight: ci === 0 ? 'var(--sl-fw-semibold)' : 'var(--sl-fw-regular)',
            fontVariantNumeric: c.numeric ? 'tabular-nums' : 'normal',
            fontFamily: c.numeric ? 'var(--sl-font-display)' : 'inherit',
            whiteSpace: c.wrap ? 'normal' : 'nowrap',
          }}
        >
          {c.render ? c.render(row) : c.key ? String(row[c.key] ?? '') : null}
        </td>
      ))}
    </tr>
  );
}
