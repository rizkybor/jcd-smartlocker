import { z } from 'zod';
import { AkunInternalRole } from '@prisma/client';

/**
 * docs/API-Contract-Smartbox.md §5.4 — POST /company/users.
 */
export const createUserSchema = z.object({
  nama: z.string().min(1, 'Nama tidak boleh kosong.'),
  email: z.string().email('Format email tidak valid.'),
  role: z.nativeEnum(AkunInternalRole),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
