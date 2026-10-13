import { defineConfig, devices } from "@playwright/test";
import { realpathSync } from "node:fs";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "desktop-chrome", use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" } }, { name: "mobile-chrome", use: { ...devices["Pixel 7"], channel: process.env.CI ? undefined : "chrome" } }],
  webServer: { command: "npm run preview", cwd: realpathSync(process.cwd()), url: "http://127.0.0.1:3100/appointments/", reuseExistingServer: false, timeout: 120_000 },
});
