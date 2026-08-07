import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Canvas final: 600x1024 portrait, panel 7" IPS 1024x600 dipasang rotasi 90°
// (docs/PRD-Smartbox.md §8.1, §12 poin 8, SMB-801 revisi kedua).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
