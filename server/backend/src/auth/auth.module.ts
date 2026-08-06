import { Global, Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Registrasi eksplisit SupabaseAuthGuard & RolesGuard sebagai provider —
 * supaya DI (constructor injection SupabaseService/PrismaService/Reflector)
 * pasti resolve dengan benar saat guard dipakai lewat
 * `@UseGuards(SupabaseAuthGuard, RolesGuard)` di controller module lain.
 */
@Global()
@Module({
  providers: [SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
