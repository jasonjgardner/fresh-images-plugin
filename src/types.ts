import type { GIF, Image } from "imagescript/mod.ts";

// deno-lint-ignore no-explicit-any
export type UniqueRecord<K extends keyof any, T> = {
  [P in K]: T;
};

/**
 * Options for the Images plugin
 */
export interface ImagesPluginOptions {
  /**
   * The route exposed to the client
   */
  route?: string;
  /**
   * The absolute path to the image file directory
   */
  realPath?: string;
  /**
   * A map of image transformation functions
   */
  transformers?: Record<
    string,
    (
      img: Image | GIF,
      req: Request,
    ) => Image | GIF | Promise<Image | GIF>
  >;
}
