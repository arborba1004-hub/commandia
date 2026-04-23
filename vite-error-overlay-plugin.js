// Dummy class to avoid type errors
class BaseClass {}

export class ErrorOverlay extends BaseClass {
  static MESSAGE_TITLE = `We're having trouble displaying this page`;
  static MESSAGE_DESCRIPTION = `Something didn't load correctly on our end.`;

  static getOverlayHTML() {
    return `
<img alt="Error illustration" style="max-width:240px;margin:32px auto 16px;display:block;" />
<div style="padding:24px;text-align:center;font-family:Arial,sans-serif;">
  <h1 style="font-size:28px;margin:0 0 12px;">${ErrorOverlay.MESSAGE_TITLE}</h1>
  <p style="font-size:16px;color:#555;margin:0;">${ErrorOverlay.MESSAGE_DESCRIPTION}</p>
</div>
`;
  }

  static async sendErrorToParent(err, type) {
    const isDev = import.meta.env?.DEV ?? false;
    const isIframe = window.self !== window.top;

    if (!isDev || !isIframe) {
      return;
    }

    const payload = {
      type: "preview-error",
      errorType: type || "build",
      message: err?.message || "Unknown error",
      stack: err?.stack || "No stack trace available",
      timestamp: new Date().toISOString(),
    };

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, "*");
        console.log("[overlay] Sent preview-error via postMessage");
      }
    } catch (postMessageError) {
      console.warn("[overlay] Failed to postMessage to parent:", postMessageError);
    }

    try {
      const loadFramewire = (await import("framewire.js")).default;
      await loadFramewire(false);

      const sendMessageToParent = globalThis.framewire?.sendMessageToParent;
      const EditorEventMessages = globalThis.framewire?.EditorEventMessages;

      if (sendMessageToParent && EditorEventMessages?.CLIENT_ERROR) {
        sendMessageToParent({
          type: EditorEventMessages.CLIENT_ERROR,
          clientErrorData: {
            errorType: payload.errorType,
            message: payload.message,
            stack: payload.stack,
          },
        });
        console.log("[overlay] Sent CLIENT_ERROR via Framewire");
      } else {
        console.warn("[overlay] Framewire CLIENT_ERROR channel unavailable");
      }
    } catch (framewireError) {
      console.warn(
        "[overlay] Failed to send error to parent via framewire:",
        framewireError?.message || framewireError
      );
    }
  }

  connectedCallback() {
    this.style.position = "fixed";
    this.style.top = "0";
    this.style.left = "0";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.zIndex = "99999";
    this.style.backgroundColor = "white";
    this.style.display = "flex";
    this.style.flexDirection = "column";
    this.innerHTML = ErrorOverlay.getOverlayHTML();
  }

  constructor(err, type) {
    super();
    console.log("[overlay] ErrorOverlay constructor called with:", err);
    ErrorOverlay.sendErrorToParent(err, type || "build");
  }
}

// See https://github.com/withastro/astro/blob/main/packages/astro/src/vite-plugin-astro-server/plugin.ts#L157
const customErrorOverlayPlugin = () => {
  return {
    name: "custom-error-overlay",
    apply: "serve",
    transform(code, id, opts = {}) {
      if (!id.includes("vite/dist/client/client.mjs") || opts?.ssr) {
        return;
      }

      const errorOverlayCustomElement = ErrorOverlay.toString().replace(
        "extends BaseClass",
        "extends HTMLElement"
      );

      return code.replace(
        "class ErrorOverlay",
        `${errorOverlayCustomElement} class OldErrorOverlay`
      );
    },

    transformIndexHtml(html) {
      const errorScript = `
<script>
  window.addEventListener("error", function (event) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "preview-error",
          errorType: "runtime",
          message: event?.message || "Unknown runtime error",
          stack: event?.error?.stack || "No stack trace available",
          timestamp: new Date().toISOString(),
        }, "*");
      }
    } catch (e) {
      console.warn("[overlay] Failed to relay runtime error:", e);
    }
  });

  window.addEventListener("unhandledrejection", function (event) {
    try {
      const reason = event?.reason;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "preview-error",
          errorType: "unhandledrejection",
          message: reason?.message || String(reason || "Unhandled promise rejection"),
          stack: reason?.stack || "No stack trace available",
          timestamp: new Date().toISOString(),
        }, "*");
      }
    } catch (e) {
      console.warn("[overlay] Failed to relay unhandled rejection:", e);
    }
  });
</script>
`;
      return html.replace("</head>", `${errorScript}</head>`);
    },
  };
};

export default customErrorOverlayPlugin;