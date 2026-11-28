import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const frontendSrc = fileURLToPath(
  new URL("./frontend/src", import.meta.url),
);

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@": frontendSrc,
      },
    },
  },
  tanstackStart: {
    srcDirectory: "frontend/src",
    server: {
      entry: "server",
    },
  },
});
