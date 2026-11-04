import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  define: { "import.meta.env.APP_VERSION": JSON.stringify(version) },
});
