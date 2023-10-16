import { decode, type GIF, type Image } from "imagescript/mod.ts";
import { getParam, transform } from "../_utils.ts";
import {
  ImageMagick,
  IMagickImage,
  initializeImageMagick,
  MagickFormat,
} from "https://esm.sh/@imagemagick/magick-wasm/dist/index.mjs";

const magickWasmRes = await fetch(
  "https://esm.sh/@imagemagick/magick-wasm@0.0.24/dist/magick.wasm",
);
const magickWasm = await magickWasmRes.arrayBuffer();

await initializeImageMagick(new Uint8Array(magickWasm));

export function magickImage(
  src: Uint8Array,
  cb: (image: IMagickImage) => Promise<Uint8Array>,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(src, async (image) => {
        resolve(await cb(image));
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function blur(
  img: Image | GIF,
  req: Request,
): Promise<Image | GIF> {
  const radius = Number(getParam(req, "blurRadius"));
  const sigma = Number(getParam(req, "blurSigma"));

  return await transform(img, async (img) =>
    decode(
      magickImage(await img.encode(), (magicImg) =>
        new Promise((resolve) => {
          magicImg.resize(100, 100);
          magicImg.blur(radius, sigma);
          magicImg.write(MagickFormat.Png, resolve);
        })),
      true,
    ) as Promise<Image>);
}
