import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from all platforms
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.ggpht.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      { protocol: 'https', hostname: '**.tiktokcdn-us.com' },
      { protocol: 'https', hostname: 'p19-sign.tiktokcdn-us.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.facebook.com' },
      { protocol: 'https', hostname: 'down-vn.img.susercontent.com' },
      { protocol: 'https', hostname: '**.susercontent.com' },
      { protocol: 'https', hostname: '**.tikwm.com' },
    ],
  },

  // Required for @distube/ytdl-core in serverless (Next 16+)
  serverExternalPackages: ['@distube/ytdl-core'],

  turbopack: {},
};

export default nextConfig;
