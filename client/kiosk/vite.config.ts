import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Canvas final: 1024x600 landscape (docs/PRD-Smartbox.md §8.1, §12 poin 8, SMB-801).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
