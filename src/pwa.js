export const pwaState = {
  installed:
    matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigator.standalone),
  offlineReady: false,
  needsUpdate: false,
};
let installPrompt,
  registration,
  onChange = () => {};

export function initPWA(callback) {
  onChange = callback;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    onChange(pwaState);
  });
  window.addEventListener("appinstalled", () => {
    pwaState.installed = true;
    installPrompt = null;
    onChange(pwaState);
  });
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
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
          onChange(pwaState);
        });
        reg.update().catch(() => {});
      })
      .catch(() => {});
  }
}

export async function installApp() {
  if (!installPrompt) return false;
  const event = installPrompt;
  installPrompt = null;
  await event.prompt();
  await event.userChoice;
  return true;
}

export function updateApp() {
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
}
