import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './locales/id.json';

// Arsitektur multi-bahasa disiapkan sejak MVP meski cuma `id` aktif (SMB-1001,
// docs/PRD-Smartbox.md §7.2) — semua teks UI lewat key `t()`, supaya nambah
// `en.json` dst. di Fase 2 (SMB-1005) murni kerja penerjemahan.
void i18n.use(initReactI18next).init({
  resources: { id: { translation: id } },
  lng: 'id',
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

export default i18n;
