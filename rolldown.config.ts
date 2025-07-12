import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'server/app.ts',
  output: {
    file: 'dist/server.js',
    format: 'esm',
  },
});
