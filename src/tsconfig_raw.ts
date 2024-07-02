import { type Plugin, TsconfigRaw } from "esbuild";
import { format } from "@miyauci/format";
import {
  and,
  array,
  assert,
  boolean,
  iter,
  object,
  or,
  partial,
  record,
  string,
  type Validator,
  value,
} from "@miyauci/validator";
import { Field, Message } from "./constants.ts";
import { isObject } from "./utils.ts";

export interface JsonObject {
  [k: string]: JsonValue;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

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
  let result: JsonValue;

  try {
    result = JSON.parse(input);
  } catch (e) {
    const message = format(Message.InvalidJson, { name: Field.TsconfigRaw });

    throw new Error(message, { cause: e });
  }

  if (!isObject(result)) {
    throw new Error(Message.InvalidJsonType);
  }

  assertTsconfigRaw(result);

  return result;
}

const importsNotUsedAsValues = or(
  value("remove"),
  value("preserve"),
  value("error"),
);

const jsx = or(
  value("preserve"),
  value("react-native"),
  value("react"),
  value("react-jsx"),
  value("react-jsxdev"),
);

const strArray = and(
  array,
  // deno-lint-ignore no-explicit-any
  iter(string) as any as Validator<unknown[], string[]>,
);

const compilerOptions = partial<NonNullable<TsconfigRaw["compilerOptions"]>>({
  alwaysStrict: boolean,
  baseUrl: string,
  experimentalDecorators: boolean,
  importsNotUsedAsValues,
  jsx,
  jsxFactory: string,
  jsxFragmentFactory: string,
  jsxImportSource: string,
  paths: and(object, record(string, strArray)),
  preserveValueImports: boolean,
  strict: boolean,
  target: string,
  useDefineForClassFields: boolean,
  verbatimModuleSyntax: boolean,
});

const tsconfigRaw = partial<TsconfigRaw>({
  compilerOptions: and(object, compilerOptions),
});

export function assertTsconfigRaw(
  input: JsonObject,
): asserts input is TsconfigRaw & { [k: string]: JsonValue } {
  assert(input, tsconfigRaw);
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
