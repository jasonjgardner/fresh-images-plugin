import { defineConfig } from "$fresh/server.ts";
import ImagesPlugin, {
  extendKeyMap,
  getParam,
  transform,
} from "fresh_images/mod.ts";
import { crop, resize, rotate } from "fresh_images/transformer.ts";
import { GIF, Image } from "imagescript/mod.ts";

/**
 * Custom transformer example.
 * Rotate an image hue by a random number of degrees. Optionally accept a query parameter to invert the hue.
 */
const myTransformer = (img: Image | GIF, req: Request) => {
  const randomDegrees = Math.floor(Math.random() * 360);

  const invert = getParam(req, "invert", extendKeyMap({ invert: "i" }));

  if (invert) {
    return transform(img, (img) => (img as Image).invertHue());
  }

  return transform(img, (img) => (img as Image).hueShift(randomDegrees));
};

export default defineConfig({
  plugins: [
    ImagesPlugin({
      route: "/img",
      transformers: {
        resize,
        rotate,
        crop,
        cool: myTransformer,
        withRoute: {
          path: "/desaturated",
          handler: (img: Image | GIF) =>
            transform(img, (img) => (img as Image).saturation(0.25, true)),
        },
      },
    }),
  ],
});
