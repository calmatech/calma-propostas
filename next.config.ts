import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // os HTMLs dos modelos são lidos em runtime
  outputFileTracingIncludes: {
    "/p/[slug]": ["./templates/**/*.html"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
