import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['site.spec.js', 'i18n-complete.spec.js'],
  fullyParallel: true,
  workers: 2,
  use: { browserName: 'chromium' },
  projects: [
    { name: 'root', use: { baseURL: 'http://127.0.0.1:4173/' } },
    { name: 'github-pages', use: { baseURL: 'http://127.0.0.1:4174/jp_report/' } },
  ],
  webServer: [
    {
      command: 'node tests/serve-site.mjs --port 4173 --base /',
      url: 'http://127.0.0.1:4173/',
    },
    {
      command: 'node tests/serve-site.mjs --port 4174 --base /jp_report/',
      url: 'http://127.0.0.1:4174/jp_report/',
    },
  ],
});
