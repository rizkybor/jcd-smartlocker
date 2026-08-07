import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { EnvConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig, true>);

  // CORS ketat, bukan wildcard (docs/PRD-Smartbox.md §7.1) — hanya origin
  // Dashboard Company/Mitra/kiosk yang dikenal (CORS_ORIGIN, comma-separated)
  // yang boleh memanggil API ini.
  const corsOrigin = config.get('CORS_ORIGIN', { infer: true });
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Unit-Key'],
  });

  // Graceful shutdown — server self-hosted (Sumopod) tidak otomatis punya
  // zero-downtime deploy, jadi request yang sedang berjalan perlu selesai
  // sebelum proses mati saat redeploy. Lihat docs/PRD-Smartbox.md §9.5.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
   
  console.log(`@smartbox/backend listening on port ${port}`);
}

bootstrap();
