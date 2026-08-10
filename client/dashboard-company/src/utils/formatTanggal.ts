import { formatInTimeZone } from 'date-fns-tz';

/**
 * Label timezone singkat untuk ditampilkan di samping waktu (SMB-1004,
 * docs/PRD-Smartbox.md §7.2) — Ops perlu tahu zona waktu tiap baris data
 * saat lokasi tersebar WIB/WITA/WIT, bukan cuma diam-diam pakai timezone
 * browser staff yang mungkin beda dari lokasi unit.
 */
const TIMEZONE_LABEL: Record<string, string> = {
  'Asia/Jakarta': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
};

/** UTC ISO string -> string terformat pada timezone lokasi, dengan label WIB/WITA/WIT. */
export function formatTanggalLokasi(iso: string, timezone: string, formatStr = 'dd MMM yyyy, HH:mm'): string {
  const label = TIMEZONE_LABEL[timezone] ?? timezone;
  return `${formatInTimeZone(new Date(iso), timezone, formatStr)} ${label}`;
}
