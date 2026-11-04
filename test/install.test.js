import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const original = await readFile(
  new URL("../src/pwa.js", import.meta.url),
  "utf8",
);
function environment({ native = false, fail = false, waiting = null } = {}) {
  const events = new Map(),
    swEvents = new Map();
  let dialog = false,
    reloads = 0,
    updates = 0;
  const registration = {
    waiting,
    update: async () => {
      updates++;
    },
    addEventListener() {},
  };
  const navigator = {
    onLine: true,
    serviceWorker: {
      controller: {},
      register: async () => {
        if (fail) throw Error("Unreachable");
        return registration;
      },
      ready: Promise.resolve(registration),
      addEventListener: (name, fn) => swEvents.set(name, fn),
    },
  };
  const context = vm.createContext({
    matchMedia: () => ({ matches: false }),
    navigator,
    window: { addEventListener: (name, fn) => events.set(name, fn) },
    document: {
      addEventListener() {},
      querySelector: () => (dialog ? {} : null),
    },
    location: { reload: () => reloads++ },
  });
  vm.runInContext(
    original
      .replace(/^import .*;\r?\n/m, `const isNativeApp = ${native};\n`)
      .replaceAll("export ", "")
      .replaceAll("import.meta.env.PROD", "true")
      .replaceAll("import.meta.env.BASE_URL", '"/BUDGET_LIVE/"'),
    context,
  );
  const api = vm.runInContext(
    "({pwaState,initPWA,installApp,checkForUpdate,updateApp})",
    context,
  );
  api.initPWA(() => {});
  return {
    ...api,
    events,
    swEvents,
    navigator,
    registration,
    dialog: (value) => {
      dialog = value;
    },
    reloads: () => reloads,
    updates: () => updates,
  };
}
const settled = () => new Promise(setImmediate);
test("accepted installation is recorded; a dismissed prompt remains uninstalled", async () => {
  for (const outcome of ["accepted", "dismissed"]) {
    const e = environment();
    e.events.get("beforeinstallprompt")({
      preventDefault() {},
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome }),
    });
    assert.equal(e.pwaState.canInstall, true);
    assert.equal(await e.installApp(), outcome === "accepted");
    assert.equal(e.pwaState.installed, outcome === "accepted");
    assert.equal(e.pwaState.canInstall, false);
  }
});
test("updates wait for an entry to close and reload once after activation", async () => {
  const messages = [];
  const e = environment({
    waiting: { postMessage: (message) => messages.push(message.type) },
  });
  await settled();
  assert.equal(e.pwaState.needsUpdate, true);
  assert.equal(e.pwaState.offlineReady, true);
  e.dialog(true);
  assert.equal(e.updateApp(), false);
  assert.deepEqual(messages, []);
  e.dialog(false);
  assert.equal(e.updateApp(), true);
  assert.deepEqual(messages, ["SKIP_WAITING"]);
  e.swEvents.get("controllerchange")();
  e.swEvents.get("controllerchange")();
  assert.equal(e.reloads(), 1);
});
test("offline update checks report a connection problem without changing records", async () => {
  const e = environment();
  await settled();
  const before = e.updates();
  e.navigator.onLine = false;
  await assert.rejects(e.checkForUpdate(), /Connect to the internet/);
  assert.equal(e.updates(), before);
});
test("failed offline preparation is visible and never reported as ready", async () => {
  const e = environment({ fail: true });
  await settled();
  assert.equal(e.pwaState.offlineReady, false);
  assert.match(e.pwaState.installError, /could not be prepared/);
});
test("bundled Android installs are ready offline without a web service worker", async () => {
  const e = environment({ native: true });
  await settled();
  assert.equal(e.pwaState.installed, true);
  assert.equal(e.pwaState.offlineReady, true);
  assert.equal(e.updates(), 0);
  assert.equal(e.events.has("beforeinstallprompt"), false);
});
