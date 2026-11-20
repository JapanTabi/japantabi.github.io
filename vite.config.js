import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const sourceRoot = resolve(projectRoot, 'src');

export default defineConfig({
  // Keep every generated URL relative so the same build works at / and /jp_report/.
  base: './',
  root: sourceRoot,
  publicDir: resolve(projectRoot, 'public'),
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        readdirSync(sourceRoot)
          .filter((name) => name.endsWith('.html'))
          .map((name) => [name.replace(/\.html$/, ''), resolve(sourceRoot, name)]),
      ),
    },
  },
});
