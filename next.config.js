/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "/personal-webview",
  i18n: {
    locales: ["id", "en"],
    defaultLocale: "id",
    localeDetection: false,
  },
};

module.exports = nextConfig;
