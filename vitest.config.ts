import { defineConfig } from "vitest/config";

export default defineConfig({
  // Provide global constant replacements for tests (mirrors esbuild define)
  define: {
    BUILD_DATE: JSON.stringify("test-build"),
    APP_VERSION: JSON.stringify("0.0.0-test"),
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["__tests__/vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./__coverage__",
    },
  },
});
