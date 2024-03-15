/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "www.mouser.de",
      "www.firstinspires.org",
      "files.slack.com",
    ],
  },
};

module.exports = nextConfig;
