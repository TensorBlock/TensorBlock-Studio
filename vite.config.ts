import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './',
  build: {
    outDir: 'app/dist',
    copyPublicDir: true,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  publicDir: 'src/public'
})
