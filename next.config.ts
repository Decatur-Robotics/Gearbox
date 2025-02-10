import packageConfig from "./package.json";
import withSerwistInit from "@serwist/next";

console.log(process.env.NEXT_PUBLIC_BUILD_TIME);
const withSerwist = withSerwistInit({
	swSrc: "lib/sw.ts",
	swDest: "public/sw.js",
	additionalPrecacheEntries: [
		{ url: "/offline", revision: process.env.NEXT_PUBLIC_BUILD_TIME },
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
