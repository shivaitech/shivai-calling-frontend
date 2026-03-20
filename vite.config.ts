import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["lucide-react"],
  },
  server: {
    port: 5174,
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
