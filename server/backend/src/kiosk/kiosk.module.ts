import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { OtpModule } from '../otp/otp.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UnitKeyGuard } from './guards/unit-key.guard';
import { KioskSewaController } from './kiosk-sewa.controller';
import { KioskSewaService } from './kiosk-sewa.service';
import { KioskAmbilController } from './kiosk-ambil.controller';
import { KioskAmbilService } from './kiosk-ambil.service';

@Module({
  imports: [PaymentModule, OtpModule, GatewayModule],
  controllers: [KioskSewaController, KioskAmbilController],
  providers: [UnitKeyGuard, KioskSewaService, KioskAmbilService],
})
export class KioskModule {}
