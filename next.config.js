const withPwa = require("next-pwa")({
  dest: "public",
  cacheOnFrontEndNav: true,
});

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
  }
};

module.exports = withPwa(nextConfig);
