import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "heistglass.local",
    "breeq.local",
    "ngrok-free.app",
    "breeq.space",
    "breeq-mu.vercel.app",
  ],
  devIndicators: {
    position: "bottom-left",
  },
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      // Apex → www, done here rather than at the domain level so `/.well-known/*`
      // (Android App Links) is served directly: Google refuses redirected statements.
      {
        source: "/:path((?!\\.well-known/).*)",
        has: [{ type: "host", value: "breeq.space" }],
        destination: "https://www.breeq.space/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
