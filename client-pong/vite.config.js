import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs', // Aponta para o arquivo renomeado
  },
  server: {
    hmr: {
      overlay: false, // Desabilita os erros visuais no navegador
    },
  },
})
