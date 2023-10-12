import type { JSX } from "preact";
import { useSignal } from "@preact/signals";
import { Head, IS_BROWSER } from "$fresh/runtime.ts";

export interface FreshImageProps extends JSX.HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  preload?: string;
}

export default function FreshImage(
  props: FreshImageProps,
) {
  const { src, alt, preload, ...rest } = props;

  if (!IS_BROWSER && preload) {
    return (
      <Head>
        <link href={src} rel="preload" as="image" />
      </Head>
    );
  }

  const isLoaded = useSignal(false);

  return (
    <div class="fresh-image">
      {!isLoaded.value && <div class="fresh-image__placeholder" />}
      <img
        class="fresh-image__image"
        src={src}
        alt={alt}
        onLoad={() => {
          isLoaded.value = true;
        }}
        {...rest}
      />
    </div>
  );
}
