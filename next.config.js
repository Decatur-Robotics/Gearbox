const withPwa = require("next-pwa")({
  dest: "public",
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
};

module.exports = withPwa(nextConfig);
