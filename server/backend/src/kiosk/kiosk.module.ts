import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { OtpModule } from '../otp/otp.module';
import { GatewayModule } from '../gateway/gateway.module';
import { UnitKeyGuard } from './guards/unit-key.guard';
import { KioskSewaController } from './kiosk-sewa.controller';
import { KioskSewaService } from './kiosk-sewa.service';
import { KioskAmbilController } from './kiosk-ambil.controller';
import { KioskAmbilService } from './kiosk-ambil.service';
import { KioskRfidController } from './kiosk-rfid.controller';
import { KioskRfidService } from './kiosk-rfid.service';

@Module({
  imports: [PaymentModule, OtpModule, GatewayModule],
  controllers: [KioskSewaController, KioskAmbilController, KioskRfidController],
  providers: [UnitKeyGuard, KioskSewaService, KioskAmbilService, KioskRfidService],
})
export class KioskModule {}
