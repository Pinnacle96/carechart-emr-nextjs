import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("docs/screenshots");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

await page.goto("http://127.0.0.1:3100/appointments");
await page.getByRole("heading", { name: "Appointments" }).waitFor();
await page.screenshot({ path: resolve(output, "appointments.png"), fullPage: true });

await page.goto("http://127.0.0.1:3100/patients?q=Amara");
await page.getByRole("cell", { name: "Amara Dovetail" }).waitFor();
await page.screenshot({ path: resolve(output, "patient-directory.png"), fullPage: true });

await page.getByRole("link", { name: "Open chart" }).click();
await page.getByRole("heading", { name: "Amara Dovetail" }).waitFor();
await page.screenshot({ path: resolve(output, "patient-chart.png"), fullPage: true });

const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/encounters") && response.request().method() === "POST");
await page.getByRole("button", { name: "Start encounter" }).click();
await responsePromise;
await page.getByText("Encounter workspace").waitFor();
await page.getByLabel("Visit reason *").fill("Fictional portfolio consultation");
await page.getByRole("tab", { name: "Vitals" }).click();
await page.getByLabel("Blood pressure").fill("120/80");
await page.getByLabel("Heart rate").fill("72");
await page.getByRole("button", { name: "Save now" }).click();
await page.getByText("All changes saved").waitFor();
await page.screenshot({ path: resolve(output, "encounter-workspace.png"), fullPage: true });

const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mobilePage.goto("http://127.0.0.1:3100/patients?q=Amara");
await mobilePage.getByRole("heading", { name: "Amara Dovetail" }).waitFor();
await mobilePage.screenshot({ path: resolve(output, "patient-directory-mobile.png"), fullPage: true });
await mobilePage.close();

await browser.close();
