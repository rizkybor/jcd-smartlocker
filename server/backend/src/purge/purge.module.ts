import { Module } from '@nestjs/common';
import { PurgeService } from './purge.service';

/**
 * ScheduleModule.forRoot() didaftarkan sekali di AppModule (bukan di sini)
 * — module ini cukup menyediakan PurgeService yang method-nya dihias
 * `@Cron`.
 */
@Module({
  providers: [PurgeService],
  exports: [PurgeService],
})
export class PurgeModule {}
