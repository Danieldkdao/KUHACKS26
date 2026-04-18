import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/db", "@repo/ai", "@repo/auth"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://travelbot-widget.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
