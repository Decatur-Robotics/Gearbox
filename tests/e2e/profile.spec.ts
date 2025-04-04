import Card from "@/components/Card";
import { PlaywrightUtils } from "@/lib/testutils/TestUtils";
import { test, expect } from "@playwright/test";

test("Displays sign in page when not signed in", async ({ page }) => {
	await page.goto("/profile");

	await expect(
		page.getByRole("heading", { name: /sign in/i }).first(),
	).toBeVisible();
});

test("Displays user information when signed in", async ({ page }) => {
	const { user } = await PlaywrightUtils.signUp(page);

	await page.goto("/profile");

	await expect(
		page.getByRole("heading", { name: /sign in/i }).first(),
	).not.toBeVisible();

	await expect(page.getByText(user.email!)).toBeVisible();
	await expect(page.getByText(user.slug!)).toBeVisible();
	await expect(page.getByText(new RegExp(user.name!))).toBeVisible();
});

test.describe("Edit user name", () => {
	test("Allows user to edit their name", async ({ page }) => {
		await PlaywrightUtils.signUp(page);

		await page.goto("/profile");

		const editButton = page.getByTestId("edit-name-button");
		await editButton.click();

		const nameInput = page.getByPlaceholder(/new name/i);
		await expect(nameInput).toBeVisible();

		await nameInput.fill("New Name");
		await editButton.click();

		await expect(page.getByText("New Name")).toBeVisible();
	});
});

test.describe("Edit Avatar", () => {
	test("Edit Avatar button displays popup", async ({ page }) => {
		await PlaywrightUtils.signUp(page);

		await page.goto("/profile");

		const editAvatarButton = page.getByRole("button", { name: "Edit Avatar" });
		await editAvatarButton.click();

		const editAvatarPopup = page.getByTitle("Edit Avatar");
		await expect(editAvatarPopup).toBeVisible();
	});
});
