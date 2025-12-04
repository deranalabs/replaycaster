import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: "https://api.farcaster.xyz/miniapps/hosted-manifest/019aea6d-f47a-0730-bbf0-217b6de71ef8",
        permanent: false,
      },
    ];
  },
  headers: async () => {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
