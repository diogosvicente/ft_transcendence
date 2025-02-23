import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      host: '192.168.1.138', // IP da máquina principal
    },
  },
});
