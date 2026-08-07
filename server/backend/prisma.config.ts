import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from '@prisma/config';

// URL koneksi untuk `prisma migrate`/`db push` (schema engine "classic").
// PrismaClient runtime TIDAK memakai ini — lihat src/prisma/prisma.service.ts
// (driver adapter @prisma/adapter-pg). Sengaja pakai DIRECT_URL (non-pooled,
// port 5432) untuk `url` di sini, BUKAN DATABASE_URL — `directUrl` di
// `datasource` classic engine ternyata tidak dipakai untuk koneksi utama
// `migrate deploy` (diverifikasi langsung: masih connect ke port pooled
// 6543 meski directUrl di-set, menyebabkan "prepared statement already
// exists"). DDL migration butuh koneksi session penuh (docs/PRD-Smartbox.md
// §9.2, §14), jadi `url` di sini harus non-pooled.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  engine: 'classic',
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
