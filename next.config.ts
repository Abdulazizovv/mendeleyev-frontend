import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Favicon va static fayllarni to'g'ri yuklash
  headers: async () => {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
