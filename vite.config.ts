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
      replaceRules: [
        {
          from: /this\.hasProtocol\(\)\?this\.(\S+?):`\$\{e\}:\/\/\$\{this\.v\}`/,
          to: 'this.$1',
        },
        {
          from: /https:\/\/radix-ui\.com\/primitives\/docs\/components\/\$\{t\.docsSlug\}/g,
          to: '--masked-url--',
        },
      ],
    }),
    viteSingleFile(),
    {
      name: 'remove-urls',
      generateBundle() {},
    },
  ],
  build: {
    outDir: 'dist',
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
});
