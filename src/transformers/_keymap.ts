import type { UniqueRecord } from "../types.ts";
/**
 * Key map for the transformer options.
 * Keys and values should be unique.
 */
export const KEYMAP: UniqueRecord<string, string> = {
  rotateDegrees: "rd",
  resizeHeight: "rh",
  resizeWidth: "rw",
  cropWidth: "cw",
  cropHeight: "ch",
  cropStartX: "cx",
  cropStartY: "cy",
  quality: "q",
  noCache: "nocache",
};
