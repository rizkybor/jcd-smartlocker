import { Module } from '@nestjs/common';
import { EmergencyUnlockController } from './emergency-unlock.controller';
import { EmergencyUnlockService } from './emergency-unlock.service';

@Module({
  controllers: [EmergencyUnlockController],
  providers: [EmergencyUnlockService],
})
export class EmergencyUnlockModule {}
