/**
 * Bootstrap akun Super Admin PERTAMA — di luar jalur API `POST
 * /company/users` yang sengaja hanya bisa dipanggil oleh Super Admin yang
 * sudah ada (docs/PRD-Smartbox.md §5.4, §7). Skrip ini satu-satunya cara
 * resmi membuat Super Admin pertama; setelah itu, Super Admin tersebut yang
 * membuat akun Manager/Ops/Staff lain lewat dashboard (bukan lewat skrip
 * ini lagi).
 *
 * Saat ini akun company baru ada Super Admin — belum ada Manager/Ops/Staff,
 * jadi endpoint approve/reject persentase (§10, Manager-only) memang belum
 * bisa dites sampai Super Admin ini membuat akun Manager lewat dashboard.
 *
 * Pakai: pnpm run seed:super-admin -- --email=you@example.com --nama="Nama Anda"
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, AkunInternalRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) =>
    args.find((a) => a.startsWith(`--${flag}=`))?.split('=')[1];

  const email = get('email') ?? process.env.SEED_SUPER_ADMIN_EMAIL;
  const nama = get('nama') ?? process.env.SEED_SUPER_ADMIN_NAMA;

  if (!email || !nama) {
    console.error(
      'Wajib isi --email dan --nama, atau set SEED_SUPER_ADMIN_EMAIL/SEED_SUPER_ADMIN_NAMA di .env.\n' +
        'Contoh: pnpm run seed:super-admin -- --email=you@example.com --nama="Nama Anda"',
    );
    process.exit(1);
  }

  return { email, nama };
}

async function main() {
  const { email, nama } = parseArgs();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set di .env.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.akunInternal.findFirst({ where: { email } });
    if (existing) {
      console.log(`Akun internal dengan email ${email} sudah ada (role: ${existing.role}). Tidak membuat ulang.`);
      return;
    }

    console.log(`Membuat akun Supabase Auth untuk ${email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Gagal membuat akun Supabase Auth: ${error?.message ?? 'unknown error'}`);
    }

    const akun = await prisma.akunInternal.create({
      data: {
        supabaseAuthUid: data.user.id,
        nama,
        email,
        role: AkunInternalRole.SUPER_ADMIN,
      },
    });

    console.log('Super Admin pertama berhasil dibuat:');
    console.log(`  id: ${akun.id}`);
    console.log(`  email: ${akun.email}`);
    console.log('\nUser belum punya password — kirim link "reset password" lewat Supabase Auth');
    console.log('(Dashboard Supabase -> Authentication -> Users -> pilih user -> Send password recovery),');
    console.log('atau pakai flow magic link / OTP email di Dashboard Company nanti.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
