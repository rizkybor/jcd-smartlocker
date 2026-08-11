import './instrument';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { EnvConfig } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig, true>);

  // Security headers standar (X-Content-Type-Options, HSTS, dll) — SMB-908,
  // docs/PRD-Smartbox.md §7.1.
  app.use(helmet());

  // CORS ketat, bukan wildcard (docs/PRD-Smartbox.md §7.1) — hanya origin
  // Dashboard Company/Mitra/kiosk yang dikenal (CORS_ORIGIN, comma-separated)
  // yang boleh memanggil API ini.
  const corsOrigin = config.get('CORS_ORIGIN', { infer: true });
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Unit-Key'],
  });

  // Dokumentasi API otomatis (OpenAPI/Swagger) — di luar cakupan PRD awal,
  // permintaan untuk mempermudah export seluruh endpoint ke
  // Postman/Swagger. Body request TIDAK muncul lengkap di sini karena
  // validasi request pakai Zod (`ZodValidationPipe`), bukan class DTO
  // ber-decorator `@nestjs/swagger` — dokumen ini akurat untuk path/method/
  // auth/params, tapi bentuk body request harus dicek di masing-masing
  // `dto/*.dto.ts` (link `docs/API-Contract-Smartbox.md` sebagai referensi
  // lengkap). Diaktifkan di semua environment (bukan cuma dev) supaya bisa
  // langsung di-import dari staging/production kalau perlu — endpoint ini
  // sendiri read-only/tidak sensitif (cuma metadata rute).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smartbox API')
    .setDescription(
      'Dokumentasi otomatis seluruh endpoint backend Smartbox (Dashboard Company, Dashboard Mitra, Kiosk, Gateway, Webhooks). ' +
        'Body request divalidasi Zod (lihat dto/*.dto.ts per modul) — schema body di sini tidak selalu lengkap. ' +
        'Import /api-docs-json ke Postman ("Import" -> paste URL) atau Swagger Editor untuk collection siap pakai.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'supabase-auth')
    .addApiKey({ type: 'apiKey', name: 'X-Unit-Key', in: 'header' }, 'unit-key')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  // Graceful shutdown — server self-hosted (Sumopod) tidak otomatis punya
  // zero-downtime deploy, jadi request yang sedang berjalan perlu selesai
  // sebelum proses mati saat redeploy. Lihat docs/PRD-Smartbox.md §9.5.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
   
  console.log(`@smartbox/backend listening on port ${port}`);
}

bootstrap();
