import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { JWT_SECRET: "test-secret-for-unit-tests", TOTP_ENCRYPTION_KEY: "test-totp-key" },
    coverage: { provider: "v8", include: ["src/lib/**"], reporter: ["text", "lcov"] },
  },
});
