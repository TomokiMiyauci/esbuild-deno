import { type DenoConfig as _DenoConfig } from "@deno/deno-config";
import { dirname } from "@std/url";
import { resolvePath } from "./utils.ts";
import { toFileUrl } from "@std/path";

export type DenoConfig = Pick<
  _DenoConfig,
  | "compilerOptions"
  | "imports"
  | "scopes"
  | "nodeModulesDir"
  | "importMap"
  | "lock"
>;

export type ImportMap = Pick<DenoConfig, "imports" | "scopes">;

type PartialDenoConfig = Pick<DenoConfig, "imports" | "scopes" | "importMap">;

export interface ResolvedImportMap {
  importMap: ImportMap;
  baseURL: URL;
}

export async function resolveImportMap(
  config: PartialDenoConfig,
  baseURL: URL,
): Promise<ResolvedImportMap | undefined> {
  const { imports, scopes, importMap } = config;

  if (imports || scopes) return { baseURL, importMap: { imports, scopes } };

  if (typeof importMap === "string") {
    const baseDir = dirname(baseURL);
    const absPath = resolvePath(importMap, baseDir.pathname);
    const url = toFileUrl(absPath);

    const text = await Deno.readTextFile(url);
    const json = JSON.parse(text) as ImportMap;

    return {
      baseURL: url,
      importMap: { imports: json.imports, scopes: json.scopes },
    };
  }
}
