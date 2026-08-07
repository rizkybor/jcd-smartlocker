import { Module } from '@nestjs/common';
import { UnitKeyGuard } from '../kiosk/guards/unit-key.guard';
import { GatewayService } from './gateway.service';
import { MqttClientService } from './mqtt-client.service';
import { GatewayController } from './gateway.controller';

@Module({
  controllers: [GatewayController],
  providers: [GatewayService, MqttClientService, UnitKeyGuard],
  exports: [GatewayService, MqttClientService],
})
export class GatewayModule {}
