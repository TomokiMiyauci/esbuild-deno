import type { Plugin, TsconfigRaw } from "esbuild";
import type { CompilerOptions } from "@deno/deno-config";
import { mergeTsConfigRawPlugin } from "./tsconfig_raw.ts";

export type EsbuildCompilerOptions = Exclude<
  TsconfigRaw["compilerOptions"],
  undefined
>;

export function assertCompilerOptions(
  compilerOptions: CompilerOptions,
): asserts compilerOptions is EsbuildCompilerOptions {
  if (compilerOptions.jsx === "precompile") {
    throw new Error(`'jsx' field is invalid. ${compilerOptions.jsx}`);
  }
}

export function initCompilerOptionsPlugin(
  compilerOptions?: CompilerOptions,
): Plugin {
  return {
    name: "init-compiler-options",
    setup(build) {
      if (!compilerOptions) return;

      assertCompilerOptions(compilerOptions);

      return mergeTsConfigRawPlugin({ compilerOptions }).setup(build);
    },
  };
}
