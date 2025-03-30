import { PlaywrightUtils } from "@/lib/testutils/TestUtils";
import { test, expect } from "@playwright/test";

test("Displays username", async ({ page, context }) => {
	const { user } = await PlaywrightUtils.signIn(context);

	await page.goto("/profile");

	expect(page.getByText(new RegExp(user.name!))).toBeVisible({
		timeout: 30000,
	});
});
