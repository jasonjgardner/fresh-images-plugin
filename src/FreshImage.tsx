import type { JSX } from "preact";
import { useSignal } from "@preact/signals";

export default function FreshImage(
  props: JSX.HTMLAttributes<HTMLImageElement>,
) {
  const { src, alt, ...rest } = props;

  const isLoaded = useSignal(false);

  return (
    <div className="fresh-image">
      {!isLoaded && <div className="fresh-image__placeholder" />}
      <img
        className="fresh-image__image"
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
