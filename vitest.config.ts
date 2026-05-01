import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/routeTree.gen.ts", "src/main.tsx"],
      reporter: ["text", "html", "lcov"],
    },
    projects: [
      {
        resolve: {
          alias: { "@": resolve(__dirname, "src") },
        },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/domain/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: { "@": resolve(__dirname, "src") },
        },
        plugins: [react()],
        publicDir: "public",
        test: {
          name: "browser",
          include: [
            "src/repositories/**/*.test.ts",
            "src/components/**/*.test.tsx",
            "src/hooks/**/*.test.{ts,tsx}",
          ],
          setupFiles: ["src/test/setup.browser.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            headless: true,
          },
        },
      },
    ],
  },
});
