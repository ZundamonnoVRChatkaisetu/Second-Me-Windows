/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8002/api/:path*",
      },
    ];
  },
  // 環境変数の設定
  env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8002",
  },
};

module.exports = nextConfig;
