import { Prisma } from '@prisma/client';

/**
 * Model yang punya kolom `deletedAt` (soft delete) — harus sinkron dengan
 * prisma/schema.prisma dan docs/ERD-Smartbox.md "Catatan desain".
 */
const SOFT_DELETE_MODELS = new Set([
  'Lokasi',
  'Mitra',
  'MitraLokasi',
  'Unit',
  'Loker',
  'AkunInternal',
  'AkunMitra',
]);

const READ_ACTIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
]);

/**
 * Prisma Client Extension — pertahanan kedua untuk soft delete (lapisan
 * pertama adalah RLS Postgres, prisma/sql/constraints_and_rls.sql). Lihat
 * docs/PRD-Smartbox.md §6, §7, §9.2 dan docs/ERD-Smartbox.md.
 *
 * Query baca (`findMany`/`findFirst`/`count`) pada 7 model soft-delete
 * otomatis memfilter `deletedAt: null`, kecuali caller eksplisit
 * menyertakan `deletedAt` sendiri di `where` (mis. untuk fitur "lihat data
 * terhapus" di masa depan).
 *
 * Sengaja TIDAK meredirect `.delete()`/`.deleteMany()` jadi update — Prisma
 * Client Extensions tidak punya cara aman meredirect hanya sebagian model
 * tanpa risiko rekursi tak terhingga di komponen `model`. Sebagai gantinya,
 * pakai `PrismaService.softDelete()` secara eksplisit (lihat prisma.service.ts)
 * untuk 7 model ini — didokumentasikan & mudah ditinjau saat code review,
 * bukan mengandalkan override implisit yang gampang salah kaprah.
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete-read-filter',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (model && SOFT_DELETE_MODELS.has(model) && READ_ACTIONS.has(operation)) {
          const typedArgs = args as { where?: Record<string, unknown> };
          const where = typedArgs.where ?? {};
          if (!Object.prototype.hasOwnProperty.call(where, 'deletedAt')) {
            typedArgs.where = { ...where, deletedAt: null };
          }
        }
        return query(args);
      },
    },
  },
});
