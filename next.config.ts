import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Only enable the service worker in production — Serwist uses webpack
  // which conflicts with Next.js 16's default Turbopack in development.
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Empty turbopack config silences the "webpack config but no turbopack config" error.
  turbopack: {},
};

export default withSerwist(nextConfig);
