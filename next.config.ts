import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // MinIO / S3 uploads. Adjust host/port for your deployment.
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
