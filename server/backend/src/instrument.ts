import * as Sentry from '@sentry/nestjs';

// Harus di-import PALING PERTAMA di main.ts (sebelum import lain apa pun)
// supaya Sentry bisa instrument modul-modul lain saat mereka di-load.
// SENTRY_DSN kosong = SDK otomatis no-op, tidak mengirim apa pun (SMB-901,
// docs/PRD-Smartbox.md §9.4).
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
