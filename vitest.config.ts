import { defineConfig } from "vitest/config";
import { cloudflareTest, cloudflarePool } from "@cloudflare/vitest-plugin";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: "./wrangler.jsonc" },
          }),
        ],
        test: {
          name: "worker",
          include: ["tests/worker/**/*.test.ts"],
        },
      },
    ],
  },
});

// Note: in this vitest 4 + pool-workers 0.23 combination the runner is wired by
// the `cloudflareTest` plugin itself (it sets `poolRunner`); project-level
// `plugins` is what makes `cloudflare:test` resolvable for that project only.