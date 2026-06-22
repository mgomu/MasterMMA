import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // El volumen genera ficheros AppleDouble (._*); ignóralos.
    exclude: ["**/node_modules/**", "**/._*"],
  },
});
