import { defineManifest } from "@crxjs/vite-plugin";

const TARGET = (process.env.TARGET_BROWSER ?? "chrome") as "chrome" | "firefox";

/**
 * specs/004 FR-008: one source object, two manifest outputs.
 * `chrome_url_overrides.newtab` is the correct key for BOTH browsers —
 * Firefox does not use a separate `browser_url_overrides` key (that key
 * does not exist in the WebExtensions spec).
 * Background differs: Chrome MV3 requires `service_worker`; Firefox's MV3
 * service_worker support is too recent to rely on for the "Firefox 109+"
 * baseline in specs/004's Assumptions, so Firefox gets the traditional
 * non-persistent `background.scripts` instead.
 */
export default defineManifest({
  manifest_version: 3,
  name: "KSPlatform Feed",
  description: "Your subscribed-tags feed from KSPlatform, on every new tab.",
  version: "0.1.0",
  icons: {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
  permissions: ["storage"],
  chrome_url_overrides: {
    newtab: "src/newtab/index.html",
  },
  ...(TARGET === "firefox"
    ? {
        background: {
          scripts: ["src/background.ts"],
          type: "module" as const,
        },
        browser_specific_settings: {
          gecko: { id: "extension@ksplatform.dev" },
        },
      }
    : {
        background: {
          service_worker: "src/background.ts",
          type: "module" as const,
        },
      }),
});
