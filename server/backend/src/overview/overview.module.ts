import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

@Module({
  imports: [GatewayModule],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
