import {
  assertCompilerOptions,
  assertCompilerOptionsListValue,
  assertCompilerOptionsType,
  assertPaths,
  assertTsconfigRaw,
  mergeTsconfigRaw,
  mergeTsconfigRawPlugin,
  normalizeTsconfigRaw,
  parseTsconfigRaw,
} from "./tsconfig_raw.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { type JsonValue } from "@std/jsonc";
import { build, stop, type TsconfigRaw } from "esbuild";

describe("mergeTsconfigRawPlugin", () => {
  it("should initialize tsconfigRaw before resolving", async () => {
    await build({
      stdin: { contents: `` },
      plugins: [
        mergeTsconfigRawPlugin({
          compilerOptions: { alwaysStrict: false, jsx: "react-jsx" },
        }),
        {
          name: "testing",
          setup(build) {
            build.onStart(() => {
              expect(build.initialOptions.tsconfigRaw).toEqual({
                compilerOptions: {
                  alwaysStrict: true,
                  jsx: "react-jsx",
                },
              });
            });
          },
        },
      ],
      platform: "node",
      write: false,
      bundle: true,
      tsconfigRaw: { compilerOptions: { alwaysStrict: true } },
    });

    await stop();
  });
});

describe("parseTsconfigRaw", () => {
  it("should throw error if the input is invalid JSON format", () => {
    expect(() => parseTsconfigRaw("")).toThrow();
  });

  it("should return object", () => {
    expect(parseTsconfigRaw("{}")).toEqual({});
  });
});

describe("assertTsconfigRaw", () => {
  it("should throw error if input is not object", () => {
    expect(() => assertTsconfigRaw("")).toThrow();
  });

  it("should throw error if input.compilerOptions is invalid", () => {
    expect(() => assertTsconfigRaw({ compilerOptions: "" })).toThrow();
  });

  it("should do anything if input is valid", () => {
    expect(assertTsconfigRaw({})).toBeFalsy();
    expect(assertTsconfigRaw({ compilerOptions: {} })).toBeFalsy();
  });
});

describe("assertCompilerOptions", () => {
  it("should throw error if input is not object", () => {
    expect(() => assertCompilerOptions("")).toThrow();
  });

  it("should throw error if input is invalid", () => {
    expect(() => assertCompilerOptions({ jsx: 0 })).toThrow();
  });

  it("should do anything if input is valid", () => {
    expect(assertCompilerOptions({})).toBeFalsy();
    expect(assertCompilerOptions({ paths: { "./": ["main"] } })).toBeFalsy();
  });
});

describe("assertCompilerOptionsType", () => {
  type Type = "string" | "boolean";

  function getTypeValue(type: Type): string | boolean {
    switch (type) {
      case "boolean":
        return false;
      case "string":
        return "";
    }
  }

  function getUnTypeValues(type: Type): JsonValue[] {
    switch (type) {
      case "boolean":
        return ["", 0, null, {}, []];
      case "string":
        return [0, false, null, {}, []];
    }
  }

  it("should only be passed for specific types", () => {
    const table: [key: string, value: "boolean" | "string"][] = [
      ["alwaysStrict", "boolean"],
      ["baseUrl", "string"],
      ["experimentalDecorators", "boolean"],
      ["jsxFactory", "string"],
      ["jsxFragmentFactory", "string"],
      ["jsxImportSource", "string"],
      ["preserveValueImports", "boolean"],
      ["strict", "boolean"],
      ["target", "string"],
      ["useDefineForClassFields", "boolean"],
      ["verbatimModuleSyntax", "boolean"],
    ];

    table.forEach(([key, type]) => {
      const value = getTypeValue(type);

      expect(assertCompilerOptionsType({ [key]: value })).toBeFalsy();
    });

    table.forEach(([key, type]) => {
      const values = getUnTypeValues(type);

      for (const value of values) {
        expect(() => assertCompilerOptionsType({ [key]: value })).toThrow();
      }
    });
  });
});

describe("assertCompilerOptionsListValue", () => {
  it("should throw error if the key is importsNotUsedAsValues and value is invalid", () => {
    expect(() => assertCompilerOptionsListValue({ importsNotUsedAsValues: 0 }))
      .toThrow();
  });

  it("should return void if the key is importsNotUsedAsValues and value is valid", () => {
    const table = ["remove", "preserve", "error"];

    for (const value of table) {
      expect(assertCompilerOptionsListValue({ importsNotUsedAsValues: value }))
        .toBeFalsy();
    }
  });

  it("should throw error if the key is jsx and value is invalid", () => {
    expect(() => assertCompilerOptionsListValue({ jsx: "" }))
      .toThrow();
  });

  it("should return void if the key is jsx and value is valid", () => {
    const table = [
      "react",
      "react-jsx",
      "react-native",
      "react-jsxdev",
      "preserve",
    ];

    for (const value of table) {
      expect(assertCompilerOptionsListValue({ jsx: value }))
        .toBeFalsy();
    }
  });
});

describe("assertPaths", () => {
  it("should throw error if input is not object", () => {
    expect(() => assertPaths("")).toThrow();
  });

  it("should throw error if value of input is not array", () => {
    expect(() => assertPaths({ "": "" })).toThrow();
  });

  it("should throw error if input items contain other than string", () => {
    expect(() => assertPaths({ "": [0] })).toThrow();
    expect(() => assertPaths({ "": [null] })).toThrow();
  });

  it("should return void if input is valid", () => {
    expect(assertPaths({ "": [] })).toBeFalsy();
    expect(assertPaths({ "": [""] })).toBeFalsy();
    expect(assertPaths({ "": ["", "a", "b", "c"] })).toBeFalsy();
    expect(assertPaths({ "a": ["", "a", "b", "c"], "b": ["d", "e", "f"] }))
      .toBeFalsy();
  });
});

describe("normalizeTsconfigRaw", () => {
  it("should return empty object if input is undefined", () => {
    expect(normalizeTsconfigRaw(undefined)).toEqual({});
  });

  it("should return parsed object if input is string", () => {
    expect(normalizeTsconfigRaw(`{ "compilerOptions": { "jsx": "react" } }`))
      .toEqual({ compilerOptions: { jsx: "react" } });
  });

  it("should return same if input is object", () => {
    const input = {};
    expect(normalizeTsconfigRaw(input)).toBe(input);
  });
});

describe("mergeTsconfigRaw", () => {
  it("should be merged shallow with priority given to the right", () => {
    const table: [TsconfigRaw, TsconfigRaw, TsconfigRaw][] = [
      [{}, {}, { compilerOptions: {} }],
      [{ compilerOptions: {} }, {}, { compilerOptions: {} }],
      [{}, { compilerOptions: {} }, { compilerOptions: {} }],
      [{ compilerOptions: {} }, { compilerOptions: {} }, {
        compilerOptions: {},
      }],
      [{ compilerOptions: { jsx: "preserve" } }, { compilerOptions: {} }, {
        compilerOptions: { jsx: "preserve" },
      }],
      [{ compilerOptions: { jsx: "preserve" } }, {
        compilerOptions: { jsx: "react-jsx" },
      }, {
        compilerOptions: { jsx: "react-jsx" },
      }],
      [{ compilerOptions: { jsx: "preserve" } }, {
        compilerOptions: { importsNotUsedAsValues: "error" },
      }, {
        compilerOptions: { jsx: "preserve", importsNotUsedAsValues: "error" },
      }],
      [{ compilerOptions: { paths: { a: [] } } }, {
        compilerOptions: { paths: { b: [] } },
      }, {
        compilerOptions: { paths: { b: [] } },
      }],
    ];

    table.forEach(([left, right, expected]) => {
      expect(mergeTsconfigRaw(left, right)).toEqual(expected);
    });
  });
});
