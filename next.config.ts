import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: supabaseUrl
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/content-images/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
