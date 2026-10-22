import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // páginas já visitadas reabrem na hora (as ações de salvar invalidam o cache)
    staleTimes: { dynamic: 30, static: 300 },
    // upload de imagens dos cases (o navegador já reduz antes; a Vercel aceita até 4,5 MB)
    serverActions: { bodySizeLimit: "4mb" },
  },
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
