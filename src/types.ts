import type { GIF, Image } from "imagescript/mod.ts";

// deno-lint-ignore no-explicit-any
export type UniqueRecord<K extends keyof any, T> = {
  [P in K]: T;
};

/**
 * A function that transforms an image or GIF
 */
export type TransformFn = (
  img: Image | GIF,
  req: Request,
) => Promise<Image | GIF>;

/**
 * A route that maps to a transformation function
 */
export interface TransformRoute {
  path?: string;
  handler: TransformFn;
}

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
    TransformFn | TransformRoute
  >;

  /**
   * Ahead of time build function
   */
  build?: () => Promise<void>;
}
