import { isNativeApp } from "./platform.js";

export const pwaState = {
  installed:
    isNativeApp ||
    matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigator.standalone),
  offlineReady: isNativeApp,
  needsUpdate: false,
  canInstall: false,
  updateChecking: false,
  installError: "",
};
let installPrompt,
  registration,
  onChange = () => {};

export function initPWA(callback) {
  onChange = callback;
  if (isNativeApp) {
    onChange(pwaState);
    return;
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    pwaState.canInstall = true;
    onChange(pwaState);
  });
  window.addEventListener("appinstalled", () => {
    pwaState.installed = true;
    installPrompt = null;
    pwaState.canInstall = false;
    onChange(pwaState);
  });
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none",
      })
      .then((reg) => {
        registration = reg;
        if (reg.waiting) {
          pwaState.needsUpdate = true;
          onChange(pwaState);
        }
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") {
              if (navigator.serviceWorker.controller)
                pwaState.needsUpdate = true;
              else pwaState.offlineReady = true;
              onChange(pwaState);
            }
          });
        });
        navigator.serviceWorker.ready.then(() => {
          pwaState.offlineReady = true;
          pwaState.installError = "";
          onChange(pwaState);
        });
        reg.update().catch(() => {});
      })
      .catch(() => {
        pwaState.installError =
          "Offline files could not be prepared. Reconnect and try again.";
        onChange(pwaState);
      });
  }
  window.addEventListener("online", () => checkForUpdate().catch(() => {}));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine)
      registration?.update().catch(() => {});
  });
}

export async function installApp() {
  if (!installPrompt) return false;
  const event = installPrompt;
  installPrompt = null;
  pwaState.canInstall = false;
  await event.prompt();
  const result = await event.userChoice;
  if (result.outcome === "accepted") pwaState.installed = true;
  onChange(pwaState);
  return result.outcome === "accepted";
}

export async function checkForUpdate() {
  if (!navigator.onLine)
    throw new Error("Connect to the internet to check for updates.");
  if (!registration)
    throw new Error("Open the installed app online once to prepare updates.");
  pwaState.updateChecking = true;
  onChange(pwaState);
  try {
    await registration.update();
    if (registration.waiting) pwaState.needsUpdate = true;
    return pwaState.needsUpdate;
  } finally {
    pwaState.updateChecking = false;
    onChange(pwaState);
  }
}

export function updateApp() {
  if (document.querySelector("dialog[open]")) return false;
  if (registration?.waiting) {
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloading) {
        reloading = true;
        location.reload();
      }
    });
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  } else location.reload();
  return true;
}
