import type { Plugin } from "$fresh/server.ts";
import type { PluginRoute } from "$fresh/src/server/types.ts";
import { join, resolve, toFileUrl } from "$std/path/mod.ts";
import { ASSET_CACHE_BUST_KEY } from "$fresh/runtime.ts";
import { decode, GIF } from "imagescript/mod.ts";
import type { ImagesPluginOptions } from "./src/types.ts";

export { extendKeyMap, getParam, transform } from "./src/_utils.ts";

/**
 * Cache for transformed images
 */
const CACHE = await caches.open(`fresh_images-${ASSET_CACHE_BUST_KEY}`);

/**
 * Handle an image transformation request.
 * @param transformers Available image transformations
 * @param req HTTP request
 * @param publicPath Route exposed to the client
 * @param localPath Optional path to the local image directory. Defaults to root.
 * @returns Response containing the transformed image or an error message
 */
export async function handleImageRequest<T extends string>(
  transformers: ImagesPluginOptions["transformers"] = {},
  req: Request,
  publicPath: T,
  localPath?: string,
): Promise<Response> {
  const cached = await CACHE.match(req);

  if (cached) {
    cached.headers.set("x-cache-hit", "true");
    return cached;
  }

  const url = new URL(req.url);
  const srcPath = url.pathname.replace(`${publicPath}/`, "");

  const resourcePath = toFileUrl(
    join(resolve(Deno.cwd(), localPath ?? "./"), srcPath),
  );

  const transformFns = url.searchParams.getAll("fn");

  try {
    const resource = await fetch(resourcePath);
    const data = await resource.arrayBuffer();

    // Apply each transformation function in order
    const img = await transformFns.reduce(async (acc, xfn) => {
      if (xfn in transformers) {
        return await transformers[xfn](await acc, req);
      }

      return acc;
    }, decode(data));

    const isGif = img instanceof GIF;
    const quality = Number(
      url.searchParams.get("q") ?? url.searchParams.get("quality") ?? 5,
    );
    const buffer = await img.encode(
      Math.min(isGif ? 30 : 3, Math.max(1, quality)),
    );

    const res = new Response(buffer, {
      headers: {
        "content-type": isGif ? "image/gif" : "image/png",
      },
    });

    CACHE.put(req, res.clone());

    return res;
  } catch (err) {
    return new Response(err.message, {
      status: 500,
    });
  }
}

/**
 * A Fresh plugin which adds image transformation routes to your static directory
 * @property {string} publicPath The base path for the image transformation routes
 * @property {string} realPath The absolute path to the image file directory
 * @property {Record<string, (img: Image | GIF, req: Request) => Image | GIF>} transformers A map of image transformation functions
 * @returns {Plugin} Images plugin
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import ImagesPlugin from "fresh_images/mod.ts";
 * import { resize } from "fresh_images/transformer.ts";
 *
 * export default defineConfig({
 *   plugins: [
 *     ImagesPlugin({
 *       publicPath: "/img",
 *       transformers: { resize },
 *     }),
 *   ],
 * });
 * ```
 */
export default function ImagesPlugin({
  route = "/images",
  realPath = "./static/image",
  transformers = {},
}: ImagesPluginOptions): Plugin {
  // TODO: Ensure imagePath is not a directory in the ./static folder. Otherwise there will be Fresh routing conflicts.

  // TODO: Allow image transformers to create their own routes

  const routes: PluginRoute[] = [
    {
      path: `${route}/[fileName]`,
      handler: async (req) =>
        await handleImageRequest(
          transformers,
          req,
          route,
          realPath,
        ),
    },
  ];

  return {
    name: "fresh_images",
    routes,
  };
}
