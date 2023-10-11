import { defineConfig } from "$fresh/server.ts";
import ImagesPlugin from "https://deno.land/x/fresh_images/mod.ts";
import {
  resize,
  rotate,
} from "https://deno.land/x/fresh_images/transformer.ts";

export default defineConfig({
  plugins: [
    ImagesPlugin({
      route: "/img",
      transformers: { resize, rotate },
    }),
  ],
});
