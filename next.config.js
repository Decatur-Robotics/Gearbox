/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
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
  },
  eslint: {
    dirs: ["pages", "components", "lib", "tests"],
  }
};

module.exports = nextConfig;
