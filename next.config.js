const withPwa = require("next-pwa")({
  dest: "public",
  cacheOnFrontEndNav: true,
});

const { getGitBranchName } = require("./transpiled/JsUtils");

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
  env: {
    NEXT_PUBLIC_BUILD_TIME: Date.now().toString(),
    GIT_BRANCH: getGitBranchName(),
  }
};

module.exports = withPwa(nextConfig);
