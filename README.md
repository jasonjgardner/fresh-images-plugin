# Fresh Images

**Image manipulation and optimization for
[Fresh](https://github.com/deno/fresh).**

Inspired by [nuxt/image](https://github.com/nuxt/image) and
[next/image](https://nextjs.org/docs/app/building-your-application/optimizing/images).

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

Include the plugin and transformation functions in your `fresh.config.ts` file.

```ts
import { defineConfig } from "$fresh/server.ts";
import ImagesPlugin from "fresh_images/mod.ts";
import { resize, rotate } from "fresh_images/transformer.ts";

export default defineConfig({
  plugins: [
    ImagesPlugin({
      route: "/img",
      realPath: "./static/images",
      transformers: { resize, rotate },
    }),
  ],
});
```

## Usage

Pass image transformation parameters in URL:

```html
<!-- Rotate `./static/images/nyan.gif` 45 degrees and resize it to 500×600px -->
<img src="/img/nyan.gif?fn=rotate&d=45&fn=resize&w=500&h=600" />
```

## License

MIT
