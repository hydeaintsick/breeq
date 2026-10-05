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
  async headers() {
    return [
      {
        // Partner previews are framed by the host and stay out of search.
        source: "/embed/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors",
              "'self'",
              "http://localhost:3333",
              "http://127.0.0.1:3333",
              "http://breeq.local:3333",
              "https://plypto.space",
              "https://www.plypto.space",
              "https://*.plypto.space",
              "https://plypto.com",
              "https://www.plypto.com",
              "https://*.plypto.com",
            ].join(" "),
          },
        ],
      },
      {
        // The partner door carries an email in the query. It only redirects.
        source: "/p/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // The OneSignal worker must not be cached as a page, and must be allowed at /.
        source: "/OneSignalSDKWorker.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
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
