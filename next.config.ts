import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "heistglass.local", "breeq.local"],
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
};

export default nextConfig;
