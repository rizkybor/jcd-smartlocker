import { z } from 'zod';
import { LokerStatus } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §5.1 — PATCH /company/lokers/:id/status.
 * Override manual (mis. tandai `maintenance`) — 5 nilai resmi terkunci
 * (§12 poin 9), enum Postgres menolak nilai lain di level database juga.
 */
export const lokerStatusSchema = z.object({
  status: z.nativeEnum(LokerStatus),
});

export type LokerStatusDto = z.infer<typeof lokerStatusSchema>;
