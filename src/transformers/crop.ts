import { type GIF, Image } from "imagescript/mod.ts";
import { getParam, transform } from "../_utils.ts";

/**
 * Crop an image to a specified area.
 * @param img Image to crop
 * @param req URL request containing transformation parameters
 * @returns Cropped image
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import ImagesPlugin from "fresh_images/mod.ts";
 * import { crop } from "fresh_images/transformer.ts";
 *
 * export default defineConfig({
 *  plugins: [
 *    ImagesPlugin({
 *      publicPath: "/img",
 *      transformers: { crop },
 *    }),
 *  ],
 * });
 * ```
 * @example
 * ```html
 * <img src="/img/meow.jpg?fn=crop&cx=100&cy=100&cw=100&ch=100" alt="Cropped to 100px by 100px starting at 100px by 100px" />
 * ```
 */
export default function crop(
  img: Image | GIF,
  req: Request,
): Promise<Image | GIF> {
  const url = new URL(req.url);

  // TODO: Support keywords for crop start area (e.g. "center")

  const x = Number(getParam(url, "cropStartX") ?? 0);
  const y = Number(getParam(url, "cropStartY") ?? 0);
  const width = Number(getParam(url, "cropWidth") ?? Image.RESIZE_AUTO);
  const height = Number(getParam(url, "cropHeight") ?? Image.RESIZE_AUTO);

  return transform(
    img,
    (img) => Promise.resolve(img.crop(x, y, width, height)),
  );
}
