import { defineConfig } from "$fresh/server.ts";
import ImagesPlugin from "fresh-images/mod.ts";
import { resize, rotate } from "fresh-images/transformer.ts";

export default defineConfig({
  plugins: [
    ImagesPlugin({
      publicPath: "/img",
      transformers: { resize, rotate },
    }),
  ],
});
