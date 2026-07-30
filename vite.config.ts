import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const collectorTarget = env.VITE_COLLECTOR_URL;

  if (!collectorTarget) {
    throw new Error('VITE_COLLECTOR_URL is required for Vite dev proxy.');
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: collectorTarget,
          changeOrigin: true,
        },
        '/health': {
          target: collectorTarget,
          changeOrigin: true,
        },
        '/tracker.js': {
          target: collectorTarget,
          changeOrigin: true,
        },
      },
    },
  };
});