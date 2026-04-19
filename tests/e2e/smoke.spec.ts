import { expect, test } from "@playwright/test";

test("navigates through the core pages", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Life Hotfix" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "今日总览" })).toBeVisible();
  await expect(page.getByRole("link", { name: "今日执行" })).toBeVisible();
  await expect(page.getByRole("link", { name: "家庭" })).toBeVisible();

  await page.getByRole("link", { name: "今日执行" }).click();
  await expect(page.getByRole("heading", { name: "今日执行" })).toBeVisible();

  await page.getByRole("link", { name: "家庭" }).click();
  await expect(page.getByRole("heading", { name: "家庭记录" })).toBeVisible();

  await page.getByRole("link", { name: "兑换中心" }).click();
  await expect(page.getByRole("heading", { name: "兑换中心" })).toBeVisible();

  await page.getByRole("link", { name: "账本" }).click();
  await expect(page.getByRole("heading", { name: "积分账本 / 复盘" })).toBeVisible();

  await page.getByRole("link", { name: "规则中心" }).click();
  await expect(page.getByRole("heading", { name: "规则中心" })).toBeVisible();
});

test("serves a web app manifest", async ({ page }) => {
  const response = await page.goto("/manifest.webmanifest");
  expect(response?.ok()).toBeTruthy();
});
