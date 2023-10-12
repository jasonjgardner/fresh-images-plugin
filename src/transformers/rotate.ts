import type { GIF, Image } from "imagescript/mod.ts";
import { getParam, transform } from "../_utils.ts";

/**
 * Rotate an image by a given number of degrees.
 * @param img Image to rotate
 * @param req URL request containing transformation parameters
 * @returns Rotated image
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import ImagesPlugin from "fresh_images/mod.ts";
 * import { rotate } from "fresh_images/transformer.ts";
 *
 * export default defineConfig({
 *  plugins: [
 *   ImagesPlugin({
 *    publicPath: "/img",
 *   transformers: { rotate },
 *  }),
 * ],
 * ```
 * @example
 * ```html
 * <img src="/img/meow.jpg?fn=rotate&d=270" alt="Rotated 270 degrees" />
 * <img src="/img/meow.jpg?fn=rotate&rotateDegrees=90" alt="Rotated 90 degrees" />
 * <img src="/img/meow.jpg?fn=rotate&rotateDegrees=-45" alt="Rotated -45 degrees" />
 * ```
 */
export default function rotate(img: Image | GIF, req: Request): Image | GIF {
  const degrees = Number(getParam(req, "rotateDegrees"));
  return transform(img, (img) => img.rotate(degrees));
}
