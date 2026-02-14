import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
      include: ["content.js", "options.js"],
      thresholds: {
        branches: 20,
        functions: 10,
        lines: 20,
        statements: 20
      }
    }
  }
});
