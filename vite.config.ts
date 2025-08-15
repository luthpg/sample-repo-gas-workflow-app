/// <reference types="vitest" />

import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { gas } from 'vite-plugin-google-apps-script';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    gas({
      replace: {
        replaceRules: [
          {
            from: /this\.hasProtocol\(\)\?this\.(\S+?):`\$\{e\}:\/\/\$\{this\..+?\}`/,
            to: 'this.$1',
          },
          {
            from: /`http:\/\/\[\$\{(.+?)\}\]`/g,
            to: '"http://["+$1+"]"',
          },
        ],
      },
    }),
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*', 'server/**/*'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**/*',
        'src/components/theme-provider.tsx',
        'src/components/mode-toggle.tsx',
        'types/**/*',
        'server/app.ts',
      ],
    },
  },
});
