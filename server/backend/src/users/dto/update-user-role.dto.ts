import { z } from 'zod';
import { AkunInternalRole } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §5.4 — PATCH /company/users/:id/role.
 */
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(AkunInternalRole),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
