import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    poolOptions: { forks: { singleFork: true } },
    env: {
      TURSO_DATABASE_URL: "file:data/vitest.db",
      SECRET_PEPPER: "test-pepper-0123456789abcdef0123456789abcdef",
      BCRYPT_COST: "4",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
