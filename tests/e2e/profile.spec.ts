import { PlaywrightUtils } from "@/lib/testutils/TestUtils";
import { test, expect } from "@playwright/test";

test("Displays sign in page when not signed in", async ({ page }) => {
	await page.goto("/profile");

	await expect(
		page.getByRole("heading", { name: /sign in/i }).first(),
	).toBeVisible();
});

test("Displays user information when signed in", async ({ page, context }) => {
	const { user } = await PlaywrightUtils.signUp(context);

	await page.goto("/profile");

	await expect(
		page.getByRole("heading", { name: /sign in/i }).first(),
	).not.toBeVisible();

	await expect(page.getByText(user.email!)).toBeVisible();
	await expect(page.getByText(user.slug!)).toBeVisible();
	await expect(page.getByText(new RegExp(user.name!))).toBeVisible();
});
