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
});
