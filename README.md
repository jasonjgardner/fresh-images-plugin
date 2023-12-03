> **This project is no longer maintained.** Switch to [aleph.js](https://github.com/alephjs/aleph.js)

# Fresh Images

**Image manipulation and optimization for
[Fresh](https://github.com/deno/fresh).**

Inspired by [nuxt/image](https://github.com/nuxt/image) and
[next/image](https://nextjs.org/docs/app/building-your-application/optimizing/images).

## Demo

A working demo is deployed at https://fresh-images.deno.dev.

**([View source](https://github.com/jasonjgardner/fresh-images-demo))**

## Install

Modify the import map in your Fresh project to include
[ImageScript](https://github.com/matmen/ImageScript) and the
[Fresh images plugin](https://deno.land/x/fresh_images/).

`deno.json`:

```json
{
  "imports": {
    "fresh_images/": "https://deno.land/x/fresh_images/",
    "imagescript/": "https://deno.land/x/imagescript@1.2.15/"
  }
}
```

Include the plugin and desired transformation functions in your
`fresh.config.ts` file.

```ts
import { defineConfig } from "$fresh/server.ts";
import ImagesPlugin from "fresh_images/mod.ts";
import { resize, rotate } from "fresh_images/transformer.ts";

export default defineConfig({
  plugins: [
    ImagesPlugin({
      route: "/image",
      realPath: "./static/images",
      transformers: { resize, rotate },
    }),
  ],
});
```

### Initializing the Plugin

**`realPath`** — Defaults to `./static/image`. This is the static asset
directory which contains images to transform.

**`route`** — Defaults to `/images`. This property defines the alias URL to the
image directory. Requests to this route are able to receive transformation
function parameters to manipulate images in the `realPath` directory.

> **Note:** `route` should not be the same name as a subdirectory in `./static`.

**`tranformers`** — An object containing transformation functions, with the
function name (`fn`) as keys and the image transformation function as the value.

**`build`** — Optional function to pass to Fresh's `buildStart` hook. Useful for
image preprocessing/pre-rendering.

> **Note:** Build output must be saved in the `./static` directory in order to
> be served. Use `.gitignore` to exclude the output directory if necessary.

## Creating Transformations

A transformer function accepts an instance of ImageScript's `Image` or `GIF`
class to be modified according to the given URL parameters. It must also return
the modified instance of `Image` or `GIF`.

### [Example](https://github.com/jasonjgardner/fresh-images-demo/blob/091aa83bbbd45be4e6c5c798c58207aaeaf92dbe/fresh.config.ts#L17)

```ts
import ImagesPlugin, {
  extendKeyMap,
  getParam,
  transform,
} from "fresh_images/mod.ts";
import { decode, type GIF, type Image } from "imagescript/mod.ts";

/**
 * Custom transformer example.
 * Rotate an image hue by a random number of degrees.
 * Optionally accept a query parameter to invert the hue.
 */
const myTransformer = async (img: Image | GIF, req: Request) => {
  const randomDegrees = Math.floor(Math.random() * 360);

  // Use `extendKeyMap` to lookup custom parameters
  const invert = getParam(req, "invert", extendKeyMap({ invert: "i" }));

  // Use the `transform` helper function to apply asynchronous transformations.
  // This ensures transformations will be applied to every frame of a GIF animation.
  if (invert) {
    img = await transform(img, (frame) => Promise.resolve((frame as Image).invertHue()));
  }

  return transform(
    img,
    (frame) => Promise.resolve((frame as Image).hueShift(randomDegrees)),
  );
};

export default defineConfig({
  plugins: [
    ImagesPlugin({
      transformers: {
        cool: myTransformer,
        withCustomRoute: {
          // Always applies this `handler` transformation to the route.
          // Uses same static image directory!
          path: "/desaturate",
          handler: (img: Image | GIF) =>
            transform(
              img,
              (img) => Promise.resolve((img as Image).saturation(0, true)),
            ),
        },
      },
    }),
});
```

[More examples](https://github.com/jasonjgardner/fresh-images-demo/tree/main/transformers)
are available in the demo repository.

#### Tip

Pass multiple instances of the plugin to allow transformations in more than one
image directory.

```ts
export default defineConfig({
  plugins: [
    // This creates a route, "/images", that will serve images from the "./static/image" directory.
    ImagesPlugin(),
    // Create a different route to access another directory.
    ImagesPlugin({
      route: "/placeholder",
      realPath: "./static/placeholders",
      transformers: {
        // Only specified transformers will be available on this route.
      },
    }),
  ],
});
```

> **Note:** Nested directory routes are currently not supported.

## Usage

Pass each transformation to apply as a `fn` parameter. Reference the
[key map](./src/transformers/_keymap.ts) to view valid URL parameter keys.

### URL Parameters

Pass image transformation parameters in URL:

```html
<!-- Rotate `./static/images/nyan.gif` 45 degrees and resize it to 500×600px -->
<img src="/img/nyan.gif?fn=rotate&d=45&fn=resize&rw=500&rh=600" />
```

### JSX Component

Returns headless `div.fresh-image`. Contains `img.fresh-image__placeholder`
and/or `img.fresh-image__image`.

```jsx
import FreshImage from "fresh_images/src/components/FreshImage.tsx";

// Example using the `transformations` property
<FreshImage
  src="/image/meow.png"
  alt="Cropped to 100px by 100px starting at 100px by 100px. Then resized to 200px by 200px."
  transformations={[{
    fn: "crop",
    cropX: "100",
    cropY: "100",
    cropWidth: "100",
    cropHeight: "100",
  }, {
    fn: "resize",
    resizeWidth: "200",
    resizeHeight: "200",
  }]}
/>

// Define a `placeholder` image to display while the `src` image loads.
<FreshImage
  src="/image/cat.jpg"
  placeholder="/placeholders/loading.png"
  alt="Image with custom transformation and resize"
  transformations={[{
    fn: "cool",
  }, {
    fn: "resize",
    rw: "400",
  }]}
/>

// Set the `preload` property to inject `<link rel="preload">` for this image.
// (Use wisely.)
<FreshImage
  src="/image/chonk.jpg"
  alt="Big, hidden image"
  preload="true"
  transformations={{
    fn: "resize",
    resizeWidth: "1000",
    quality: 100
  }}
/>
```

### Caching

Deno Deploy
[currently does not support the Cache API](https://docs.deno.com/deploy/api#future-support);
however, Deno KV can be utilized to serve cached images. Set the following
environment variables to enable caching in Deno Deploy, but **use with
caution**. Deno KV is not an ideal blob storage solution and comes with certain
[costs and limitations](https://deno.com/deploy/pricing).

#### Environment Variables

- `FRESH_IMAGES_USE_CACHE` – Enables image caching via
  [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) (when
  available) or Deno KV.
- `FRESH_IMAGES_USE_KV` — When `FRESH_IMAGES_USE_CACHE` is `true`, setting this
  variable to `true` will cache images using
  [kv_toolbox](https://deno.land/x/kv_toolbox@0.0.5)

If `FRESH_IMAGES_USE_CACHE=true` and `FRESH_IMAGES_USE_KV=false`, caching will
not be used on Deno Deploy.

## Optional Build Step

Although [caching is supported](#caching) for images rendered on-the-fly, it is
always faster to load a pre-rendered, static asset when available.

The Fresh images plugin runs the function provided in the `build` property
during
[ahead-of-time builds](https://fresh.deno.dev/docs/concepts/ahead-of-time-builds).
This function receives the same arguments passed to the `ImagesPlugin` instance.

```ts
import type { ImagesPluginOptions } from "fresh_images/src/types.ts";
import ImagesPlugin, { transform } from "fresh_images/mod.ts";
import { ensureDir, join } from "$std/fs/mod.ts";
import { defineConfig } from "$fresh/server.ts";
import { decode, GIF, Image } from "imagescript/mod.ts";

/**
 * Pre-optimize images before serving them.
 */
const myBuildFunction: ImagesPluginOptions["build"] = async ({
  realPath,
}) => {
  const targetDir = realPath ?? "./static";
  const files = Deno.readDir("./static/image");

  await ensureDir(targetDir);

  // Resize all images in the directory
  for await (const file of files) {
    if (!file.isFile) {
      continue;
    }

    const input = await Deno.readFile(`./static/image/${file.name}`);

    const output = await transform(
      await decode(input),
      (img) => Promise.resolve((img as Image).resize(Image.RESIZE_AUTO, 100)),
    );

    // Encode at lowest quality

    if (output instanceof GIF) {
      await Deno.writeFile(
        join(targetDir, file.name),
        await output.encode(30),
      );
      continue;
    }

    await Deno.writeFile(
      join(targetDir, file.name),
      await output.encodeJPEG(1),
    );
  }
};

export default defineConfig({
  plugins: [
    ImagesPlugin({
      build: myBuildFunction,
    }),
  ],
});
```

[View full example](https://github.com/jasonjgardner/fresh-images-demo/blob/main/fresh.config.ts#L37)

## License

MIT
