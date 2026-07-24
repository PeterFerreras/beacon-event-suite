import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

export default defineConfig({
  // Un bundle unico evita fallos de carga/extraccion de muchos chunks en WebFTP de MonsterASP.
  plugins: [tsconfigPaths(), tailwindcss(), react()],
  define: {
    "import.meta.env.VITE_MONSTERASP_SPA": JSON.stringify("true"),
  },
  build: {
    outDir: "dist/monsterasp",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(process.cwd(), "index.monsterasp.html"),
    },
  },
});
