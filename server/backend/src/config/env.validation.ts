import { z } from 'zod';

/**
 * Validasi environment variable saat startup — gagal cepat dengan pesan jelas
 * kalau ada yang hilang/salah format, daripada error samar saat transaksi
 * nyata berjalan. Lihat docs/PRD-Smartbox.md §9.5 (Praktik Maintainability).
 *
 * Daftar variabel mengikuti .env.example di root repo.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Supabase — §9.2
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database via Prisma (§9.2, Epic 1 SMB-101) — DATABASE_URL koneksi
  // pooled (pgbouncer, dipakai runtime), DIRECT_URL koneksi langsung
  // (dipakai `prisma migrate`). Belum ada di draft .env.example awal PRD —
  // ditambahkan sebagai kebutuhan teknis Prisma.
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  // Payment provider abstraction — §8, §9.3
  PAYMENT_PROVIDER_ACTIVE: z.enum(['xendit', 'midtrans']),
  XENDIT_SECRET_KEY: z.string().optional(),
  XENDIT_WEBHOOK_TOKEN: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),

  // Channel OTP ambil-barang (§5.2, §8, SMB-207) — default EMAIL (Brevo)
  // sementara WhatsApp BSP belum tersedia (Epic 0 SMB-006).
  OTP_CHANNEL_ACTIVE: z.enum(['email', 'whatsapp']).default('email'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().optional(),
  BREVO_SENDER_NAME: z.string().optional(),

  // WhatsApp Business API / BSP — §8. Optional untuk sekarang (channel
  // belum aktif, lihat OTP_CHANNEL_ACTIVE) — wajib diisi begitu
  // OTP_CHANNEL_ACTIVE=whatsapp.
  WHATSAPP_BSP_API_KEY: z.string().optional(),
  WHATSAPP_BSP_SENDER_NUMBER: z.string().optional(),

  // Cloudinary — §9.1, §9.2
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Redis — §9.2
  REDIS_URL: z.string().min(1),

  // MQTT broker / EMQX — §9.1
  MQTT_BROKER_URL: z.string().min(1),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),

  // Observability — §9.4
  SENTRY_DSN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Environment variable tidak valid, backend tidak dijalankan:\n${issues}\n\nCek .env terhadap .env.example di root repo.`,
    );
  }

  return result.data;
}
