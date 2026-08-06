import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Konversi UTC <-> timezone Lokasi (docs/PRD-Smartbox.md §7.2). Semua
 * timestamp DISIMPAN UTC di database (Postgres `timestamptz`) — utility ini
 * dipakai saat MENAMPILKAN waktu ke pengguna (struk kiosk, laporan
 * dashboard), bukan untuk menyimpan.
 *
 * `timezone` selalu berasal dari `Lokasi.timezone` (IANA name, mis.
 * "Asia/Jakarta"/"Asia/Makassar"/"Asia/Jayapura") — JANGAN hardcode
 * "Asia/Jakarta" sebagai default di pemanggil (§7.2).
 */

/** UTC Date -> string terformat pada timezone lokasi. */
export function formatUtcInLokasiTimezone(
  utcDate: Date,
  timezone: string,
  formatStr = 'dd MMMM yyyy, HH:mm',
): string {
  return formatInTimeZone(utcDate, timezone, formatStr);
}

/** UTC Date -> Date "terlihat" sebagai waktu lokal di timezone lokasi. */
export function utcToLokasiZonedTime(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/** Waktu lokal (mis. dari form input Dashboard Company) -> UTC Date untuk disimpan. */
export function lokasiZonedTimeToUtc(localDate: Date, timezone: string): Date {
  return fromZonedTime(localDate, timezone);
}
