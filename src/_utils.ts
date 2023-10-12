import { Frame, GIF, Image } from "imagescript/mod.ts";
import { KEYMAP } from "./transformers/_keymap.ts";

/**
 * Get a parameter from a URL or request.
 * @param src Request or URL to get the parameter from
 * @param param Parameter full name or short name
 * @returns Parameter value as string or null
 */
export function getParam(
  src: Request | URL,
  param: keyof typeof KEYMAP,
): string | null {
  const url = src instanceof URL ? src : new URL(src.url);

  return url.searchParams.get(param) ?? url.searchParams.get(KEYMAP[param]);
}

// function createFrameFromImage(img: Image | Frame, duration?: number): Frame {
//   if (img instanceof Frame) {
//     return img;
//   }
//   const frame = new Frame(img.width, img.height, duration);
//   frame.bitmap = img.bitmap;
//   return frame;
// }

/**
 * Transform an image or each frame of a GIF using a callback.
 * @param img Image or GIF to transform
 * @param cb Transformation to apply to image or GIF frames
 * @returns Transformed image or GIF
 */
export function transform(
  img: Image | GIF,
  cb = (img: Frame | Image) => img,
): Image | GIF {
  if (img instanceof GIF) {
    // const frames: Frame[] = [];

    // img.forEach((imgFrame) => {
    //   // TODO: Maintain original duration
    //   const frame = createFrameFromImage(cb(imgFrame));
    //   frames.push(frame);
    // });

    const frames = [...img].map(cb) as Frame[];

    return new GIF(frames);
  }

  return cb(img) as Image;
}
