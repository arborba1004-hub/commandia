// @ts-check
import { defineConfig } from "astro/config";
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

// https://astro.build/config
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
    wix({
      htmlEmbeds: isBuild,
      auth: false,       // Projeto usa Google Auth — Wix auth desligado
    }),
    ...(isBuild ? [monitoring()] : []),
    react(isBuild ? {} : {
      babel: { plugins: [sourceAttrsPlugin, dynamicDataPlugin] },
    }),
  ],
  vite: {
    plugins: [customErrorOverlayPlugin()],
    cacheDir: 'node_modules/.cache/.vite',
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'framer-motion',
        'date-fns',
        'clsx',
        'class-variance-authority',
        'tailwind-merge',
        '@radix-ui/*',
        '@wix/*',
        'zod',
      ],
    },
    css: !isBuild ? {
      postcss: {
        plugins: [
          postcssPseudoToData(),
        ],
      },
    } : undefined,
    // Divide o bundle em chunks menores para evitar falha ao carregar
    // arquivos grandes no CDN do Wix (erro: "Falha ao buscar módulo dinâmico")
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Three.js e todos os seus submódulos em chunk separado
            if (id.includes('node_modules/three')) {
              return 'vendor-three';
            }
            // Framer Motion em chunk separado
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-framer';
            }
            // Radix UI em chunk separado
            if (id.includes('node_modules/@radix-ui')) {
              return 'vendor-radix';
            }
            // Wix SDK em chunk separado
            if (id.includes('node_modules/@wix')) {
              return 'vendor-wix';
            }
          },
        },
      },
    },
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
    checkOrigin: false
  }
});
