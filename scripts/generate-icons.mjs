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
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#e9ede5"/><path d="M152 112h208v286l-104-38-104 38z" fill="none" stroke="#3d5c4c" stroke-width="12"/><path d="M196 294V184l60 66 60-66v110" fill="none" stroke="#3d5c4c" stroke-width="17" stroke-linejoin="round"/></svg>`,
);
await sharp(maskable).png().toFile("public/icons/maskable-512.png");
