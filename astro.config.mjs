// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudProviderFetchAdapter from "@wix/cloud-provider-fetch-adapter";
import wix from "@wix/astro";
import monitoring from "@wix/monitoring-astro";
import react from "@astrojs/react";
import sourceAttrsPlugin from "@wix/babel-plugin-jsx-source-attrs";
import dynamicDataPlugin from "@wix/babel-plugin-jsx-dynamic-data";
import postcssPseudoToData from "@wix/postcss-pseudo-to-data";

const isBuild = process.env.NODE_ENV == "production";

export default defineConfig({
  output: "server",

  integrations: [
    tailwind(),

    wix({
      htmlEmbeds: isBuild,
      auth: true,
    }),

    ...(isBuild ? [monitoring()] : []),

    react(
      isBuild
        ? {}
        : {
            babel: {
              plugins: [sourceAttrsPlugin, dynamicDataPlugin],
            },
          }
    ),
  ],

  vite: {
    plugins: [],
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

    css: !isBuild
      ? {
          postcss: {
            plugins: [postcssPseudoToData()],
          },
        }
      : undefined,
  },

  ...(isBuild && { adapter: cloudProviderFetchAdapter({}) }),

  devToolbar: {
    enabled: false,
  },

  image: {
    domains: ["static.wixstatic.com"],
  },

  server: {
    allowedHosts: true,
    host: true,
  },

  security: {
    checkOrigin: false,
  },
});