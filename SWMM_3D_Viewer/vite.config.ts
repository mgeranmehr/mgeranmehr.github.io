import { defineConfig } from "vite";

export default defineConfig({
  base: "/SWMM_3D_Viewer/",
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
