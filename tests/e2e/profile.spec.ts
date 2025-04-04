import Card from "@/components/Card";
import { PlaywrightUtils } from "@/lib/testutils/TestUtils";
import { test, expect } from "@playwright/test";

const poSans =
	'"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSZk-p-TpJAKV0GsfBa3EJPWWjQPxcVTB5Rg&s"';
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

	test("Cancel button closes popup", async ({ page }) => {
		await PlaywrightUtils.signUp(page);

		await page.goto("/profile");

		//Edit Avatar button
		await page.getByRole("button", { name: "Edit Avatar" }).click();

		//Cancel button
		await page.getByRole("button", { name: "Cancel" }).click();

		//Edit Avatar popup
		await expect(page.getByTitle("Edit Avatar")).not.toBeVisible();
	});

	test("Preview Image recognizes image in field", async ({ page }) => {
		await PlaywrightUtils.signUp(page);

		await page.goto("/profile");

		//Edit Avatar button
		await page.getByRole("button", { name: "Edit Avatar" }).click();

		//Enter avatar url input
		await page.getByPlaceholder("Enter new avatar url").fill(poSans);

		//Avatar preview
		await expect(page.getByAltText("New Avatar")).toHaveAttribute(
			"src",
			poSans,
		);
	});

	test("Save button saves new avatar", async ({ page }) => {
		await PlaywrightUtils.signUp(page);

		await page.goto("/profile");

		//Edit Avatar button
		await page.getByRole("button", { name: "Edit Avatar" }).click();

		//Enter avatar url input
		await page.getByPlaceholder("Enter new avatar url").fill(poSans);

		//Save button
		await page.getByRole("button", { name: "Save" }).click();

		//Url of user's avatar
		await expect(page.getByAltText("Avatar").first()).toHaveAttribute(
			"src",
			poSans,
		);
	});

	test("Cancel button does not save new avatar", async ({ page }) => {
		const currentAvatar = (await PlaywrightUtils.signUp(page)).user.image;

		await page.goto("/profile");

		//Edit Avatar button
		await page.getByRole("button", { name: "Edit Avatar" }).click();

		//Enter avatar url input
		await page.getByPlaceholder("Enter new avatar url").fill(poSans);

		//Cancel button
		await page.getByRole("button", { name: "Cancel" }).click();

		await expect(page.getByAltText("Avatar").first()).toHaveAttribute(
			"src",
			currentAvatar,
		);
	});
});
