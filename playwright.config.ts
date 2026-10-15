import { defineConfig, devices } from "@playwright/test";

// Testes da página da proposta no motor do Safari (WebKit), que é o navegador da maioria dos clientes.
// Rodar: pnpm test:safari
const PORT = 3123;

export default defineConfig({
  testDir: "tests",
  timeout: 90_000,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "iPhone Safari", use: { ...devices["iPhone 14"] } },
    { name: "Mac Safari", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/dev/proposta`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test",
      SUPABASE_SECRET_KEY: "test",
    },
  },
});
