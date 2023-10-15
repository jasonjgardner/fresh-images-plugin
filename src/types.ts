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
 * Options for the image middleware
 */
export interface ImageMiddlewareOptions {
  /**
   * The maximum number of concurrent image requests from a single IP address.
   * (This should be set high enough to serve all images at least once.)
   */
  rateLimit: number;
  /**
   * The duration of the rate limit in milliseconds. Used as KV TTL.
   */
  rateLimitDuration: number;
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
  build?: (props: Omit<ImagesPluginOptions, "build">) => Promise<void>;

  /**
   * Options for the image middleware
   */
  middleware?: Partial<ImageMiddlewareOptions>;
}
