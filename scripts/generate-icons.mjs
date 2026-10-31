import { readFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
await mkdir("public/icons", { recursive: true });
const svg = await readFile("public/app-icon.svg");
await Promise.all(
  [192, 512, 180].map((size) =>
    sharp(svg)
      .resize(size, size)
      .png()
      .toFile(
        `public/icons/${size === 180 ? "apple-touch-icon" : `icon-${size}`}.png`,
      ),
  ),
);
const maskable = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#356e57"/><path d="M186 312V214h42v98m58 0V180h42v132" fill="none" stroke="#fffaf1" stroke-width="30" stroke-linecap="round"/><path d="M168 357h176" stroke="#b1d1bd" stroke-width="18" stroke-linecap="round"/></svg>`,
);
await sharp(maskable).png().toFile("public/icons/maskable-512.png");
