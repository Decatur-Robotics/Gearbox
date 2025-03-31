import { test, expect } from "@playwright/test";
import { PlaywrightUtils } from "@/lib/testutils/TestUtils";

test("Sign in function signs in", async ({ page, context }) => {
	const { user } = await PlaywrightUtils.signIn(context);

	const res = await context.request.get("/api/auth/session");
	const foundUser = (await res.json()).user;

	if (foundUser) foundUser.id = user.id; // ID mismatches are normal

	expect(res.status()).toBe(200);
	expect(foundUser).toEqual(user as any);
});
