import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("Android updates retain the same application and private storage origin", async () => {
  const config = JSON.parse(
    await readFile(
      new URL("../capacitor.config.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(config.appId, "com.angelowww11.mymp");
  assert.equal(config.server.hostname, "localhost");
  assert.equal(config.server.androidScheme, "https");
  assert.equal(config.server.url, undefined);
  assert.equal(config.webDir, "dist-native");
  assert.equal(config.android.allowMixedContent, false);
  assert.equal(config.android.webContentsDebuggingEnabled, false);
});
test("Android file sharing grants access only to explicitly exported cache files", async () => {
  const manifest = await readFile(
    new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url),
    "utf8",
  );
  const paths = await readFile(
    new URL("../android/app/src/main/res/xml/file_paths.xml", import.meta.url),
    "utf8",
  );
  assert.match(manifest, /android:allowBackup="false"/);
  assert.doesNotMatch(
    manifest,
    /android.permission.(CAMERA|READ_EXTERNAL_STORAGE|ACCESS_FINE_LOCATION)/,
  );
  assert.match(paths, /path="exports\/"/);
  assert.doesNotMatch(paths, /external-path|root-path/);
});
