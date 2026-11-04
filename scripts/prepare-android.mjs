import { readFile, writeFile, readdir } from "node:fs/promises";
import sharp from "sharp";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const [major, minor, patch] = version.split(".").map(Number);
const code = major * 10000 + minor * 100 + patch;
const gradlePath = "android/app/build.gradle";
let gradle = await readFile(gradlePath, "utf8");
gradle = gradle
  .replace(/versionCode \d+/, `versionCode ${code}`)
  .replace(/versionName "[^"]+"/, `versionName "${version}"`);
await writeFile(gradlePath, gradle);
const icon = await readFile("public/app-icon.svg");
const foreground = await readFile("public/icons/maskable-512.png");
for (const [density, scale] of [
  ["mdpi", 1],
  ["hdpi", 1.5],
  ["xhdpi", 2],
  ["xxhdpi", 3],
  ["xxxhdpi", 4],
]) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  for (const file of ["ic_launcher.png", "ic_launcher_round.png"])
    await sharp(icon)
      .resize(Math.round(48 * scale))
      .png()
      .toFile(`${dir}/${file}`);
  await sharp(foreground)
    .resize(Math.round(108 * scale))
    .png()
    .toFile(`${dir}/ic_launcher_foreground.png`);
}
// Replace all generated template splash art with the actual app mark.
for (const dir of await readdir("android/app/src/main/res", {
  withFileTypes: true,
})) {
  if (!dir.isDirectory() || !dir.name.startsWith("drawable")) continue;
  const path = `android/app/src/main/res/${dir.name}/splash.png`;
  try {
    const { width, height } = await sharp(path).metadata();
    const size = Math.round(Math.min(width, height) * 0.22);
    const mark = await sharp(foreground).resize(size).png().toBuffer();
    await sharp({
      create: { width, height, channels: 4, background: "#234f50" },
    })
      .composite([{ input: mark, gravity: "centre" }])
      .png()
      .toFile(`${path}.tmp.png`);
    const { rename } = await import("node:fs/promises");
    await rename(`${path}.tmp.png`, path);
  } catch (error) {
    if (
      error.code !== "ENOENT" &&
      !String(error.message).includes("Input file is missing")
    )
      throw error;
  }
}
console.log(`Android resources prepared for M.Y.M.P. ${version} (${code}).`);
