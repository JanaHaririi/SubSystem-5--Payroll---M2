import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
