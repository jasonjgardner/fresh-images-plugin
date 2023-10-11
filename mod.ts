import { asset, ASSET_CACHE_BUST_KEY } from "$fresh/runtime.ts";
import type { Handler, Plugin } from "$fresh/server.ts";
import {
  decode,
  GIF,
  Image,
} from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { extname, join, resolve, toFileUrl } from "$std/path/mod.ts";

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
  const resourcePath = toFileUrl(
    join(resolve(Deno.cwd(), localPath ?? "./"), srcPath),
  );

  const transformFns = url.searchParams.getAll("fn");

  try {
    const res = await fetch(resourcePath);
    const data = await res.arrayBuffer();
    const img = await transformFns.reduce(async (acc, xfn) => {
      if (xfn in transformers) {
        const newImg = await transformers[xfn](await acc, req);
        return newImg;
      }

      return acc;
    }, decode(data));

    const isGif = img instanceof GIF;
    const buffer = await (isGif ? img.encode(15) : (img as Image).encode(1));

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

export function createRoutes<T extends string = "/images">(
  imagesPath = "/images" as T,
  absoluteBasePath = "./static",
  transformers: ImagesPluginOptions["transformers"] = {},
): [
  { path: `${T}/[fileName]`; handler: Handler },
] {
  // TODO: Ensure imagePath is not a directory in the ./static folder. Otherwise there will be Fresh routing conflicts.

  // TODO: Allow image transformers to create their own routes

  return [
    {
      path: `${imagesPath}/[fileName]`,
      handler: async (req) =>
        await handleImageRequest(
          transformers,
          req,
          imagesPath,
          absoluteBasePath,
        ),
    },
  ];
}

export default function ImagesPlugin({
  publicPath = "/images",
  realPath = "./static/image",
  transformers = {},
}: ImagesPluginOptions): Plugin {
  return {
    name: "fresh-images",
    routes: createRoutes(publicPath, realPath, transformers),
  };
}
