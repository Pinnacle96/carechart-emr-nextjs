import { expect, test } from "@playwright/test";

test("browser-local workflow survives refresh, retries a failed save, completes, and resets", async ({ page }) => {
  await page.goto("/patients/");
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
  await page.getByRole("button", { name: "Start encounter" }).click();
  await expect(page.getByText("Encounter workspace")).toBeVisible();

  await page.getByLabel("Visit reason *").fill("Portfolio workflow review");
  await page.getByRole("tab", { name: "Notes" }).click();
  await page.getByLabel("Subjective *").fill("Fictional history for the end-to-end test.");
  await page.getByLabel("Assessment *").fill("Fictional assessment for testing.");
  await page.getByLabel("Plan *").fill("Fictional follow-up plan.");
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.getByRole("button", { name: "Add order" }).click();
  await page.getByRole("button", { name: "Save now" }).click();
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Notes" }).click();
  await expect(page.getByLabel("Subjective *")).toHaveValue("Fictional history for the end-to-end test.");
  await page.getByRole("tab", { name: "Overview" }).click();
  await expect(page.getByLabel("Visit reason *")).toHaveValue("Portfolio workflow review");

  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failNext = true;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("carechart:") && failNext) {
        failNext = false;
        throw new DOMException("Simulated full storage", "QuotaExceededError");
      }
      return original.call(this, key, value);
    };
  });
  await page.getByLabel("Visit reason *").fill("Portfolio workflow review updated");
  await page.getByRole("button", { name: "Save now" }).click();
  await expect(page.getByText(/could not save in this browser tab/i)).toBeVisible();
  await expect(page.getByLabel("Visit reason *")).toHaveValue("Portfolio workflow review updated");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.getByRole("tab", { name: "Review" }).click();
  await expect(page.getByText("1 fictional order will be marked ordered.")).toBeVisible();
  await page.getByRole("button", { name: "Complete encounter" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Complete encounter" }).click();
  await expect(page.getByText("Read-only")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save now" })).toHaveCount(0);

  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByText("Demo data was restored in this tab.")).toBeVisible();
});

test("incomplete encounters cannot be completed", async ({ page }) => {
  await page.goto("/patients/?q=Lena");
  await page.getByRole("link", { name: "Open chart" }).click();
  await page.getByRole("button", { name: "Start encounter" }).click();
  await expect(page.getByText("Encounter workspace")).toBeVisible();
  await page.getByRole("tab", { name: "Review" }).click();
  await expect(page.getByRole("button", { name: "Complete encounter" })).toBeDisabled();
});

test("separate browser contexts never share demo edits or resets", async ({ browser, page }) => {
  await page.goto("/patients/new/");
  await page.getByLabel("First name *").fill("Nova");
  await page.getByLabel("Last name *").fill("Storybook");
  await page.getByLabel("Date of birth *").fill("1991-05-07");
  await page.getByRole("button", { name: "Register fictional patient" }).click();
  await expect(page.getByRole("heading", { name: "Nova Storybook" })).toBeVisible();

  const otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage();
    await other.goto("/patients/?q=Nova");
    await expect(other.getByText("No matching patients")).toBeVisible();
    await other.goto("/patients/new/");
    await other.getByLabel("First name *").fill("Eden");
    await other.getByLabel("Last name *").fill("Whimsy");
    await other.getByLabel("Date of birth *").fill("1992-06-08");
    await other.getByRole("button", { name: "Register fictional patient" }).click();
    await expect(other.getByRole("heading", { name: "Eden Whimsy" })).toBeVisible();

    await page.getByRole("button", { name: "Reset demo data" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).click();
    await expect(page.getByText("Demo data was restored in this tab.")).toBeVisible();
    await other.goto("/patients/?q=Eden");
    await expect(other.getByRole("link", { name: "Open chart" })).toBeVisible();
  } finally {
    await otherContext.close();
  }
});
