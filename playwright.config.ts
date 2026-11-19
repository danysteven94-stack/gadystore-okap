import { defineConfig, devices } from "@playwright/test";

// Tès E2E "smoke": paj piblik yo, redireksyon ak headers sekirite.
// Yo pa bezwen yon vrè Redis. Anvan: `npm run build`. Lokalman: `npm run test:e2e`.
const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      JWT_SECRET: process.env.JWT_SECRET ?? "e2e-secret",
      TOTP_ENCRYPTION_KEY: process.env.TOTP_ENCRYPTION_KEY ?? "e2e-totp",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "http://127.0.0.1:9",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "e2e",
    },
  },
});
