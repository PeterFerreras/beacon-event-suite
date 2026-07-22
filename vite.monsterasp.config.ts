import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), react()],
  build: {
    outDir: "dist/monsterasp",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.monsterasp.html"),
    },
  },
});
