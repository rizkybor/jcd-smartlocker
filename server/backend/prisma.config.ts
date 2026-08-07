import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from '@prisma/config';

// URL koneksi untuk `prisma migrate`/`db push` (schema engine "classic").
// PrismaClient runtime TIDAK memakai ini — lihat src/prisma/prisma.service.ts
// (driver adapter @prisma/adapter-pg). DIRECT_URL wajib non-pooled (port
// 5432 tanpa pgbouncer) karena DDL migration butuh koneksi session penuh
// (docs/PRD-Smartbox.md §9.2, §14).
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
