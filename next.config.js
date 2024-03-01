/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "www.mouser.de",
      "www.firstinspires.org",
    ],
  },
};

module.exports = nextConfig;
