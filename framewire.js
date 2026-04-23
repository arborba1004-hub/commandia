export default async function loadFramewire(withInit = false) {
  const isDev = import.meta.env?.DEV ?? false;
  const isIframe = window.self !== window.top;

  if (!isDev || !isIframe) {
    return;
  }

  try {
    if (!globalThis.framewire) {
      const primaryUrl = getFramewireUrl();
      console.log("[framewire] Attempting to load Framewire from:", primaryUrl);

      try {
        const framewireModule = await import(/* @vite-ignore */ primaryUrl);
        globalThis.framewire = framewireModule;
        console.log("[framewire] ✓ Framewire loaded successfully from primary URL");
      } catch (importError) {
        console.error(
          "[framewire] ✗ Failed to import Framewire from primary URL:",
          primaryUrl,
          importError
        );

        const fallbackUrl = "https://static.parastorage.com/services/framewire/dist/index.mjs";
        console.log("[framewire] Attempting fallback URL:", fallbackUrl);

        const fallbackModule = await import(/* @vite-ignore */ fallbackUrl);
        globalThis.framewire = fallbackModule;
        console.log("[framewire] ✓ Framewire loaded successfully from fallback URL");
      }
    }

    if (withInit && globalThis.framewire?.init) {
      console.log("[framewire] Initializing Framewire");
      globalThis.framewire.init({}, import.meta.hot);
      console.log("[framewire] ✓ Framewire initialized");
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "framewire-ready",
          status: "initialized",
          timestamp: new Date().toISOString(),
        },
        "*"
      );
      console.log("[framewire] Sent framewire-ready message to parent");
    }
  } catch (error) {
    console.error("[framewire] Failed to initialize Framewire:", error);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "framewire-error",
          status: "failed",
          error: error?.message || "Unknown framewire error",
          timestamp: new Date().toISOString(),
        },
        "*"
      );
    }
  }
}

function getVersion() {
  const storedVersion = localStorage.getItem("framewireVersion");
  const defaultVersion = "dist";
  const urlVersion = new URLSearchParams(location.search).get("framewire");

  if (urlVersion) {
    localStorage.setItem("framewireVersion", urlVersion);
  }

  return urlVersion || storedVersion || defaultVersion;
}

function getFramewireUrl() {
  const version = getVersion();
  const localUrl = "https://localhost:3202/framewire/index.mjs";
  const cdnUrl = `https://static.parastorage.com/services/framewire/${version}/index.mjs`;
  const isLocal = version === "local";

  return isLocal ? localUrl : cdnUrl;
}