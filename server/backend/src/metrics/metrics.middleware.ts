import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const stopTimer = this.metrics.httpRequestDuration.startTimer();
    res.on('finish', () => {
      // req.route hanya ada kalau route match — fallback ke path mentah
      // (mis. 404) supaya tidak error, meski label jadi kurang rapi.
      const route = req.route?.path ?? req.path;
      stopTimer({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  }
}
