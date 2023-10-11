import { asset, ASSET_CACHE_BUST_KEY } from "$fresh/runtime.ts";
import type { Plugin } from "$fresh/server.ts";
import type { PluginRoute } from "$fresh/src/server/types.ts";
import { decode, GIF, Image } from "imagescript/mod.ts";
import { join, resolve, toFileUrl } from "$std/path/mod.ts";

export interface ImagesPluginOptions {
  publicPath?: string;
  realPath?: string;
  transformers?: Record<
    string,
    (
      img: Image | GIF,
      req: Request,
    ) => Image | GIF | Promise<Image | GIF>
  >;
}

export async function handleImageRequest<T extends string>(
  transformers: ImagesPluginOptions["transformers"] = {},
  req: Request,
  publicPath: T,
  localPath?: string,
): Promise<Response> {
  const url = new URL(req.url);
  const srcPath = url.pathname.replace(`${publicPath}/`, "");

  // TODO: Add support for external image sources

  const resourcePath = toFileUrl(
    join(resolve(Deno.cwd(), localPath ?? "./"), srcPath),
  );

  const transformFns = url.searchParams.getAll("fn");

  try {
    const res = await fetch(resourcePath);
    const data = await res.arrayBuffer();
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

    return new Response(buffer, {
      headers: {
        "content-type": isGif ? "image/gif" : "image/png",
        // "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return new Response(`Failed fetching: ${resourcePath}: ${err.message}`, {
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
 * import ImagesPlugin from "fresh-images/mod.ts";
 * import { resize } from "fresh-images/transformer.ts";
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
  publicPath = "/images",
  realPath = "./static/image",
  transformers = {},
}: ImagesPluginOptions): Plugin {
  // TODO: Ensure imagePath is not a directory in the ./static folder. Otherwise there will be Fresh routing conflicts.

  // TODO: Allow image transformers to create their own routes

  const routes: PluginRoute[] = [
    {
      path: `${publicPath}/[fileName]`,
      handler: async (req) =>
        await handleImageRequest(
          transformers,
          req,
          publicPath,
          realPath,
        ),
    },
  ];

  return {
    name: "fresh-images",
    routes,
  };
}
