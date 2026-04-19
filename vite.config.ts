import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    fileParallelism: false
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Life Hotfix",
        short_name: "Hotfix",
        description: "Life Hotfix PWA shell",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#f4efe6",
        background_color: "#f4efe6"
      }
    })
  ]
});
