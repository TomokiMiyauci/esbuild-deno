import { type Plugin, TsconfigRaw } from "esbuild";

export function mergeTsConfigRawPlugin(
  tsconfigRaw: TsconfigRaw,
): Plugin {
  return {
    name: "merge-tsconfig-raw",
    setup(build) {
      const rootTsconfigRaw = normalizeTsConfigRaw(
        build.initialOptions.tsconfigRaw,
      );

      build.initialOptions.tsconfigRaw = mergeTsConfigRaw(
        tsconfigRaw,
        rootTsconfigRaw,
      );
    },
  };
}

/**
 * @throws {Error}
 */
export function parseTsConfigRaw(input: string): TsconfigRaw {
  let result;

  try {
    result = JSON.parse(input);
  } catch (e) {
    throw new Error("'tsconfigRaw' is invalid JSON format", { cause: e });
  }

  assertTsConfigRaw(result);

  return result;
}

export function assertTsConfigRaw(
  input: unknown,
): asserts input is TsconfigRaw {
  assertType(input, "object", "tsconfigRaw");

  if ("compilerOptions" in input) {
    assertCompilerOptions(input.compilerOptions);
  }
}

export function assertCompilerOptions(
  input: unknown,
): asserts input is TsconfigRaw["compilerOptions"] {
  assertType(input, "object", "tsconfigRaw.compilerOptions");
  assertCompilerOptionsType(input);
  assertCompilerOptionsListValue(input);

  if ("paths" in input) assertPaths(input.paths);
}

function assertType<T extends keyof TypeMap>(
  input: unknown,
  expected: T,
  name: string,
): asserts input is TypeMap[T] {
  const type = input === null
    ? "null"
    : Array.isArray(input)
    ? "array"
    : typeof input;

  if (type !== expected) {
    throw new Error(`'${name}' should be ${expected} but ${type}`);
  }
}

export function assertCompilerOptionsType(
  input: Record<string, unknown>,
): asserts input {
  for (const [key, type] of Object.entries(typeMap)) {
    if (key in input) {
      assertType(input[key], type, `tsconfigRaw.compilerOptions.${key}`);
    }
  }
}

export function assertCompilerOptionsListValue(
  input: Record<string, unknown>,
): asserts input {
  Object.entries(listMap).forEach(([key, list]) => {
    if (key in input) {
      assertOneOf(input[key], list, `tsconfigRaw.compilerOptions.${key}`);
    }
  });
}

export function assertPaths(
  input: unknown,
): asserts input is Record<string, string[]> {
  assertType(input, "object", "tsconfigRaw.compilerOptions.paths");

  for (const [key, value] of Object.entries(input)) {
    assertType(value, "array", `tsconfigRaw.compilerOptions.paths.${key}`);

    for (const [index, item] of Object.entries(value)) {
      assertType(
        item,
        "string",
        `tsconfigRaw.compilerOptions.paths.${key}.${index}`,
      );
    }
  }
}

const typeMap = {
  alwaysStrict: "boolean",
  baseUrl: "string",
  experimentalDecorators: "boolean",
  jsxFactory: "string",
  jsxFragmentFactory: "string",
  jsxImportSource: "string",
  preserveValueImports: "boolean",
  strict: "boolean",
  target: "string",
  useDefineForClassFields: "boolean",
  verbatimModuleSyntax: "boolean",
} satisfies Record<string, keyof TypeMap>;

const listMap = {
  importsNotUsedAsValues: ["remove", "preserve", "error"],
  jsx: ["preserve", "react-native", "react", "react-jsx", "react-jsxdev"],
} satisfies Record<string, unknown[]>;

interface TypeMap {
  string: string;
  boolean: boolean;
  number: number;
  object: Record<string, unknown>;
  null: null;
  array: unknown[];
}

function assertOneOf<T extends keyof TypeMap>(
  input: unknown,
  expected: unknown[],
  name: string,
): asserts input is TypeMap[T] {
  if (!expected.includes(input)) {
    const iter = expected.map(quoted);
    const oneOf = formatter.format(iter);
    const message = `'${name}' should be one of ${oneOf} but ${quoted(input)}`;

    throw new Error(message);
  }
}

const formatter = /* @__PURE__ */ new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

function quoted(input: unknown): string {
  if (typeof input === "string") return `'${input}'`;

  return `${input}`;
}

export function mergeTsConfigRaw(
  left: TsconfigRaw,
  right: TsconfigRaw,
): TsconfigRaw {
  return {
    compilerOptions: { ...left.compilerOptions, ...right.compilerOptions },
  };
}

export function normalizeTsConfigRaw(
  tsconfigRaw: string | TsconfigRaw | undefined,
): TsconfigRaw {
  if (typeof tsconfigRaw === "string") return parseTsConfigRaw(tsconfigRaw);

  if (!tsconfigRaw) return {};

  return tsconfigRaw;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" &&
    value.constructor === Object;
}
