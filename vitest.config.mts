import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // content/ and engine/ are pure TypeScript: no DOM needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
