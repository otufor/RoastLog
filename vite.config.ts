import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/RoastLog/",
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    checker({ typescript: true, biome: true }),
    VitePWA({
      registerType: "autoUpdate",
      scope: "/RoastLog/",
      base: "/RoastLog/",
      strategies: "generateSW",
      workbox: {
        navigateFallback: "/RoastLog/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        globIgnores: ["mockServiceWorker.js"],
        runtimeCaching: [],
      },
      manifest: {
        name: "RoastLog",
        short_name: "RoastLog",
        description: "コーヒー焙煎ログ管理アプリ",
        theme_color: "#B06B1E",
        background_color: "#1c1714",
        display: "standalone",
        orientation: "portrait",
        scope: "/RoastLog/",
        start_url: "/RoastLog/",
        icons: [
          {
            src: "/RoastLog/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/RoastLog/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
