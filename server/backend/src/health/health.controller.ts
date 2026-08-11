import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Endpoint kesehatan dasar untuk dicek Sumopod/monitoring.
 * Lihat docs/PRD-Smartbox.md §9.5 (health check & graceful shutdown) —
 * server self-hosted tidak otomatis punya zero-downtime deploy seperti PaaS
 * terkelola, jadi endpoint ini penting untuk load balancer/monitoring.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
