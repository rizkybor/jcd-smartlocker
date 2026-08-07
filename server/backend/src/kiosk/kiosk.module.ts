import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { UnitKeyGuard } from './guards/unit-key.guard';
import { KioskSewaController } from './kiosk-sewa.controller';
import { KioskSewaService } from './kiosk-sewa.service';

@Module({
  imports: [PaymentModule],
  controllers: [KioskSewaController],
  providers: [UnitKeyGuard, KioskSewaService],
})
export class KioskModule {}
