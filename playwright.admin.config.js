import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/admin',
  testMatch: '*.spec.js',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4176', browserName: 'chromium' },
  webServer: {
    command: 'node tests/admin/fixture-server.mjs',
    url: 'http://127.0.0.1:4176',
  },
});
