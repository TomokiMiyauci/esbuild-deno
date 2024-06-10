import { format } from "@miyauci/format";
import { dirname, join, toFileUrl } from "@std/path";
import { Message } from "./constants.ts";
import { parseDenoConfig } from "./parser.ts";
import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

export { DenoConfig };

export async function readDenoConfig(url: URL): Promise<DenoConfig> {
  let denoConfigText: string;

  try {
    denoConfigText = await Deno.readTextFile(url);
  } catch (e) {
    const message = format(Message.FailReadConfig, { url });

    throw new Error(message, { cause: e });
  }

  return parseDenoConfig(denoConfigText, url);
}

const files = new Set<string>(["deno.json", "deno.jsonc"]);

export type AbsolutePath = `/${string}`;

export interface FoundResult {
  config: DenoConfig;
  path: AbsolutePath;
}

export async function findDenoConfig(
  rootDir: AbsolutePath,
): Promise<FoundResult | undefined> {
  for (const path of getDenoConfigPaths(rootDir)) {
    const url = toFileUrl(path);

    let source: string;

    try {
      source = await Deno.readTextFile(url);
    } catch {
      continue;
    }

    const config = parseDenoConfig(source, url);

    return { path: path as AbsolutePath, config };
  }
}

export function* getDenoConfigPaths(basePath: string): Iterable<string> {
  const y = new Yielder();

  for (const file of files) {
    const path = join(basePath, file);

    yield* y.yieldOr(path);
  }

  const parentDirPath = dirname(basePath);

  for (const file of files) {
    const path = join(parentDirPath, file);

    yield* y.yieldOr(path);
  }
}

class Yielder {
  #yielded = new Set();

  *yieldOr<T>(input: T): Generator<T> {
    if (this.#yielded.has(input)) return;

    this.#yielded.add(input);

    yield input;
  }
}
