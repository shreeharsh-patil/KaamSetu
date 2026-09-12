import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "cdn.kaamsetu.com",
      },
    ],
  },
  async rewrites() {
    // Keep browser authentication requests same-origin. The external Render API
    // remains private to this server-side rewrite, so refresh cookies survive
    // browser reloads and Vercel deployments without third-party-cookie rules.
    const apiBaseUrl = (process.env.KAAMSETU_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
