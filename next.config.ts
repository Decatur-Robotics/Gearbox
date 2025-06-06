import packageConfig from "./package.json";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
	swSrc: "lib/client/sw.ts",
	swDest: "public/sw.js",
	cacheOnNavigation: true,
	additionalPrecacheEntries: [
		{ url: "/offline", revision: new Date().toDateString() },
	],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		domains: [
			"lh3.googleusercontent.com",
			"www.mouser.de",
			"www.firstinspires.org",
			"files.slack.com",
		],
	},
	publicRuntimeConfig: {
		buildTime: Date.now(),
	},
	env: {
		NEXT_PUBLIC_BUILD_TIME: Date.now().toString(),
		NEXT_PUBLIC_GEARBOX_VERSION: packageConfig.version,
	},
	eslint: {
		dirs: ["pages", "components", "lib", "tests"],
	},
};

module.exports = withSerwist(nextConfig);
