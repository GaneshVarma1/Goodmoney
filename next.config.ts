import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['img.clerk.com'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
