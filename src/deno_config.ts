import { type DenoConfig } from "@deno/deno-config";
import { dirname } from "@std/url";
import { resolveURL } from "./utils.ts";

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
    const url = resolveURL(importMap, baseDir.pathname);

    const res = await fetch(url);
    const json = await res.json() as ImportMap;

    return {
      baseURL: url,
      importMap: { imports: json.imports, scopes: json.scopes },
    };
  }
}
