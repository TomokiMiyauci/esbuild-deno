import {
  instantiate,
  type ParsedResult as _ParsedResult,
  parseImportMap as _parseImportMap,
} from "./import_map_wasm.generated.js";

await instantiate();

export interface ParsedResult {
  importMap: ImportMap;
  warnings: string[];
}

export interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

function toRecord(
  map: Map<string, string | undefined>,
): Record<string, string> {
  return [...map].reduce(
    (acc: Record<string, string>, [key, value]) => {
      if (typeof value === "string") {
        acc[key] = value;
      }

      return acc;
    },
    {},
  );
}

export function parseImportMap(input: string, url: URL | string): ParsedResult {
  const { warnings, import_map } = _parseImportMap(
    input,
    url.toString(),
  ) as _ParsedResult;

  const imports = toRecord(import_map.imports);
  const scopes = [...import_map.scopes].reduce(
    (acc: Record<string, Record<string, string>>, [key, scope]) => {
      acc[key] = toRecord(scope);

      return acc;
    },
    {},
  );
  const importMap = { imports, scopes } satisfies ImportMap;

  return { importMap, warnings };
}
