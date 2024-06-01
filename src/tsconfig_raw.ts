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

export function parseTsConfigRaw(input: string): TsconfigRaw {
  return JSON.parse(input);
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
