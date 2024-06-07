import { type DenoConfig as _DenoConfig } from "@deno/deno-config";
import { dirname } from "@std/url/dirname";
import { toFileUrl } from "@std/path/to-file-url";
import { format } from "@miyauci/format";
import { type ParsedResult, parseImportMap } from "@deno/import-map";
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

export interface ResolvedImportMap extends ParsedResult {
  baseURL: URL;
}

export async function resolveImportMap(
  config: PartialDenoConfig,
  baseURL: URL,
): Promise<ResolvedImportMap | undefined> {
  const { imports, scopes, importMap } = config;

  if (imports || scopes) {
    return { baseURL, importMap: { imports, scopes }, warnings: [] };
  }

  if (typeof importMap === "string") {
    const baseDir = dirname(baseURL);
    const absPath = resolvePath(importMap, baseDir.pathname);
    const url = toFileUrl(absPath);

    let text: string;

    try {
      text = await Deno.readTextFile(url);
    } catch (e) {
      const message = format(Message.FailResolveImportMap, { url });

      throw new Error(message, { cause: e });
    }

    return { ...parseImportMap(text, url), baseURL: url };
  }
}
