import { asset as freshAsset } from "$fresh/runtime.ts";

// deno-lint-ignore no-explicit-any
export function createUrlParams(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const key in obj) {
    params.set(key, obj[key]);
  }

  return params.toString();
}

export function asset(
  path: string,
  transformations?: Record<string, string> | Array<Record<string, string>>,
): string {
  if (!transformations) {
    return freshAsset(path);
  }

  if (Array.isArray(transformations)) {
    return freshAsset(
      `${path}?${transformations.map(createUrlParams).join("&")}`,
    );
  }

  return freshAsset(`${path}?${createUrlParams(transformations)}`);
}
