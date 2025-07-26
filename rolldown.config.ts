import { defineConfig } from 'rolldown';
import { removeExportPlugin } from 'rolldown-plugin-remove-export';

const outputFileName = 'server.js'; // Htmlファイルと別名にする

export default defineConfig({
  input: 'server/app.ts',
  output: {
    file: `dist/${outputFileName}`,
    format: 'esm',
  },
  plugins: [removeExportPlugin(outputFileName)],
});
