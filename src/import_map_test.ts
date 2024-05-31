import {
  embedImportMaps,
  embedImports,
  insertString,
  normalizeSpecifier,
  trailingSlash,
} from "./import_map.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";

describe("embedImports", () => {
  it("should return same values", () => {
    const table: [Record<string, string>, Record<string, string>][] = [
      [{}, {}],
      [{ "": "" }, { "": "" }],
      [{ "a": "npm:a", "a/": "npm:/a/" }, { "a": "npm:a", "a/": "npm:/a/" }],
      [{ "a/": "npm:a/" }, { "a/": "npm:a/" }],
      [{ "a": "http:a" }, { "a": "http:a" }],
    ];

    table.forEach(([imports, expected]) => {
      expect(embedImports(imports)).toEqual(expected);
    });
  });

  it("should return same values", () => {
    const table: [Record<string, string>, Record<string, string>][] = [
      [{ "a": "npm:a" }, { "a": "npm:a", "a/": "npm:/a/" }],
      [{ "a": "npm:/a" }, { "a": "npm:/a", "a/": "npm:/a/" }],
      [{ "a": "npm:/a/" }, { "a": "npm:/a/", "a/": "npm:/a/" }],
      [{ "a": "npm:/a///" }, { "a": "npm:/a///", "a/": "npm:/a/" }],
      [{ "a": "jsr:a" }, { "a": "jsr:a", "a/": "jsr:/a/" }],
      [{ "a": "jsr:a/b" }, { "a": "jsr:a/b", "a/": "jsr:/a/b/" }],
    ];

    table.forEach(([imports, expected]) => {
      expect(embedImports(imports)).toEqual(expected);
    });
  });
});

describe("embedImportMaps", () => {
  it("should return same value", () => {
    const table: Record<string, Record<string, unknown>>[] = [
      {},
      { a: {} },
      { scopes: {} },
      { scopes: { "": "" } },
      { scopes: { "": {} } },
      { scopes: { "": { "": "" } } },
    ];
    table.forEach((importMap) => {
      expect(embedImportMaps(importMap)).toBe(importMap);
    });
  });

  it("should embed imports", () => {
    const table: [Record<string, Record<string, unknown>>, unknown][] = [
      [{ imports: {} }, { imports: {} }],
      [{ imports: { "a": "npm:a" } }, {
        imports: { "a": "npm:a", "a/": "npm:/a/" },
      }],
      [{ imports: { "a": "npm:a", "a/": "npm:/a/" } }, {
        imports: { "a": "npm:a", "a/": "npm:/a/" },
      }],
    ];
    table.forEach(([importMap, expected]) => {
      expect(embedImportMaps(importMap)).toEqual(expected);
    });
  });
});

describe("normalizeSpecifier", () => {
  it("should return same values", () => {
    const table: [string, string][] = [
      ["", ""],
      ["npm:pkg", "npm:/pkg"],
      ["npm:pkg/", "npm:/pkg"],
      ["npm:pkg///", "npm:/pkg"],
      ["npm:pkg/a", "npm:/pkg/a"],
      ["npm:pkg/a/", "npm:/pkg/a"],
      ["npm:pkg/a/b/c///", "npm:/pkg/a/b/c"],
      ["npm:/", "npm:/"],
      ["npm:/a", "npm:/a"],
      [":", ":/"],
      [":/", ":/"],
      [":///", ":/"],
    ];

    table.forEach(([specifier, expected]) => {
      expect(normalizeSpecifier(specifier)).toEqual(expected);
    });
  });
});

describe("trailingSlash", () => {
  it("should return string what is not end with slash", () => {
    const table: [string, string][] = [
      ["", ""],
      ["/", ""],
      ["///", ""],
      ["/a", "/a"],
      ["/a/", "/a"],
      ["/a//", "/a"],
      ["/a///", "/a"],
    ];

    table.forEach(([input, expected]) => {
      expect(trailingSlash(input)).toBe(expected);
    });
  });
});

describe("insertString", () => {
  it("should return inserted string", () => {
    expect(insertString("abcefg", 3, "d")).toBe("abcdefg");
  });
});
