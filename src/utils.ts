import { resolve, toFileUrl } from "@std/path";

/**
 * This is only guaranteed to work with the Deno Runtime.
 *
 * You must give the `--allow-read` flag as permission.
 */
export function resolveURL(url: URL | string): URL {
  if (typeof url !== "string") return url;

  const parsed = URL.parse(url);

  if (parsed) return parsed;

  const path = resolve(url);

  return toFileUrl(path);
}
