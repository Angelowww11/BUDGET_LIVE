import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function files(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory())
      result.push(...(await files(`${dir}/${entry.name}`, `${path}/`)));
    else if (
      !["sw.js", ".DS_Store"].includes(entry.name) &&
      !path.endsWith(".map")
    )
      result.push(path);
  }
  return result;
}
const assets = (await files("dist")).sort();
const hash = createHash("sha256");
for (const asset of assets) hash.update(await readFile(`dist/${asset}`));
const revision = hash.digest("hex").slice(0, 16);
const source = `/* Daylight app files only. Personal records stay in browser storage. */
const REVISION = ${JSON.stringify(revision)};
const PREFIX = 'daylight-shell-' + new URL(self.registration.scope).pathname.replace(/[^a-zA-Z0-9]/g, '-');
const CACHE = PREFIX + REVISION;
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new URL(path, self.registration.scope).href))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') return (await cache.match(new URL('index.html', self.registration.scope).href)) || fetch(event.request);
    return (await cache.match(event.request)) || fetch(event.request);
  }));
});
`;
await writeFile("dist/sw.js", source);
console.log(
  `Offline shell: ${assets.length} local files, revision ${revision}`,
);
