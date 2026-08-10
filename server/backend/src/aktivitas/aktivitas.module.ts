import { Module } from '@nestjs/common';
import { AktivitasController } from './aktivitas.controller';
import { AktivitasService } from './aktivitas.service';

@Module({
  controllers: [AktivitasController],
  providers: [AktivitasService],
})
export class AktivitasModule {}
