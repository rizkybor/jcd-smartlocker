import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { MemberModule } from '../member/member.module';
import { DashboardMitraController } from './dashboard-mitra.controller';
import { DashboardMitraService } from './dashboard-mitra.service';
import { MitraOnlyGuard } from '../auth/guards/mitra-only.guard';

@Module({
  imports: [GatewayModule, MemberModule],
  controllers: [DashboardMitraController],
  providers: [DashboardMitraService, MitraOnlyGuard],
})
export class DashboardMitraModule {}
