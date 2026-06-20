import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/favicon.ico",
      headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }],
    },
  ],
};

export default nextConfig;
