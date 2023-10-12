import { type GIF, Image } from "imagescript/mod.ts";
import { getParam, transform } from "../_utils.ts";

/**
 * Resize an image to a given width and/or height.
 * @param img Image to resize
 * @param req URL request containing transformation parameters
 * @returns Resized image
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import ImagesPlugin from "fresh_images/mod.ts";
 * import { resize } from "fresh_images/transformer.ts";
 *
 * export default defineConfig({
 *  plugins: [
 *  ImagesPlugin({
 *    publicPath: "/img",
 *    transformers: { resize },
 *   }),
 * ]
 * });
 * ```
 * @example
 * ```html
 * <img src="/img/meow.jpg?fn=resize&rw=100" alt="Resized to 100px wide" />
 * <img src="/img/meow.jpg?fn=resize&resizeWidth=100" alt="Resized to 100px wide" />
 * <img src="/img/meow.jpg?fn=resize&rh=100" alt="Resized to 100px tall" />
 * <img src="/img/meow.jpg?fn=resize&resizeHeight=100" alt="Resized to 100px tall" />
 * <img src="/img/meow.jpg?fn=resize&rw=100&h=100" alt="Resized to 100px by 100px" />
 * <img src="/img/meow.jpg?fn=resize&resizeWidth=100&resizeHeight=100" alt="Resized to 100px by 100px" />
 * ```
 */
export default function resize(img: Image | GIF, req: Request): Image | GIF {
  const url = new URL(req.url);

  const width = Number(getParam(url, "resizeWidth") ?? Image.RESIZE_AUTO);
  const height = Number(getParam(url, "resizeHeight") ?? Image.RESIZE_AUTO);

  // FIXME: Height must be specified when transforming a GIF
  return transform(img, (img) => img.resize(width, height));
}
