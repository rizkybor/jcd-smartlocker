import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
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
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
