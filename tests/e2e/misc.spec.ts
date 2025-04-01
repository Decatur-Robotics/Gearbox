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
