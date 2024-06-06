import type { Plugin, TsconfigRaw } from "esbuild";
import type { DenoConfig } from "./deno_config.ts";
import { mergeTsconfigRawPlugin } from "./tsconfig_raw.ts";
import { format } from "@miyauci/format";
import { Message } from "./constants.ts";

export type CompilerOptions = Exclude<DenoConfig["compilerOptions"], undefined>;

export type EsbuildCompilerOptions = Exclude<
  TsconfigRaw["compilerOptions"],
  undefined
>;

export function assertCompilerOptions(
  compilerOptions: CompilerOptions,
): asserts compilerOptions is EsbuildCompilerOptions {
  if (compilerOptions.jsx === "precompile") {
    const message = format(Message.NotSupported, {
      name: "compilerOptions.jsx",
      actual: "'precompile'",
    });

    throw new Error(message);
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

      return mergeTsconfigRawPlugin({ compilerOptions }).setup(build);
    },
  };
}
