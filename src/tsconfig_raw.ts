import { type Plugin, TsconfigRaw } from "esbuild";
import { format } from "@miyauci/format";
import { Field, Message } from "./constants.ts";

export function mergeTsconfigRawPlugin(
  tsconfigRaw: TsconfigRaw,
): Plugin {
  return {
    name: "merge-tsconfig-raw",
    setup(build) {
      const rootTsconfigRaw = normalizeTsconfigRaw(
        build.initialOptions.tsconfigRaw,
      );

      build.initialOptions.tsconfigRaw = mergeTsconfigRaw(
        tsconfigRaw,
        rootTsconfigRaw,
      );
    },
  };
}

/**
 * @throws {Error}
 */
export function parseTsconfigRaw(input: string): TsconfigRaw {
  let result;

  try {
    result = JSON.parse(input);
  } catch (e) {
    const message = format(Message.InvalidJson, { name: Field.TsconfigRaw });

    throw new Error(message, { cause: e });
  }

  assertTsconfigRaw(result);

  return result;
}

export function assertTsconfigRaw(
  input: unknown,
): asserts input is TsconfigRaw {
  assertType(input, "object", Field.TsconfigRaw);

  if (Field.CompilerOptions in input) {
    assertCompilerOptions(input.compilerOptions);
  }
}

function dotted(...input: string[]): string {
  return input.join(".");
}

export function assertCompilerOptions(
  input: unknown,
): asserts input is TsconfigRaw["compilerOptions"] {
  assertType(input, "object", dotted(Field.TsconfigRaw, Field.CompilerOptions));
  assertCompilerOptionsType(input);
  assertCompilerOptionsListValue(input);

  if (Field.Paths in input) assertPaths(input.paths);
}

function assertType<T extends keyof TypeMap>(
  input: unknown,
  expected: T,
  name: string,
): asserts input is TypeMap[T] {
  const actual = input === null
    ? "null"
    : Array.isArray(input)
    ? "array"
    : typeof input;

  if (actual !== expected) {
    const message = format(Message.Invalid, { name, expected, actual });

    throw new Error(message);
  }
}

export function assertCompilerOptionsType(
  input: Record<string, unknown>,
): asserts input {
  for (const [key, type] of Object.entries(typeMap)) {
    if (key in input) {
      assertType(
        input[key],
        type,
        dotted(Field.TsconfigRaw, Field.CompilerOptions, key),
      );
    }
  }
}

export function assertCompilerOptionsListValue(
  input: Record<string, unknown>,
): asserts input {
  Object.entries(listMap).forEach(([key, list]) => {
    if (key in input) {
      assertOneOf(
        input[key],
        list,
        dotted(Field.TsconfigRaw, Field.CompilerOptions, key),
      );
    }
  });
}

export function assertPaths(
  input: unknown,
): asserts input is Record<string, string[]> {
  const tsconfigRaw_compilerOptions_paths = dotted(
    Field.TsconfigRaw,
    Field.CompilerOptions,
    Field.Paths,
  );
  assertType(
    input,
    "object",
    tsconfigRaw_compilerOptions_paths,
  );

  for (const [key, value] of Object.entries(input)) {
    const tsconfigRaw_compilerOptions_paths_key = dotted(
      tsconfigRaw_compilerOptions_paths,
      key,
    );

    assertType(
      value,
      "array",
      tsconfigRaw_compilerOptions_paths_key,
    );

    for (const [index, item] of Object.entries(value)) {
      assertType(
        item,
        "string",
        dotted(tsconfigRaw_compilerOptions_paths_key, index),
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
    const message = format(Message.Invalid, {
      name,
      expected: `one of ${oneOf}`,
      actual: quoted(input),
    });

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

export function mergeTsconfigRaw(
  left: TsconfigRaw,
  right: TsconfigRaw,
): TsconfigRaw {
  return {
    compilerOptions: { ...left.compilerOptions, ...right.compilerOptions },
  };
}

export function normalizeTsconfigRaw(
  tsconfigRaw: string | TsconfigRaw | undefined,
): TsconfigRaw {
  if (typeof tsconfigRaw === "string") return parseTsconfigRaw(tsconfigRaw);

  if (!tsconfigRaw) return {};

  return tsconfigRaw;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" &&
    value.constructor === Object;
}
