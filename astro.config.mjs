// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudProviderFetchAdapter from "@wix/cloud-provider-fetch-adapter";
import wix from "@wix/astro";
import monitoring from "@wix/monitoring-astro";
import react from "@astrojs/react";
import sourceAttrsPlugin from "@wix/babel-plugin-jsx-source-attrs";
import dynamicDataPlugin from "@wix/babel-plugin-jsx-dynamic-data";
import customErrorOverlayPlugin from "./vite-error-overlay-plugin.js";
import postcssPseudoToData from "@wix/postcss-pseudo-to-data";

const isBuild = process.env.NODE_ENV == "production";

export default defineConfig({
  output: "server",

  // Define WIX_CLIENT_INSTANCE_ID como opcional com valor padrão
  // para evitar o erro "is missing" ao publicar pelo Wix Vibe
  env: {
    schema: {
      WIX_CLIENT_INSTANCE_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "c60bf4cc-c864-42dd-a273-a1938dac0052",
      }),
    },
  },

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
    wix({
      htmlEmbeds: isBuild,
      auth: false,
    }),
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
        "@radix-ui/*",
        "@wix/*",
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
