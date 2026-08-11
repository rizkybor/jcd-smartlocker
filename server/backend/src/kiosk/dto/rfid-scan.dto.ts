import { z } from 'zod';

/**
 * docs/PRD-Smartbox.md — fitur member RFID (di luar cakupan PRD awal).
 * Kiosk kirim `kode` mentah yang dibaca listener keyboard-wedge (§ desain
 * kiosk/src/hooks/useRfidListener.ts) — bukan input manual pelanggan.
 */
export const rfidScanSchema = z.object({
  kode: z.string().min(1, 'Kode RFID wajib diisi.'),
});

export type RfidScanDto = z.infer<typeof rfidScanSchema>;
