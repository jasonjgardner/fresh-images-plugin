import { Frame, GIF, Image } from "imagescript/mod.ts";

export const KEYMAP: Record<string, string> = {
  degrees: "d",
  height: "h",
  width: "w",
  cropWidth: "cw",
  cropHeight: "ch",
  cropStartX: "cx",
  cropStartY: "cy",
};

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
 * plugins: [
 *  ImagesPlugin({
 *  publicPath: "/img",
 * transformers: { resize },
 * }),
 * ],
 * ```
 * @example
 * ```html
 * <img src="/img/meow.jpg?fn=resize&w=100" alt="Resized to 100px wide" />
 * <img src="/img/meow.jpg?fn=resize&width=100" alt="Resized to 100px wide" />
 * <img src="/img/meow.jpg?fn=resize&h=100" alt="Resized to 100px tall" />
 * <img src="/img/meow.jpg?fn=resize&height=100" alt="Resized to 100px tall" />
 * <img src="/img/meow.jpg?fn=resize&w=100&h=100" alt="Resized to 100px by 100px" />
 * <img src="/img/meow.jpg?fn=resize&width=100&height=100" alt="Resized to 100px by 100px" />
 * ```
 */
export function resize(img: Image | GIF, req: Request): Image | GIF {
  const url = new URL(req.url);

  const width = url.searchParams.get("width") ??
    url.searchParams.get(KEYMAP.width) ??
    Image.RESIZE_AUTO;
  const height = url.searchParams.get("height") ??
    url.searchParams.get(KEYMAP.height) ??
    Image.RESIZE_AUTO;

  // FIXME: Height must be specified when transforming a GIF
  if (img instanceof GIF) {
    // Resize each frame and reconstruct the GIF
    const frames: Frame[] = [];

    img.forEach((imgFrame) => {
      const frame = new Frame(Number(width), Number(height));
      frame.bitmap = imgFrame.resize(Number(width), Number(height)).bitmap;

      frames.push(frame);
    });

    return new GIF(frames);
  }

  return img.resize(Number(width), Number(height));
}

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
 * <img src="/img/meow.jpg?fn=rotate&degrees=90" alt="Rotated 90 degrees" />
 * <img src="/img/meow.jpg?fn=rotate&degrees=-45" alt="Rotated -45 degrees" />
 * ```
 */
export function rotate(img: Image | GIF, req: Request): Image | GIF {
  const url = new URL(req.url);

  const degrees = url.searchParams.get("degrees") ??
    url.searchParams.get(KEYMAP.degrees);

  if (img instanceof GIF) {
    // Rotate each frame and reconstruct the GIF
    const frames: Frame[] = [];

    img.forEach((imgFrame) => {
      imgFrame.rotate(Number(degrees));
      const frame = new Frame(imgFrame.width, imgFrame.height);
      frame.bitmap = imgFrame.bitmap;

      frames.push(frame);
    });

    return new GIF(frames);
  }

  return img.rotate(Number(degrees)) as Image;
}

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
export function crop(img: Image | GIF, req: Request): Image | GIF {
  const url = new URL(req.url);

  // TODO: Support keywords for crop start area (e.g. "center")

  const x = url.searchParams.get("cropStartX") ??
    url.searchParams.get(KEYMAP.cropStartX) ?? 0;
  const y = url.searchParams.get("cropStartY") ??
    url.searchParams.get(KEYMAP.cropStartY) ?? 0;

  const width = url.searchParams.get("cropWidth") ??
    url.searchParams.get(KEYMAP.cropWidth) ??
    Image.RESIZE_AUTO;
  const height = url.searchParams.get("cropHeight") ??
    url.searchParams.get(KEYMAP.cropHeight) ??
    Image.RESIZE_AUTO;

  if (img instanceof GIF) {
    // Crop each frame and reconstruct the GIF
    const frames: Frame[] = [];

    img.forEach((imgFrame) => {
      const frame = new Frame(Number(width), Number(height));
      frame.bitmap =
        imgFrame.crop(Number(x), Number(y), Number(width), Number(height))
          .bitmap;

      frames.push(frame);
    });

    return new GIF(frames);
  }

  return img.crop(Number(x), Number(y), Number(width), Number(height));
}
