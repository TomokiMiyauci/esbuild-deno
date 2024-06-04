import { toFileUrl } from "@std/path/to-file-url";
import { isAbsolute } from "@std/path/is-absolute";
import { resolve } from "@std/path/resolve";

/**
 * This is only guaranteed to work with the Deno Runtime.
 *
 * You must give the `--allow-read` flag as permission.
 */
export function resolveURL(
  url: URL | string,
  baseDir: string = Deno.cwd(),
): URL {
  if (typeof url !== "string") return url;

  const parsed = URL.parse(url);

  if (parsed) return parsed;

  const path = isAbsolute(url) ? resolve(url) : resolve(baseDir, url);

  return toFileUrl(path);
}
