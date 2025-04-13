import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const baseURL = process.env.BASE_URL_FOR_PLAYWRIGHT; // Default base URL for tests

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests/e2e",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 5 : 1,
	repeatEach: process.env.CI ? 25 : 1,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 4 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI ? "blob" : "html",

	globalSetup: require.resolve("./lib/testutils/PlaywrightSetup"),

	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		// baseURL: 'http://127.0.0.1:3000',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		video: "retain-on-failure", // Record video only for failed tests
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], baseURL },
		},

		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"], baseURL },
		},

		{
			name: "webkit",
			use: { ...devices["Desktop Safari"], baseURL },
		},

		/* Test against mobile viewports. */
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"], baseURL },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"], baseURL },
		},

		/* Test against branded browsers. */
		{
			name: "Microsoft Edge",
			use: { ...devices["Desktop Edge"], channel: "msedge", baseURL },
		},
		{
			name: "Google Chrome",
			use: { ...devices["Desktop Chrome"], channel: "chrome", baseURL },
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: "npm run e2e-start-server",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 5 * 60 * 1000, // 5 minutes,
		stdout: "pipe",
	},
});
