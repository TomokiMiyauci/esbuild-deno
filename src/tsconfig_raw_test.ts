import {
  assertTsconfigRaw,
  JsonObject,
  mergeTsconfigRaw,
  mergeTsconfigRawPlugin,
  normalizeTsconfigRaw,
  parseTsconfigRaw,
} from "./tsconfig_raw.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
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

  it("should throw error if input is not object", () => {
    expect(() => parseTsconfigRaw(`[]`)).toThrow();
  });

  it("should return object", () => {
    expect(parseTsconfigRaw("{}")).toEqual({});
  });
});

describe("assertTsconfigRaw", () => {
  it("should throw error if input.compilerOptions is invalid", () => {
    const table: JsonObject[] = [
      { compilerOptions: "" },
      { compilerOptions: { jsx: 0 } },
      { compilerOptions: { paths: false } },
      { compilerOptions: { paths: { "": false } } },
      { compilerOptions: { paths: { "": [false] } } },
    ];

    for (const input of table) {
      expect(() => assertTsconfigRaw(input)).toThrow();
    }
  });

  it("should do anything if input is valid", () => {
    expect(assertTsconfigRaw({})).toBeFalsy();
    expect(assertTsconfigRaw({ compilerOptions: {} })).toBeFalsy();
    expect(
      assertTsconfigRaw({ compilerOptions: { paths: { "./": ["main"] } } }),
    ).toBeFalsy();
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
