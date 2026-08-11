import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EnvConfig } from '../config/env.validation';
import { getOrCreateSupabaseUser } from './supabase-user.util';

/**
 * Wrapper Supabase Admin client — pakai SERVICE_ROLE_KEY (bypass RLS,
 * kemampuan penuh termasuk `auth.admin.*`). Dipegang backend saja, TIDAK
 * PERNAH dikirim ke frontend mana pun (docs/PRD-Smartbox.md §7.1, §9.2).
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.client = createClient(
      config.get('SUPABASE_URL', { infer: true }),
      config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  /**
   * Verifikasi JWT Supabase Auth yang dikirim client di header
   * `Authorization: Bearer <token>` (docs/API-Contract-Smartbox.md §1.2).
   * Return null kalau token tidak valid/kedaluwarsa — jangan throw di sini,
   * biar guard yang memutuskan response error-nya (§1.3).
   */
  async getUserFromToken(accessToken: string) {
    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }

  /**
   * Provisioning akun baru lewat Supabase Admin API — HANYA dipanggil dari
   * UsersService yang sudah divalidasi caller-nya Super Admin (§5.4, §7,
   * SMB-106). Password sementara di-generate acak; user diarahkan set ulang
   * lewat alur reset password Supabase (di luar cakupan MVP kiosk, dashboard
   * only).
   */
  async createAuthUser(email: string) {
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(
        `Gagal membuat akun Supabase Auth: ${error?.message ?? 'unknown error'}`,
      );
    }
    return data.user;
  }

  /**
   * Provisioning akun DENGAN password eksplisit (bukan invite/reset-link)
   * — dipakai `MitraService.create()` saat Super Admin bikin akun login
   * Mitra sekaligus (§ konfirmasi bisnis, di luar cakupan PRD awal — dulu
   * cuma bisa lewat seed script). Lihat `supabase-user.util.ts` untuk
   * kenapa password harus disertakan sejak `createUser`, bukan belakangan.
   */
  async createAuthUserWithPassword(email: string, password: string) {
    return getOrCreateSupabaseUser(this.client, email, password);
  }

  async deleteAuthUser(supabaseAuthUid: string) {
    const { error } = await this.client.auth.admin.deleteUser(supabaseAuthUid);
    if (error) {
      throw new Error(`Gagal menghapus akun Supabase Auth: ${error.message}`);
    }
  }
}
