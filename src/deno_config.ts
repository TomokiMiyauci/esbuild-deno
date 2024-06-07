import { type DenoConfig as _DenoConfig } from "@deno/deno-config";
import { dirname } from "@std/url/dirname";
import { toFileUrl } from "@std/path/to-file-url";
import { format } from "@miyauci/format";
import { join } from "@std/path/join";
import { resolvePath } from "./utils.ts";
import { Message } from "./constants.ts";

export type DenoConfig = Pick<
  _DenoConfig,
  | "compilerOptions"
  | "imports"
  | "scopes"
  | "nodeModulesDir"
  | "importMap"
  | "lock"
>;

type PartialDenoConfig = Pick<DenoConfig, "imports" | "scopes" | "importMap">;

export interface ResolvedImportMap {
  source: string;
  baseURL: URL;
}

export async function resolveImportMap(
  config: PartialDenoConfig,
  baseURL: URL,
): Promise<ResolvedImportMap | undefined> {
  const { imports, scopes, importMap } = config;

  if (imports || scopes) {
    return { baseURL, source: JSON.stringify({ imports, scopes }) };
  }

  if (typeof importMap === "string") {
    const baseDir = dirname(baseURL);
    const absPath = resolvePath(importMap, baseDir.pathname);
    const url = toFileUrl(absPath);

    try {
      const source = await Deno.readTextFile(url);

      return { source, baseURL: url };
    } catch (e) {
      const message = format(Message.FailResolveImportMap, { url });

      throw new Error(message, { cause: e });
    }
  }
}

export interface ResolveLockContext {
  cwd: string;
  configDir: string;
}

export function resolveLock(
  lock: string | boolean | undefined,
  context: ResolveLockContext,
): string | undefined {
  const { cwd, configDir } = context;

  if (typeof lock === "string") return resolvePath(lock, configDir);

  if (lock === false) return undefined;

  return join(cwd, "deno.lock");
}
