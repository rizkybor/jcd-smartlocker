import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { LokasiModule } from '../lokasi/lokasi.module';
import { UnitController } from './unit.controller';
import { LokerController } from './loker.controller';
import { UnitService } from './unit.service';

@Module({
  imports: [GatewayModule, LokasiModule],
  controllers: [UnitController, LokerController],
  providers: [UnitService],
  exports: [UnitService],
})
export class UnitModule {}
