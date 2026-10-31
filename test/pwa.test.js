import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  rmdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import vm from "node:vm";

test("an offline release uses its matching HTML even when HTTP has an older page", async () => {
  const directory = await mkdtemp(join(tmpdir(), "daylight-pwa-"));
  const dist = join(directory, "dist");
  try {
    await mkdir(join(dist, "assets"), { recursive: true });
    const expected =
      '<!doctype html><title>New release</title><script src="/BUDGET_LIVE/assets/new-release.js"></script>';
    await writeFile(join(dist, "index.html"), expected);
    await writeFile(
      join(dist, "assets/new-release.js"),
      'window.daylightRelease="new";',
    );
    await promisify(execFile)(
      process.execPath,
      [fileURLToPath(new URL("../scripts/build-pwa.mjs", import.meta.url))],
      { cwd: directory },
    );
    const code = await readFile(join(dist, "sw.js"), "utf8");
    const handlers = new Map(),
      stores = new Map(),
      requests = [];
    let online = true;
    const fakeFetch = async (request) => {
      const url = typeof request === "string" ? request : request.url;
      requests.push({ url, cache: request.cache });
      if (!online) throw new Error("Offline");
      // A browser or CDN still has the previous release's HTML.
      if (url.endsWith("index.html"))
        return new Response(
          '<title>Old release</title><script src="old.js"></script>',
        );
      return new Response('window.daylightRelease="new";');
    };
    const caches = {
      async open(name) {
        if (!stores.has(name)) stores.set(name, new Map());
        const entries = stores.get(name);
        return {
          async addAll(input) {
            for (const request of input)
              entries.set(request.url || request, await fakeFetch(request));
          },
          async put(request, response) {
            entries.set(request.url || request, response);
          },
          async match(request) {
            return entries.get(request.url || request)?.clone();
          },
        };
      },
      async keys() {
        return [...stores.keys()];
      },
      async delete(name) {
        return stores.delete(name);
      },
    };
    stores.set("unrelated-app-cache", new Map());
    vm.runInNewContext(code, {
      self: {
        registration: { scope: "https://example.test/BUDGET_LIVE/" },
        clients: { claim: async () => {} },
        addEventListener: (name, handler) => handlers.set(name, handler),
      },
      caches,
      Request,
      Response,
      URL,
      fetch: fakeFetch,
    });
    let pending;
    handlers.get("install")({
      waitUntil: (promise) => {
        pending = promise;
      },
    });
    await pending;
    handlers.get("activate")({
      waitUntil: (promise) => {
        pending = promise;
      },
    });
    await pending;
    online = false;
    let response;
    handlers.get("fetch")({
      request: {
        method: "GET",
        mode: "navigate",
        url: "https://example.test/BUDGET_LIVE/?action=add",
      },
      respondWith: (promise) => {
        response = promise;
      },
    });
    assert.equal(await (await response).text(), expected);
    handlers.get("fetch")({
      request: {
        method: "GET",
        mode: "cors",
        url: "https://example.test/BUDGET_LIVE/assets/new-release.js",
      },
      respondWith: (promise) => {
        response = promise;
      },
    });
    assert.equal(
      await (await response).text(),
      'window.daylightRelease="new";',
    );
    assert.equal(
      requests.some((request) => request.url.endsWith("index.html")),
      false,
    );
    assert.ok(stores.has("unrelated-app-cache"));
  } finally {
    // Only remove the exact files made by this test; no recursive deletion.
    await rm(join(dist, "sw.js"), { force: true });
    await rm(join(dist, "index.html"), { force: true });
    await rm(join(dist, "assets/new-release.js"), { force: true });
    await rmdir(join(dist, "assets"));
    await rmdir(dist);
    await rmdir(directory);
  }
});
