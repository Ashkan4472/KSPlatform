import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  define: {
    __KSPLATFORM_URL__: JSON.stringify(
      process.env.KSPLATFORM_URL ?? "http://localhost:3000",
    ),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
