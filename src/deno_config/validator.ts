import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

export function assertDenoConfig(
  input: JsonObject,
): asserts input is DenoConfig & Rest {
  assertDenoRootConfig(input);

  if (input.exclude) assertArrayString(input.exclude, "exclude");
  if (input.compilerOptions) assertCompilerOptions(input.compilerOptions);
  if (input.unstable) assertArrayString(input.unstable, "unstable");
  if (input.workspaces) assertArrayString(input.workspaces, "workspaces");
}

interface Rest {
  [k: string]: never;
}

export function assertCompilerOptions(
  input: JsonObject,
): asserts input is DenoConfig["compilerOptions"] & Rest {
  assertCompilerOptionsType(input);

  if (typeof input.jsx === "string") assertJsx(input.jsx);

  if (input.jsxPrecompileSkipElements) {
    assertArrayString(
      input.jsxPrecompileSkipElements,
      "jsxPrecompileSkipElements",
    );
  }

  if (input.lib) assertArrayString(input.lib, "lib");
}

export function assertArrayString(
  input: JsonValue[],
  name: string,
): asserts input is string[] {
  for (const [key, value] of input.entries()) {
    const type = toType(value);
    if (type !== "string") {
      const cause = Error(`invalid type: ${type}, expected string`);

      throw new Error(`Fail to parse "${name}.${key}"`, { cause });
    }
  }
}

function assertDenoRootConfig(
  input: JsonObject,
): asserts input is DenoRootConfig {
  for (const [key, value] of Object.entries(rootTypeMap)) {
    if (key in input) {
      const type = toType(input[key]!);

      const values = Array.isArray(value) ? value : [value];

      for (const v of values) {
        if (type === v) break;

        const expects = values.join(" or ");
        const cause = Error(`invalid type: ${type}, expected ${expects}`);
        const message = `Failed to parse "${key}" configuration`;

        throw new Error(message, { cause });
      }
    }
  }
}

function toType(input: JsonValue): keyof type {
  if (input === null) return "null";

  switch (typeof input) {
    case "string":
      return "string";

    case "number":
      return "number";

    case "boolean":
      return "boolean";

    default: {
      if (Array.isArray(input)) return "array";

      return "object";
    }
  }
}

const rootTypeMap = {
  compilerOptions: "object",
  importMap: "string",
  imports: "object",
  scopes: "object",
  exclude: "array",
  lint: "object",
  fmt: "object",
  nodeModulesDir: "boolean",
  vendor: "boolean",
  tasks: "object",
  test: "object",
  publish: "object",
  bench: "object",
  lock: ["boolean", "string"],
  unstable: "array",
  name: "string",
  version: "string",
  exports: ["string", "object"],
  workspaces: "array",
} satisfies Record<string, keyof type | (keyof type)[]>;

type RootTypeMap = typeof rootTypeMap;

type DenoRootConfig = {
  [k in keyof RootTypeMap]?: RootTypeMap[k] extends infer U extends keyof type
    ? type[U]
    : RootTypeMap[k] extends infer U extends (keyof type)[] ? type[U[number]]
    : never;
};

type CompilerOptionsType = {
  [k in keyof CompilerOptionsTypeMap]?: type[CompilerOptionsTypeMap[k]];
};

function assertCompilerOptionsType(
  input: JsonObject,
): asserts input is CompilerOptionsType {
  for (const [key, value] of Object.entries(compilerOptionsTypeMap)) {
    if (key in input) {
      const type = toType(input[key]!);

      const values = Array.isArray(value) ? value : [value];

      if (values.some((v) => v === type)) break;

      const expects = values.join(" or ");
      const cause = Error(`invalid type: ${type}, expected ${expects}`);
      const message = `Failed to parse "${key}" configuration`;

      throw new Error(message, { cause });
    }
  }
}

type CompilerOptionsTypeMap = typeof compilerOptionsTypeMap;

const compilerOptionsTypeMap = {
  allowJs: "boolean",
  allowUnreachableCode: "boolean",
  allowUnusedLabels: "boolean",
  checkJs: "boolean",
  exactOptionalPropertyTypes: "boolean",
  experimentalDecorators: "boolean",
  jsx: "string",
  jsxFactory: "string",
  jsxFragmentFactory: "string",
  jsxImportSource: "string",
  jsxImportSourceTypes: "string",
  jsxPrecompileSkipElements: "array",
  keyofStringsOnly: "boolean",
  lib: "array",
  noErrorTruncation: "boolean",
  noFallthroughCasesInSwitch: "boolean",
  noImplicitAny: "boolean",
  noImplicitOverride: "boolean",
  noImplicitReturns: "boolean",
  noImplicitThis: "boolean",
  noImplicitUseStrict: "boolean",
  noStrictGenericChecks: "boolean",
  noUnusedLocals: "boolean",
  noUnusedParameters: "boolean",
  noUncheckedIndexedAccess: "boolean",
  strict: "boolean",
  strictBindCallApply: "boolean",
  strictFunctionTypes: "boolean",
  strictPropertyInitialization: "boolean",
  strictNullChecks: "boolean",
  suppressExcessPropertyErrors: "boolean",
  suppressImplicitAnyIndexErrors: "boolean",
} satisfies Record<string, keyof type>;

type Jsx = "react-jsx" | "react-jsxdev" | "react" | "precompile";

const jsx = new Set<string>([
  "precompile",
  "react",
  "react-jsx",
  "react-jsxdev",
]);
export function assertJsx(input: string): asserts input is Jsx {
  if (!jsx.has(input)) {
    throw new Error(
      `Unsupported 'jsx' compiler option value '${input}'. Supported: 'react-jsx', 'react-jsxdev', 'react', 'precompile'`,
    );
  }
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

interface JsonObject {
  [k: string]: JsonValue;
}

interface type {
  array: JsonValue[];
  string: string;
  object: JsonObject;
  boolean: boolean;
  null: null;
  number: number;
}
