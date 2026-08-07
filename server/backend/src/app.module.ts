import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/response.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { UsersModule } from './users/users.module';
import { LokasiModule } from './lokasi/lokasi.module';
import { MitraModule } from './mitra/mitra.module';
import { EmergencyUnlockModule } from './emergency-unlock/emergency-unlock.module';
import { PurgeModule } from './purge/purge.module';
import { PaymentModule } from './payment/payment.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { OtpModule } from './otp/otp.module';
import { UnitModule } from './unit/unit.module';
import { KioskModule } from './kiosk/kiosk.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    // Rate limiting (§7.1, API-Contract-Smartbox.md §1.6). `default` jadi
    // pagar umum semua endpoint. Named throttler `otp-send`/`otp-verify`
    // dipakai KioskAmbilController (Epic 4, §2) lewat
    // `@Throttle({ 'otp-send': { limit: 3, ttl: 900_000 } })` dst.
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'otp-send', ttl: 900_000, limit: 3 },
      { name: 'otp-verify', ttl: 900_000, limit: 5 },
    ]),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    ActivityLogModule,
    UsersModule,
    LokasiModule,
    MitraModule,
    EmergencyUnlockModule,
    PurgeModule,
    PaymentModule,
    WebhooksModule,
    OtpModule,
    UnitModule,
    KioskModule,
    GatewayModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
