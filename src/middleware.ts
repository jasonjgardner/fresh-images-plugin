import type { ImageMiddlewareOptions } from "./types.ts";
import { MiddlewareHandlerContext } from "$fresh/server.ts";

/**
 * Use Deno KV to track and enforce rate limiting.
 * @param req Image request
 * @param ctx Request context
 * @param limit Rate limit
 * @param expireIn Rate limit TTL
 * @returns Image response with headers or an error.
 * @throws Error if Deno KV is not enabled.
 */
async function rateLimit(
  req: Request,
  ctx: MiddlewareHandlerContext,
  limit: number,
  expireIn = 60,
) {
  if (!Deno.openKv) {
    throw new Error("Deno KV must be enabled to use rate limiting.");
  }

  const kv = await Deno.openKv();
  const ip = req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") || ctx.remoteAddr.hostname;

  const key = ["fresh_images", "rate-limit", ip];
  await kv.atomic()
    .check({ key, versionstamp: null })
    .set(key, 0, {
      expireIn,
    })
    .commit();

  await kv.atomic()
    .mutate({
      key,
      type: "sum",
      value: new Deno.KvU64(1n),
    }).commit();

  const currentHits = (await kv.get<Deno.KvU64>(key)).value;
  const difference = limit - Number(currentHits?.value ?? 0);

  if (difference < 0) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const response = await ctx.next();

  if (Deno.env.get("FRESH_IMAGE_USE_HEADERS") !== "false") {
    response.headers.set("x-rate-limit", difference.toString());
  }
  return response;
}

/**
 * Prevent hotlinking and enforce rate limiting.
 * @param req Image request
 * @param ctx Request context
 * @param settings Middleware settings
 * @returns Response that is either the image or an error
 */
export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
  settings?: Partial<ImageMiddlewareOptions>,
) {
  // Prevent hotlinking images
  const { headers } = req;
  const referer = headers.get("referer");
  const host = headers.get("host");

  if (referer && !referer.includes(`//${host}/`)) {
    return new Response("Not allowed", { status: 403 });
  }

  // Enforce rate limiting (Requires Deno KV)
  if (Deno.env.get("FRESH_IMAGE_USE_KV") === "true" && settings?.rateLimit) {
    return await rateLimit(
      req,
      ctx,
      settings?.rateLimit ?? Infinity,
      settings?.rateLimitDuration ?? 60,
    );
  }

  return await ctx.next();
}
