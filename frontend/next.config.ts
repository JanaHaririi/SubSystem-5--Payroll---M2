import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force turbopack to treat the frontend folder as the workspace root
  // to silence the multi-lockfile warning from the repo root.
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/payroll-config/:path*",
        destination: "/payroll-configuration/:path*",
      },
      {
        source: "/company-settings/:path*",
        destination: "/payroll-configuration/company-settings/:path*",
      },
    ];
  },
};

export default nextConfig;
