import { Module } from '@nestjs/common';
import { MitraController } from './mitra.controller';
import { MitraService } from './mitra.service';
import { SkemaHistoriController } from './skema-histori.controller';
import { SkemaHistoriService } from './skema-histori.service';

@Module({
  controllers: [MitraController, SkemaHistoriController],
  providers: [MitraService, SkemaHistoriService],
})
export class MitraModule {}
