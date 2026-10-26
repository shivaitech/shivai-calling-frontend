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

// Link-preview crawlers (WhatsApp…) don't run JS, and /digital-card/ isn't a file, so the
// host answers it with HTTP 404 + the homepage's tags. This writes a real
// dist/digital-card/index.html — the same app shell — with the card page's own tags.
function digitalCardSharePagePlugin(): Plugin {
  const site = "https://www.callshivai.com";
  const title = "Create your free digital business card | ShivAI";
  const description =
    "A business card that talks back: QR code, one-tap call, WhatsApp, socials and your own AI agent on one link. Create your card now, free.";
  const image = `${site}/og-digital-card.jpg`;
  const tags = [
    `<meta data-static-og name="description" content="${description}" />`,
    `<meta data-static-og property="og:type" content="website" />`,
    `<meta data-static-og property="og:site_name" content="ShivAI" />`,
    `<meta data-static-og property="og:url" content="${site}/digital-card/" />`,
    `<meta data-static-og property="og:title" content="${title}" />`,
    `<meta data-static-og property="og:description" content="${description}" />`,
    `<meta data-static-og property="og:image" content="${image}" />`,
    `<meta data-static-og property="og:image:secure_url" content="${image}" />`,
    `<meta data-static-og property="og:image:type" content="image/jpeg" />`,
    `<meta data-static-og property="og:image:width" content="1200" />`,
    `<meta data-static-og property="og:image:height" content="630" />`,
    `<meta data-static-og property="og:image:alt" content="A ShivAI digital business card on a phone, with its QR code" />`,
    `<meta data-static-og name="twitter:card" content="summary_large_image" />`,
    `<meta data-static-og name="twitter:title" content="${title}" />`,
    `<meta data-static-og name="twitter:description" content="${description}" />`,
    `<meta data-static-og name="twitter:image" content="${image}" />`,
  ].map((t) => `    ${t}`).join("\n");

  return {
    name: "digital-card-share-page",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const src = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      const ogBlock = /(?:[ \t]*<meta data-static-og[^>]*\/>\r?\n?)+/;
      const titleTag = /<title>[\s\S]*?<\/title>/;
      // Fail the build rather than silently ship the homepage's tags if index.html changes shape.
      if (!ogBlock.test(src) || !titleTag.test(src)) throw new Error("digital-card-share-page: index.html tags not found");
      const html = src.replace(ogBlock, `${tags}\n`).replace(titleTag, `<title>${title}</title>`);
      fs.mkdirSync(path.join(outDir, "digital-card"), { recursive: true });
      fs.writeFileSync(path.join(outDir, "digital-card", "index.html"), html);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), versionFilePlugin(), digitalCardSharePagePlugin()],
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
