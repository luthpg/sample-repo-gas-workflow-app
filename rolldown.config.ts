import { defineConfig } from 'rolldown';
import { removeExportPlugin } from 'rolldown-plugin-remove-export';

export default defineConfig({
  plugins: [removeExportPlugin('server.js')],
  input: 'server/app.ts',
  output: {
    file: 'dist/server.js',
    format: 'esm',
  },
});
