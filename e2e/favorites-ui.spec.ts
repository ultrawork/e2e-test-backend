import { test, expect } from "@playwright/test";

const APP_URL =
  process.env.APP_URL || process.env.BASE_URL || "http://localhost:4111";

async function addNote(page: any, text: string) {
  await page.getByRole("textbox", { name: "New note" }).fill(text);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

test.describe("Notes Favorites UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/notes`);
    await page.waitForLoadState("networkidle");
  });

  test("SC-010: Toggle favorite star on a note", async ({ page }) => {
    await addNote(page, "Тестовая заметка");

    // Initially unfavorited (☆)
    const favBtn = page.getByRole("button", { name: "Toggle favorite" }).first();
    await expect(favBtn).toContainText("☆");

    // Click → favorited (★)
    await favBtn.click();
    await expect(favBtn).toContainText("★");

    // Click again → unfavorited (☆)
    await favBtn.click();
    await expect(favBtn).toContainText("☆");
  });

  test("SC-011: Favorites filter shows only favorited notes with counter", async ({
    page,
  }) => {
    await addNote(page, "A");
    await addNote(page, "B");
    await addNote(page, "C");

    // Favorite A and C
    const favButtons = page.getByRole("button", { name: "Toggle favorite" });
    // Notes may render in reverse order; find by row
    const rowA = page.getByText("A").locator("..");
    const rowC = page.getByText("C").locator("..");

    await rowA.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowA.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    await rowC.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowC.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    // Enable favorites filter
    await page.getByRole("button", { name: "Только избранные" }).click();

    // Only A and C visible
    await expect(page.getByText("A")).toBeVisible();
    await expect(page.getByText("C")).toBeVisible();
    await expect(page.getByText("B")).not.toBeVisible();

    // Counter
    await expect(page.getByText("Найдено: 2 из 3")).toBeVisible();
  });

  test("SC-012: Disabling favorites filter restores full list", async ({
    page,
  }) => {
    await addNote(page, "Первая");
    await addNote(page, "Вторая");

    // Favorite "Первая"
    const rowFirst = page.getByText("Первая").locator("..");
    await rowFirst.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowFirst.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    // Enable filter
    await page.getByRole("button", { name: "Только избранные" }).click();
    await expect(page.getByText("Первая")).toBeVisible();
    await expect(page.getByText("Вторая")).not.toBeVisible();

    // Disable filter
    await page.getByRole("button", { name: "Только избранные" }).click();
    await expect(page.getByText("Первая")).toBeVisible();
    await expect(page.getByText("Вторая")).toBeVisible();
    await expect(page.getByText("Всего заметок: 2")).toBeVisible();
  });

  test("SC-013: Favorites filter combined with text search", async ({
    page,
  }) => {
    await addNote(page, "Купить молоко");
    await addNote(page, "Купить хлеб");
    await addNote(page, "Позвонить маме");

    // Favorite "Купить молоко" and "Позвонить маме"
    const rowMilk = page.getByText("Купить молоко").locator("..");
    const rowMom = page.getByText("Позвонить маме").locator("..");

    await rowMilk.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowMilk.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    await rowMom.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowMom.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    // Enable favorites filter
    await page.getByRole("button", { name: "Только избранные" }).click();
    await expect(page.getByText("Купить молоко")).toBeVisible();
    await expect(page.getByText("Позвонить маме")).toBeVisible();
    await expect(page.getByText("Купить хлеб")).not.toBeVisible();

    // Type search
    await page.getByPlaceholder("Поиск заметок...").fill("Купить");
    await expect(page.getByText("Купить молоко")).toBeVisible();
    await expect(page.getByText("Позвонить маме")).not.toBeVisible();
    await expect(page.getByText("Купить хлеб")).not.toBeVisible();
    await expect(page.getByText("Найдено: 1 из 3")).toBeVisible();
  });

  test("SC-014: Delete favorited note with active filter", async ({
    page,
  }) => {
    await addNote(page, "Заметка X");
    await addNote(page, "Заметка Y");

    // Favorite both
    const rowX = page.getByText("Заметка X").locator("..");
    const rowY = page.getByText("Заметка Y").locator("..");

    await rowX.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowX.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    await rowY.getByRole("button", { name: "Toggle favorite" }).click();
    await expect(
      rowY.getByRole("button", { name: "Toggle favorite" })
    ).toContainText("★");

    // Enable favorites filter
    await page.getByRole("button", { name: "Только избранные" }).click();
    await expect(page.getByText("Найдено: 2 из 2")).toBeVisible();

    // Delete "Заметка X"
    await page
      .getByRole("button", { name: "Delete note: Заметка X" })
      .click();

    await expect(page.getByText("Заметка X")).not.toBeVisible();
    await expect(page.getByText("Заметка Y")).toBeVisible();
    await expect(page.getByText("Найдено: 1 из 1")).toBeVisible();
  });
});
