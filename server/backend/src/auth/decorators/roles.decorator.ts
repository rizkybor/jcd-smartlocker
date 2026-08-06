import { SetMetadata } from '@nestjs/common';
import { AkunInternalRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Batasi endpoint ke role AkunInternal tertentu (§3, §5.4, §7). Dipakai
 * bersama RolesGuard, DIPASANG SETELAH SupabaseAuthGuard di `@UseGuards`
 * supaya `request.user` sudah terisi saat RolesGuard mengecek.
 *
 * Tidak berlaku untuk AkunMitra — endpoint yang dipasangi @Roles() otomatis
 * menolak semua request dari akun mitra (dashboard mitra memang tidak
 * punya endpoint tulis, §5.5).
 */
export const Roles = (...roles: AkunInternalRole[]) => SetMetadata(ROLES_KEY, roles);
