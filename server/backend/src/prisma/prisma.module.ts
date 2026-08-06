import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global module — PrismaService tersedia di seluruh app tanpa import
 * berulang per module domain (unit, mitra, dst., Epic 1 lanjutan).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
