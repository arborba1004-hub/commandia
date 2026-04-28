// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudProviderFetchAdapter from "@wix/cloud-provider-fetch-adapter";
import monitoring from "@wix/monitoring-astro";
import react from "@astrojs/react";
import sourceAttrsPlugin from "@wix/babel-plugin-jsx-source-attrs";
import dynamicDataPlugin from "@wix/babel-plugin-jsx-dynamic-data";
import customErrorOverlayPlugin from "./vite-error-overlay-plugin.js";
import postcssPseudoToData from "@wix/postcss-pseudo-to-data";

const isBuild = process.env.NODE_ENV == "production";

// NOTA: A integração wix() foi removida intencionalmente.
// Ela exigia variáveis de ambiente (WIX_CLIENT_INSTANCE_ID, WIX_CLIENT_PUBLIC_KEY)
// que o Wix Vibe não injeta automaticamente ao publicar pelo painel.
// O projeto usa backend próprio (Google Auth + Node.js), não os serviços do Wix.
// O adapter cloudProviderFetchAdapter mantém a hospedagem no Wix funcionando.

export default defineConfig({
  output: "server",
  integrations: [
    {
      name: "framewire",
      hooks: {
        "astro:config:setup": ({ injectScript, command }) => {
          if (command === "dev") {
            injectScript(
              "page",
              `import loadFramewire from "framewire.js";
              loadFramewire(true);`
            );
          }
        },
      },
    },
    tailwind(),
    ...(isBuild ? [monitoring()] : []),
    react(isBuild ? {} : {
      babel: { plugins: [sourceAttrsPlugin, dynamicDataPlugin] },
    }),
  ],
  vite: {
    plugins: [customErrorOverlayPlugin()],
    cacheDir: "node_modules/.cache/.vite",
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "zustand",
        "framer-motion",
        "date-fns",
        "clsx",
        "class-variance-authority",
        "tailwind-merge",
        "zod",
      ],
    },
    css: !isBuild ? {
      postcss: {
        plugins: [postcssPseudoToData()],
      },
    } : undefined,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/three")) return "vendor-three";
            if (id.includes("node_modules/framer-motion")) return "vendor-framer";
            if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
            if (id.includes("node_modules/@wix")) return "vendor-wix";
          },
        },
      },
    },
  },
  ...(isBuild && { adapter: cloudProviderFetchAdapter({}) }),
  devToolbar: { enabled: false },
  image: { domains: ["static.wixstatic.com"] },
  server: { allowedHosts: true, host: true },
  security: { checkOrigin: false },
});
