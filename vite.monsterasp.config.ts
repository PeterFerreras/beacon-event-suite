import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths(), tanstackRouter({ target: "react", autoCodeSplitting: true }), tailwindcss(), react()],
  build: {
    outDir: "dist/monsterasp",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(process.cwd(), "index.monsterasp.html"),
    },
  },
});
