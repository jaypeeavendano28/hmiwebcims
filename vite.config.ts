import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'path';
import mkcert from 'vite-plugin-mkcert';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), mkcert()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5900,
    // host: true,
  },
});
