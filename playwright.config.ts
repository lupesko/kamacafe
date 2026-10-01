import { defineConfig, devices } from '@playwright/test';

const repositoryUrl = 'https://github.com/lupesko/kamacafe';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_REPOSITORY_URL: repositoryUrl,
      VITE_CONTRIBUTING_URL: `${repositoryUrl}/blob/main/CONTRIBUTING.md`,
      VITE_SITE_URL: 'https://preview.kamacafe.test',
    },
  },
  projects: [
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop WebKit', use: { ...devices['Desktop Safari'] } },
  ],
});
