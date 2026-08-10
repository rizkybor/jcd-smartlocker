import { randomBytes } from 'node:crypto';

/** ID transaksi ringkas & unik-secara-praktis, dipakai untuk SesiTransaksi & SesiDenda. */
export function generateIdTransaksi(): string {
  return `SB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}
