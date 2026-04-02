import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
