import type { Plugin } from "$fresh/server.ts";
import type { PluginRoute } from "$fresh/src/server/types.ts";
import type {
  ImagesPluginOptions,
  TransformFn,
  TransformRoute,
} from "./src/types.ts";
import { join, resolve, toFileUrl } from "$std/path/mod.ts";
import { decode } from "imagescript/mod.ts";
import { CACHE, getImageResponse, getParam } from "./src/_utils.ts";
export { extendKeyMap, transform } from "./src/_utils.ts";
export { getParam };

/**
 * Parse a URL for transformation functions to apply. Functions can be passed in the query string or at the start of the path.
 * @param url Request URL to parse
 * @param transformers Installed image transformers
 * @returns List of transformer keys to apply to the image
 */
function getTransformerFns(
  url: URL,
  transformers: ImagesPluginOptions["transformers"] = {},
): string[] {
  const transformFns = url.searchParams.getAll("fn");

  // Parse path for additional transformation functions.
  // Split the public path and look for matching transformer keys
  // e.g. /resize/image.jpg?rw=100&rh=100&fn=rotate&rd=90

  for (const key of Object.keys(transformers)) {
    const value = transformers[key];

    if (typeof value === "function") {
      continue;
    }

    if (
      url.pathname.startsWith(`${value.path}/`)
    ) {
      transformFns.push(key);
      transformers[key] = value;
      break;
    }
  }

  return transformFns;
}

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
  const regex = new RegExp(`^${publicPath}/`);
  const srcPath = url.pathname.replace(regex, "");

  const resourcePath = toFileUrl(
    join(resolve(Deno.cwd(), localPath ?? "./"), srcPath),
  );

  const transformFns = getTransformerFns(url, transformers);

  try {
    const resource = await fetch(resourcePath);
    const data = await resource.arrayBuffer();

    // Apply each transformation function in order
    const img = await transformFns.reduce(async (acc, xfn) => {
      if (!(xfn in transformers)) {
        return acc;
      }
      return typeof transformers[xfn] === "function"
        ? await (transformers[xfn] as TransformFn)(await acc, req)
        : await (transformers[xfn] as TransformRoute).handler(await acc, req);
    }, decode(data));

    return await getImageResponse(img, req);
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

  const routes: PluginRoute[] = Object.entries(transformers).map(
    ([key, fn]) => {
      if (typeof fn === "function") {
        return ({
          path: `${route}/[fileName]`,
          handler: async (req: Request) =>
            await handleImageRequest(
              transformers,
              req,
              route,
              realPath,
            ),
        });
      }

      return {
        path: `${fn.path ?? key}/[fileName]`,
        handler: async (req: Request) => {
          return await handleImageRequest(
            transformers,
            req,
            fn.path ?? key,
            realPath,
          );
        },
      };
    },
  );

  return {
    name: "fresh_images",
    routes,
  };
}
