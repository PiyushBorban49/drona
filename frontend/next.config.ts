import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  images: {
    domains: [
      "images.unsplash.com",
      "api.dicebear.com",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "sxswykm5.us-east.insforge.app",
    ],
  },
};

export default nextConfig;
