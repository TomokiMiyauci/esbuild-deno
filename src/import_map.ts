export function embedImports(
  imports: Record<string, string>,
): Record<string, string> {
  const newImports = Object.entries(imports).reduce(
    (acc: [string, string][], [specifier, target]) => {
      acc.push([specifier, target]);

      if (
        !specifier.endsWith("/") &&
        !imports[specifier + "/"] &&
        (target.startsWith("jsr:") || target.startsWith("npm:"))
      ) {
        const normalized = normalizeSpecifier(target);
        const newSpecifier = specifier + "/";
        const newTarget = normalized + "/";

        acc.push([newSpecifier, newTarget]);
      }

      return acc;
    },
    [],
  );

  return Object.fromEntries(newImports);
}

export function trailingSlash(input: string): string {
  return input.replace(/\/*$/g, "");
}

export function normalizeSpecifier(specifier: string): string {
  specifier = trailingSlash(specifier);

  const indexOfColon = specifier.indexOf(":");

  if (-1 < indexOfColon) {
    const indexOfSlash = indexOfColon + 1;

    if (specifier[indexOfSlash] !== "/") {
      specifier = insertString(specifier, indexOfSlash, "/");
    }
  }

  return specifier;
}

export function insertString(
  input: string,
  pos: number,
  value: string,
): string {
  const before = input.slice(0, pos);
  const after = input.slice(pos);

  return before + value + after;
}

export interface ImportMapLike {
  imports?: Record<string, string>;
}

export function embedImportMaps<T>(
  importMap: ImportMapLike & T,
): ImportMapLike & T {
  if (!importMap.imports) return importMap;

  const imports = embedImports(importMap.imports);

  return { ...importMap, imports };
}
