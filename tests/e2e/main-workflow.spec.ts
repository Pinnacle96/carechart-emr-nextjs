import { expect, test } from "@playwright/test";

test("search, edit, recover a failed save, complete, and reset", async ({ page }) => {
  await page.goto("/patients");
  await page.getByLabel("Search patients").fill("Amara");
  await page.getByRole("button", { name: "Apply" }).click();
  const viewportWidth = page.viewportSize()?.width ?? 0;
  if (viewportWidth < 600) {
    await expect(page.getByRole("heading", { name: "Amara Dovetail" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewportWidth);
  } else {
    await expect(page.getByRole("cell", { name: "Amara Dovetail" })).toBeVisible();
  }
  await page.getByRole("link", { name: "Open chart" }).click();
  await expect(page.getByRole("heading", { name: "Amara Dovetail" })).toBeVisible();
  const encounterResponse = page.waitForResponse((response) => response.url().endsWith("/api/encounters") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Start encounter" }).click();
  expect((await encounterResponse).status()).toBe(201);
  await expect(page.getByText("Encounter workspace")).toBeVisible({ timeout: 30_000 });

  await page.getByLabel("Visit reason *").fill("Portfolio workflow review");
  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByLabel("Subjective *").fill("Fictional history for the end-to-end test.");
  await page.getByLabel("Assessment *").fill("Fictional assessment for testing.");
  await page.getByLabel("Plan *").fill("Fictional follow-up plan.");
  await page.getByRole("button", { name: "Save now" }).click();
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await page.getByRole("tab", { name: "Notes" }).click();
  await expect(page.getByLabel("Subjective *")).toHaveValue("Fictional history for the end-to-end test.");
  await page.getByRole("tab", { name: "Overview" }).click();
  await expect(page.getByLabel("Visit reason *")).toHaveValue("Portfolio workflow review");

  let aborted = false;
  await page.route(/\/api\/encounters\/[^/]+$/, async (route) => { if (!aborted && route.request().method() === "PUT") { aborted = true; await route.abort(); } else await route.continue(); });
  await page.getByLabel("Visit reason *").fill("Portfolio workflow review updated");
  await page.getByRole("button", { name: "Save now" }).click();
  await expect(page.getByText(/Save failed/)).toBeVisible();
  await page.unroute(/\/api\/encounters\/[^/]+$/);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.getByRole("tab", { name: "Review" }).click();
  await page.getByRole("button", { name: "Complete encounter" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Complete encounter" }).click();
  await expect(page.getByText("Read-only")).toBeVisible();

  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByText("Demo data was restored.")).toBeVisible();
});


test("an incomplete encounter stays open and the server rejects completion", async ({ page }) => {
  await page.goto("/patients?q=Lena");
  await page.getByRole("link", { name: "Open chart" }).click();
  await page.getByRole("button", { name: "Start encounter" }).click();
  await expect(page.getByText("Encounter workspace")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("tab", { name: "Review" }).click();
  await expect(page.getByRole("button", { name: "Complete encounter" })).toBeDisabled();
  const encounterId = new URL(page.url()).pathname.split("/").at(-1);
  const patientId = new URL(page.url()).pathname.split("/")[2];
  const response = await page.request.post(`/api/encounters/${encounterId}/complete`, { data: { patientId, revision: 0 } });
  expect(response.status()).toBe(422);
  expect((await response.json()).error.code).toBe("COMPLETION_REQUIREMENTS");
});
