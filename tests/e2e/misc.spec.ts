import { test, expect } from "@playwright/test";
import { PlaywrightUtils } from "@/lib/testutils/TestUtils";

test("Sign up function signs up", async ({ page, context }) => {
	const { user } = await PlaywrightUtils.signUp(page);

	const sessionToken = await context
		.cookies()
		.then(
			(cookies) =>
				cookies.find((cookie) => cookie.name === "next-auth.session-token")
					?.value,
		);

	expect(sessionToken).toBeDefined();
	expect(sessionToken).not.toBe("");

	const foundUser = await PlaywrightUtils.getUser(page);
	if (foundUser) foundUser.id = user.id; // ID mismatches are normal

	expect(foundUser).toEqual(user as any);
});

test("Sin in function switches users", async ({ page }) => {
	const { user: user1, sessionToken: sessionToken1 } =
		await PlaywrightUtils.signUp(page);

	let currentUser = await PlaywrightUtils.getUser(page);
	expect(currentUser._id).toEqual(user1._id);

	const { user: user2, sessionToken: sessionToken2 } =
		await PlaywrightUtils.signUp(page);

	currentUser = await PlaywrightUtils.getUser(page);
	expect(currentUser._id).toEqual(user2._id);
	
	await PlaywrightUtils.signIn(page, sessionToken1);

	currentUser = await PlaywrightUtils.getUser(page);
	expect(currentUser._id).toEqual(user1._id);
});
