import {
  Frame,
  GIF,
  Image,
} from "https://deno.land/x/imagescript@1.2.15/mod.ts";

export function resize(img: Image | GIF, req: Request): Image | GIF {
  const url = new URL(req.url);

  const width = url.searchParams.get("w") ?? url.searchParams.get("width") ??
    Image.RESIZE_AUTO;
  const height = url.searchParams.get("h") ?? url.searchParams.get("height") ??
    Image.RESIZE_AUTO;

  if (img instanceof GIF) {
    // Resize each frame and reconstruct the GIF
    const frames: Frame[] = img.map((imgFrame) => {
      const frame = new Frame(imgFrame.width, imgFrame.height);
      frame.bitmap = imgFrame.resize(Number(width), Number(height)).bitmap;

      return frame;
    });

    return new GIF(frames);
  }

  return img.resize(Number(width), Number(height));
}
