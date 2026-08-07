import { z } from 'zod';
import { LokerStatus } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §4.2 — POST /gateway/:kodeUnit/status-loker
 * (fallback HTTP, dipakai saat broker MQTT down).
 */
export const statusLokerSchema = z.object({
  nomorLoker: z.string().min(1),
  status: z.nativeEnum(LokerStatus),
});

export type StatusLokerDto = z.infer<typeof statusLokerSchema>;
