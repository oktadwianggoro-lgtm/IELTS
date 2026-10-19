import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // server-only throws by design when evaluated outside Next.js's
      // bundler (which statically strips it); under Vitest it's a no-op so
      // server-only modules stay unit-testable.
      "server-only": path.resolve(__dirname, "./tests/noop-server-only.ts"),
    },
  },
});
