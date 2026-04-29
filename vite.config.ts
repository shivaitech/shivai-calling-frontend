import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Writes dist/version.json after every build.
// The client polls this file to detect new deployments and auto-reloads.
function versionFilePlugin(): Plugin {
  return {
    name: "version-file",
    closeBundle() {
      const version = { buildTime: Date.now() };
      const outDir = path.resolve(__dirname, "dist");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "version.json"), JSON.stringify(version));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), versionFilePlugin()],
  optimizeDeps: {
    include: ["lucide-react"],
  },
  server: {
    port: 5174,
    // Proxy /api/* to a local Vercel dev server for local development.
    // Run `npx vercel dev` in a separate terminal (recommended), or start
    // your own edge function server on port 3000.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    minify: "terser",
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.warn", "console.debug"],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — always needed
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation library — large, only for landing animations
          "vendor-motion": ["framer-motion"],
          // 3D orb — only used in TryVoice & LoadingFallback
          "vendor-orb": ["react-ai-orb"],
          // LiveKit — only used in dashboard / agent calls
          "vendor-livekit": ["livekit-client"],
          // Carousel — only used in WhatShivaiDo
          "vendor-slick": ["react-slick", "slick-carousel"],
          // Auth & form utilities
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
});
