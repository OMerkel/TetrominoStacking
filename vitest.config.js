import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["html5/src/js/core/**/*.js", "html5/src/js/app/store.js"],
      thresholds: {
        lines: 98,
        branches: 98,
        functions: 98,
        statements: 98,
      },
    },
  },
});
