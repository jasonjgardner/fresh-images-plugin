import type { JSX } from "preact";
import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Head, IS_BROWSER } from "$fresh/runtime.ts";
import { asset } from "../runtime.ts";

/**
 * An image component that applies transformation parameters.
 */
export interface FreshImageProps extends JSX.HTMLAttributes<HTMLImageElement> {
  /**
   * The path to the image.
   */
  src: string;
  /**
   * Required alt text for the image.
   */
  alt: string;

  /**
   * Construct a URL with query parameters for the image.
   */
  transformations?: Record<string, string> | Array<Record<string, string>>;

  /**
   * Whether to preload the image. Enabled when a truthy string is provided.\
   * Disabled when `undefined`, "off", or "false".
   */
  preload?: string;

  /**
   * Callback when the image loads.
   */
  onLoad?: () => void;

  placeholder?: string;
}

/**
 * Wrapper for an image with transformations applied to its source URL.
 * @param props {@link FreshImageProps}
 * @returns Image component
 */
export default function FreshImage(
  props: FreshImageProps,
) {
  const {
    src,
    alt,
    preload,
    onLoad,
    transformations,
    placeholder,
    class: className,
    ...rest
  } = props;

  // Apply transformations to the image URL, or use the original URL if no transformations are provided.
  const xformSrc = transformations ? asset(src, transformations) : asset(src);

  // Preload the image if requested. Use sparingly.
  if (!IS_BROWSER && preload && preload !== "off" && preload !== "false") {
    return (
      <Head>
        <link href={xformSrc} rel="preload" as="image" />
      </Head>
    );
  }

  const imgRef = useRef<HTMLImageElement | null>(null);
  const isLoaded = useSignal(false);

  return (
    <div class={`fresh-image ${className}`}>
      {placeholder !== undefined && IS_BROWSER && !isLoaded.value && (
        <img class="fresh-image__placeholder" src={placeholder} alt={alt} />
      )}
      <img
        class="fresh-image__image"
        src={xformSrc}
        alt={alt}
        onLoad={() => {
          isLoaded.value = true;

          if (imgRef.current) {
            imgRef.current.width = imgRef.current.width ??
              imgRef.current.naturalWidth;
            imgRef.current.height = imgRef.current.height ??
              imgRef.current.naturalHeight;
          }

          onLoad?.();
        }}
        {...rest}
        ref={imgRef}
      />
    </div>
  );
}
