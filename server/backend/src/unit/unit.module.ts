import { Module } from '@nestjs/common';
import { UnitController } from './unit.controller';
import { LokerController } from './loker.controller';
import { UnitService } from './unit.service';

@Module({
  controllers: [UnitController, LokerController],
  providers: [UnitService],
  exports: [UnitService],
})
export class UnitModule {}
