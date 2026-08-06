import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { EnvConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig, true>);

  // Graceful shutdown — server self-hosted (Sumopod) tidak otomatis punya
  // zero-downtime deploy, jadi request yang sedang berjalan perlu selesai
  // sebelum proses mati saat redeploy. Lihat docs/PRD-Smartbox.md §9.5.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
   
  console.log(`@smartbox/backend listening on port ${port}`);
}

bootstrap();
