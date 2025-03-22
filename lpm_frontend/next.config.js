/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8002/api/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:8002/health",
      },
    ];
  },
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002",
  },
};

module.exports = nextConfig;
