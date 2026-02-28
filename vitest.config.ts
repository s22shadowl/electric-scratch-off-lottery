import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-setup.ts"],
    exclude: ["**/node_modules/**", "**/.claude/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/App.tsx",
        "src/router.tsx",
        "src/vite-env.d.ts",
        "src/types/**",
      ],
      thresholds: {
        "src/utils/**": { lines: 90, functions: 90, branches: 90 },
        "src/stores/**": { lines: 90, functions: 90, branches: 90 },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
