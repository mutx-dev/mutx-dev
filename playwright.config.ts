import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT || '3000');
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${port}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  testIgnore: ['tests/unit/**'],
  fullyParallel: !isCI,
  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'list' : [['list'], ['html', { open: 'never' }]],
  expect: {
    timeout: 5000,
  },
  timeout: 30000,
  use: {
    baseURL,
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: isCI ? 'off' : 'only-on-failure',
    video: isCI ? 'off' : 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
  webServer: {
    command: "sh -c 'npm run prepare:standalone && PORT=" + port + " HOSTNAME=127.0.0.1 node .next/standalone/server.js'",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120000,
    stdout: isCI ? 'pipe' : 'ignore',
    stderr: isCI ? 'pipe' : 'ignore',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(isCI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]),
  ],
});
