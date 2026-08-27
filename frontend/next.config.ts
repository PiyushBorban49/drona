import type { NextConfig } from "next";

// Port where uvicorn listens INSIDE the same container (see start.sh).
const BACKEND_INTERNAL_PORT = process.env.BACKEND_INTERNAL_PORT || "8000";
const INTERNAL_BACKEND = `http://127.0.0.1:${BACKEND_INTERNAL_PORT}`;

const nextConfig: NextConfig = {
    reactCompiler: false,

    // ── Same-origin API gateway (used when NEXT_PUBLIC_API_URL is unset) ──
    // Client calls fetch('/api/mindmap') → rewritten here to the private
    // FastAPI port. /videos & /keyframes cover backend static mounts whose
    // generated URLs come back relative in this deployment mode.
    async rewrites() {
        return [
            { source: "/api/:path*", destination: `${INTERNAL_BACKEND}/:path*` },
            { source: "/videos/:path*", destination: `${INTERNAL_BACKEND}/videos/:path*` },
            { source: "/keyframes/:path*", destination: `${INTERNAL_BACKEND}/keyframes/:path*` },
        ];
    },

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
