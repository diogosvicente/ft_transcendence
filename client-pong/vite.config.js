import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs', // Aponta para o arquivo renomeado
  },
  server: {
    host: '0.0.0.0', // Permite acesso externo (útil em containers)
    port: 3000,
    hmr: {
      overlay: false, // Desabilita os erros visuais no navegador
    },
  },
})



// --------- USE O CÓDIGO ABAIXO PARA REDE LOCAL -------------
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   css: {
//     postcss: './postcss.config.cjs',
//   },
//   server: {
//     host: '0.0.0.0', // Permite conexões de qualquer IP
//     port: 5173,
//     hmr: {
//       host: '192.168.1.138', // IP da máquina principal
//       port: 5173,
//     },
//   },
// });
