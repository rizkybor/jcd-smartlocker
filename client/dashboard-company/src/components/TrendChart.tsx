import type { OverviewTrenPoin } from '../api/client';

const CHART_HEIGHT = 160;
const BAR_GAP = 4;

function formatTanggalSingkat(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

function formatRupiahSingkat(nominal: number): string {
  if (nominal >= 1_000_000) return `${(nominal / 1_000_000).toFixed(1)}jt`;
  if (nominal >= 1_000) return `${Math.round(nominal / 1_000)}rb`;
  return String(nominal);
}

/**
 * Chart tren transaksi/pendapatan (di luar cakupan PRD awal, monitoring
 * Overview Super Admin) — SVG bar chart hand-rolled, bukan library baru:
 * repo belum punya charting library sama sekali, dan tren 14 titik data
 * ini terlalu sederhana untuk menambah dependency baru + ukuran bundle
 * (`dashboard-company` sudah melewati batas peringatan 500kB chunk).
 */
export function TrendChart({ data }: { data: OverviewTrenPoin[] }) {
  const maxJumlah = Math.max(1, ...data.map((d) => d.jumlahTransaksi));
  const barWidth = data.length > 0 ? `calc((100% - ${(data.length - 1) * BAR_GAP}px) / ${data.length})` : '0';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: BAR_GAP, height: CHART_HEIGHT }}>
        {data.map((d) => {
          const tinggiPersen = (d.jumlahTransaksi / maxJumlah) * 100;
          return (
            <div
              key={d.tanggal}
              title={`${formatTanggalSingkat(d.tanggal)}: ${d.jumlahTransaksi} transaksi, Rp${formatRupiahSingkat(d.pendapatan)}`}
              style={{ width: barWidth, height: '100%', display: 'flex', alignItems: 'flex-end' }}
            >
              <div
                style={{
                  width: '100%',
                  height: d.jumlahTransaksi > 0 ? `${Math.max(tinggiPersen, 2)}%` : 2,
                  background: 'var(--sl-secondary)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height var(--sl-dur-base) var(--sl-ease-standard)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: BAR_GAP, marginTop: 'var(--sl-space-2)' }}>
        {data.map((d, i) => (
          <div
            key={d.tanggal}
            style={{
              width: barWidth,
              fontSize: 'var(--sl-fs-11)',
              color: 'var(--sl-text-faint)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {i % 2 === 0 ? formatTanggalSingkat(d.tanggal) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
