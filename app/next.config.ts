import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Ignore fs module for client builds and exclude smt-wasm from bundling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Exclude smt-wasm from webpack bundling
      config.externals = config.externals || [];
      config.externals.push({
        "smt-wasm": "smt-wasm",
      });
    }

    return config;
  },
};

export default nextConfig;
