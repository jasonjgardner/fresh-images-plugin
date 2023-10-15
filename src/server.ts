import { ASSET_CACHE_BUST_KEY } from "$fresh/runtime.ts";
import { get, set } from "https://deno.land/x/kv_toolbox@0.0.5/blob.ts";

export interface ICache {
  init(): Promise<void>;
  get(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
  delete(req: Request): Promise<void>;
}

/**
 * A cache interface that uses the Cache API as a backend.
 * Currently not available on Deno Deploy.
 */
export class CacheStore implements ICache {
  cache?: Cache;
  constructor() {
    if (!caches) {
      throw new Error("Cache API not available");
    }
  }

  async init() {
    this.cache = await caches.open(`fresh-images-${ASSET_CACHE_BUST_KEY}`);
  }

  async get(req: Request) {
    if (!this.cache) {
      throw new Error("Cache API not available");
    }

    const cached = await this.cache.match(req);

    if (!cached) {
      return undefined;
    }

    if (Deno.env.get("FRESH_IMAGES_USE_HEADERS") !== "false") {
      cached.headers.set("x-fresh-images-cache-hit", "true");
      cached.headers.set("x-fresh-images-kv-hit", "false");
    }

    return cached;
  }

  async put(req: Request, res: Response) {
    if (!this.cache) {
      throw new Error("Cache API not available");
    }

    await this.cache.put(req, res.clone());
  }

  async delete(req: Request) {
    if (!this.cache) {
      throw new Error("Cache API not available");
    }

    await this.cache.delete(req);
  }
}

/**
 * A cache interface that uses the Deno KV as a backend.
 * This is not ideal but is available on Deno Deploy.
 */
export class CacheKV implements ICache {
  kv?: Deno.Kv;
  constructor() {
    if (!Deno.openKv) {
      throw new Error("KV API not available");
    }
  }

  /**
   * Initialize the KV store.\
   * Clear old cache entries in the process.
   */
  async init(): Promise<void> {
    this.kv = await Deno.openKv();
    try {
      await this.clearOldCache();
    } catch (err) {
      console.error("Failed to clear old cache: %s", err);
    }
  }

  async get(req: Request) {
    if (!this.kv) {
      throw new Error("KV API not available");
    }

    const data: Uint8Array | null = await get(this.kv, [
      "fresh_images",
      "data",
      ASSET_CACHE_BUST_KEY,
      req.url,
    ]);

    if (!data) {
      return undefined;
    }

    const storedHeaders = await this.kv.get<Headers>([
      "fresh_images",
      "headers",
      ASSET_CACHE_BUST_KEY,
      req.url,
    ]);
    const headers = new Headers();

    if (storedHeaders) {
      for (const [key, value] of Object.entries(storedHeaders.value ?? {})) {
        headers.set(key, value?.toString() ?? "");
      }
    }

    if (!headers.has("content-type")) {
      headers.set("content-type", "image/png");
    }

    if (Deno.env.get("FRESH_IMAGES_USE_HEADERS") !== "false") {
      headers.set("x-fresh-images-cache-hit", "true");
      headers.set("x-fresh-images-kv-hit", "true");
    }

    return new Response(data, { headers });
  }

  async put(req: Request, res: Response) {
    if (!this.kv) {
      throw new Error("KV API not available");
    }

    const data = new Uint8Array(await res.arrayBuffer());
    const entries = res.headers.entries();
    const storedHeaders: Record<string, string> = {};

    for (const [key, value] of entries) {
      storedHeaders[key] = value;
    }

    await set(
      this.kv,
      ["fresh_images", "data", ASSET_CACHE_BUST_KEY, req.url],
      data,
    );
    await this.kv.set(
      ["fresh_images", "headers", ASSET_CACHE_BUST_KEY, req.url],
      storedHeaders,
    );
  }

  async delete(req: Request) {
    if (!this.kv) {
      throw new Error("KV API not available");
    }

    await this.kv.delete([
      "fresh_images",
      "data",
      ASSET_CACHE_BUST_KEY,
      req.url,
    ]);
    await this.kv.delete([
      "fresh_images",
      "headers",
      ASSET_CACHE_BUST_KEY,
      req.url,
    ]);
  }

  async clearOldCache() {
    if (!this.kv) {
      throw new Error("KV API not available");
    }

    const keys = await this.kv.get(["fresh_images", "data"]);

    if (!keys) {
      return;
    }

    const ok = Object.keys(keys.value ?? {});
    for (const key of ok) {
      if (key === ASSET_CACHE_BUST_KEY) {
        continue;
      }

      await this.kv.delete(["fresh_images", "data", key]);
      await this.kv.delete(["fresh_images", "headers", key]);
      console.log("Deleted old cache: %s", key);
    }
  }
}

/**
 * A cache interface that does nothing.
 */
export class CacheNoop implements ICache {
  constructor() {
  }

  async init() {
  }

  async get(_req: Request) {
    return await Promise.resolve(undefined);
  }

  async put(_req: Request, _res: Response) {
  }

  async delete(_req: Request) {
  }
}

/**
 * Get available caching interface.
 * @returns A cache interface determined by the environment.
 */
export async function getCache(): Promise<ICache> {
  if (Deno.env.get("FRESH_IMAGES_USE_CACHE") === "false") {
    console.log("Cache disabled");
    return new CacheNoop();
  }

  let cache: ICache | undefined = undefined;
  let useKv = Deno.env.get("FRESH_IMAGES_USE_KV") !== "false";

  if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
    useKv = useKv !== false;
  }

  try {
    cache = useKv ? new CacheKV() : new CacheStore();
    await cache.init();

    return cache;
  } catch (err) {
    console.error("Cache not available: %s\n", err);
  }

  return new CacheNoop();
}
