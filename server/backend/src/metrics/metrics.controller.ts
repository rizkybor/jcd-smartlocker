import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Endpoint scrape Prometheus (SMB-902, docs/PRD-Smartbox.md §9.4). Pakai
 * @Res() langsung supaya lolos dari ResponseInterceptor global (yang
 * membungkus semua body jadi `{ data: ... }`) — format Prometheus text
 * harus mentah, bukan JSON.
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async scrape(@Res() res: Response) {
    res.setHeader('Content-Type', this.metrics.registry.contentType);
    res.send(await this.metrics.registry.metrics());
  }
}
