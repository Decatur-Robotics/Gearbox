import { test, expect } from "@playwright/test";

test("Has title", async ({ page }) => {
	await page.goto("/");

	// Expect a title "to contain" a substring.
	await expect(page).toHaveTitle(/Gearbox/i);
});

test("Has Gearbox header", async ({ page }) => {
	await page.goto("/");

	// Expect an h1 "to contain" a substring.
	await expect(
		page.getByRole("heading", { name: "Gearbox" }).first(),
	).toBeVisible();
});

test("Has get started link", async ({ page }) => {
	await page.goto("/");

	// Click the get started link.
	await expect(page.getByRole("link", { name: "Get started" })).toHaveText(
		"Get Started",
	);
});

test("Has build time", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByText(/Build Time:/i).first()).toBeVisible();

	expect(
		await page
			.getByText(/Build Time:/i)
			.first()
			.textContent()
			.then((text) => {
				const timeString = text!.split(": ")[1];
				const time = new Date(timeString);

				return time.getTime();
			}),
	).toBeGreaterThan(new Date().getTime() - 60 * 15 * 1000);
});

test("Has link to Decatur Robotics website", async ({ page }) => {
	await page.goto("/");

	await expect(
		page.locator("a[href='https://www.decaturrobotics.org/our-team']"),
	).toBeVisible();
});