import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";
import {
  array,
  assert,
  boolean,
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

const imports = record(string(), string());
const scopes = record(string(), imports);
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
  tasks: record(string(), string()),
  test,
  publish,
  bench,
  lock: or(string(), boolean()),
  unstable: array(string()),
  name: string(),
  version: string(),
  exports: or(string(), record(string(), string())),
  workspaces: array(string()),
}) satisfies Validator<unknown, DenoConfig>;

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
