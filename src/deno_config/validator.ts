import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";
import {
  and,
  array,
  assert,
  boolean,
  object,
  or,
  partial,
  record,
  string,
  Validator,
  value,
} from "@miyauci/validator";

const jsx = or(
  value("preserve"),
  value("react"),
  value("react-jsx"),
  value("react-jsxdev"),
  value("react-native"),
  value("precompile"),
);

const compilerOptions = partial({
  allowJs: boolean(),
  allowUnreachableCode: boolean(),
  allowUnusedLabels: boolean(),
  checkJs: boolean(),
  exactOptionalPropertyTypes: boolean(),
  experimentalDecorators: boolean(),
  jsx,
  jsxFactory: string(),
  jsxFragmentFactory: string(),
  jsxImportSource: string(),
  jsxImportSourceTypes: string(),
  jsxPrecompileSkipElements: array(string()),
  keyofStringsOnly: boolean(),
  lib: array(string()),
  noErrorTruncation: boolean(),
  noFallthroughCasesInSwitch: boolean(),
  noImplicitAny: boolean(),
  noImplicitOverride: boolean(),
  noImplicitReturns: boolean(),
  noImplicitThis: boolean(),
  noImplicitUseStrict: boolean(),
  noStrictGenericChecks: boolean(),
  noUnusedLocals: boolean(),
  noUnusedParameters: boolean(),
  noUncheckedIndexedAccess: boolean(),
  strict: boolean(),
  strictBindCallApply: boolean(),
  strictFunctionTypes: boolean(),
  strictPropertyInitialization: boolean(),
  strictNullChecks: boolean(),
  suppressExcessPropertyErrors: boolean(),
  suppressImplicitAnyIndexErrors: boolean(),
});

const recordStr = record(string(), string());
const imports = and(object(), recordStr);
const scopes = and(object(), record(string(), imports));
const lint = partial({});
const fmt = partial({});
const test = partial({});
const publish = partial({});
const bench = partial({});

const denoConfig = partial({
  compilerOptions,
  importMap: string(),
  imports,
  scopes,
  exclude: array(string()),
  lint,
  fmt,
  nodeModulesDir: boolean(),
  vendor: boolean(),
  tasks: and(object(), recordStr),
  test,
  publish,
  bench,
  lock: or<unknown, string | boolean>(string(), boolean()),
  unstable: array(string()),
  name: string(),
  version: string(),
  exports: or<unknown, string | Record<string, string>>(
    string(),
    and(object(), recordStr),
  ),
  workspaces: array(string()),
}) satisfies Validator<object, DenoConfig>;

export function assertDenoConfig(
  input: JsonObject,
): asserts input is DenoConfig & Rest {
  assert(input, denoConfig);
}

interface Rest {
  [k: string]: never;
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
