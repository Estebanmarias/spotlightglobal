import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
    turbopack: {
    root: process.cwd(),
  },
};

// Only wrap with the PWA plugin for production. Its webpack-based plugin
// hooks are fundamentally incompatible with Turbopack (which `next dev`
// uses by default in Next.js 16) — having the wrapper present during dev,
// even with `disable: true`, was crashing Turbopack when it tried to
// compile the app/manifest.ts route (/manifest.webmanifest), spiraling
// into repeated out-of-memory process crashes.
const isProd = process.env.NODE_ENV === "production";

const finalConfig = isProd
  ? withPWA({
      dest: "public",
      disable: false,
      register: true,
      workboxOptions: {
        disableDevLogs: true,
      },
    })(nextConfig)
  : nextConfig;

export default finalConfig;