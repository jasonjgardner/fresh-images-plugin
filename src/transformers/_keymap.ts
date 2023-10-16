import type { UniqueRecord } from "../types.ts";
/**
 * Key map for the transformer options.
 * Keys and values should be unique.
 */
export const KEYMAP: UniqueRecord<string, string> = {
  blurRadius: "br",
  blurSigma: "bs",
  cropWidth: "cw",
  cropHeight: "ch",
  cropStartX: "cx",
  cropStartY: "cy",
  noCache: "nocache",
  rotateDegrees: "rd",
  resizeHeight: "rh",
  resizeWidth: "rw",
  quality: "q",
} as const;
