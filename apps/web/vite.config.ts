import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
  },
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
      },
    }),
    viteReact(),
    tailwindcss(),
    nitro({
      vercel: {
        functions: {
          runtime: "bun1.x",
        },
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
