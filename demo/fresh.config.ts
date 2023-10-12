import { defineConfig } from "$fresh/server.ts";
import ImagesPlugin from "fresh_images/mod.ts";
import { crop, resize, rotate } from "fresh_images/transformer.ts";

export default defineConfig({
  plugins: [
    ImagesPlugin({
      route: "/img",
      transformers: { resize, rotate, crop },
    }),
  ],
});
