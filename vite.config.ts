import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      // PNG optimization
      png: {
        quality: 85,
      },
      // JPEG optimization
      jpeg: {
        quality: 85,
      },
      jpg: {
        quality: 85,
      },
      // WebP conversion (80%+ smaller than PNG/JPG)
      webp: {
        quality: 85,
      },
      // SVG optimization
      svg: {
        multipass: true,
        plugins: [
          'preset-default',
          'removeViewBox',
          'sortAttrs',
          {
            name: 'removeAttrs',
            params: {
              attrs: '(fill|stroke)',
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ["lucide-react"],
  },
  server: {
    port: 5174,
  },
});
