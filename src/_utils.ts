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
  keyMap?: typeof KEYMAP,
): string | null {
  const url = src instanceof URL ? src : new URL(src.url);
  const km = keyMap ?? KEYMAP;
  return url.searchParams.get(param) ?? url.searchParams.get(km[param]);
}

/**
 * Transform an image or each frame of a GIF using a callback.
 * @param img Image or GIF to transform
 * @param cb Transformation to apply to image or GIF frames
 * @returns Transformed image or GIF
 */
export async function transform(
  img: Image | GIF,
  cb = (img: Frame | Image) => Promise.resolve(img),
): Promise<Image | GIF> {
  if (img instanceof GIF) {
    // TODO: Maintain original duration
    const frames = await Promise.all(
      [...img].map(async (i) => await cb(i)),
    ) as Frame[];

    return new GIF(frames);
  }

  return await cb(img) as Image;
}

/**
 * Allow extending the default keymap with custom parameters.
 * @param keymap Pair of short and full parameter names to extend the default keymap with.
 * @returns Extended keymap
 */
export function extendKeyMap(
  keymap: Record<string, string>,
): typeof KEYMAP {
  return { ...KEYMAP, ...keymap };
}

/**
 * Get a response for an image transformation request.
 * @param img Image buffer
 * @param qualityParam Image output quality
 * @param returnJpeg Whether to return a JPEG instead of a PNG or GIF. Only the first frame of a GIF will be returned, when this is true.
 * @returns HTTP response with image buffer and headers.
 */
async function getResponse(
  img: Image | GIF,
  qualityParam: number,
  returnJpeg: boolean,
): Promise<Response> {
  const isGif = img instanceof GIF;
  const headers = {
    "content-type": isGif ? "image/gif" : "image/png",
  };

  if (returnJpeg) {
    headers["content-type"] = "image/jpeg";
    const quality = Math.min(100, Math.max(1, qualityParam));

    const buffer = await (isGif ? img[0] : img).encodeJPEG(quality);
    return new Response(buffer, {
      headers,
    });
  }

  const quality = Math.min(isGif ? 30 : 3, Math.max(1, qualityParam));
  const buffer = await img.encode(quality);

  return new Response(buffer, {
    headers,
  });
}

/**
 * Get a response for an image request
 * @param img Image buffer
 * @param req Request with transformation parameters
 * @param jpeg Whether to return a JPEG instead of a PNG or GIF. Only the first frame of a GIF will be returned, when this is true.
 * @returns Image response with headers.
 * @uses {@link getResponse}
 */
export async function getImageResponse(
  img: Image | GIF,
  req: Request,
  jpeg?: boolean,
) {
  const res = await getResponse(
    img,
    Number(getParam(req, "quality") ?? 5),
    jpeg ?? false,
  );

  return res;
}
