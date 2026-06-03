import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  serverExternalPackages: ["mongodb"],
  images: {
    domains: ["images.unsplash.com", "api.dicebear.com", "img.clerk.com"],
  },
};

export default nextConfig;
