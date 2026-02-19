import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    envDir: process.cwd(),
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/health': 'http://localhost:3000'
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), svgr(), vanillaExtractPlugin()]
  }
});
