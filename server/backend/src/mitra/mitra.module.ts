import { Module } from '@nestjs/common';
import { LokasiModule } from '../lokasi/lokasi.module';
import { MitraController } from './mitra.controller';
import { MitraService } from './mitra.service';
import { SkemaHistoriController } from './skema-histori.controller';
import { SkemaHistoriService } from './skema-histori.service';

@Module({
  imports: [LokasiModule],
  controllers: [MitraController, SkemaHistoriController],
  providers: [MitraService, SkemaHistoriService],
})
export class MitraModule {}
