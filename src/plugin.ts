import { denoSpecifierPlugin } from "@miyauci/esbuild-deno-specifier";
import { type Plugin } from "esbuild";
import {
  importMapPlugin,
  type ImportMapPluginArgs,
} from "@miyauci/esbuild-import-map";
import { resolve } from "@std/path/resolve";
import { toFileUrl } from "@std/path/to-file-url";
import { readDenoConfig } from "@deno/deno-config";
import { embedImportMaps } from "./import_map.ts";
import { initCompilerOptionsPlugin } from "./compiler_options.ts";

export type Path = string;

export interface DenoPluginOptions {
  /** Deno config. */
  config: Path;

  denoDir?: string;
}

export function denoPlugin(options: DenoPluginOptions): Plugin {
  return {
    name: "deno",
    async setup(build) {
      const configPath = resolve(options.config);
      const baseURL = toFileUrl(configPath);
      const config = await readDenoConfig(baseURL);

      await initCompilerOptionsPlugin(config.compilerOptions).setup(build);

      const _importMap = { imports: config.imports, scopes: config.scopes };
      const importMap = embedImportMaps(_importMap);

      const importMapPluginArgs = {
        baseURL,
        importMap,
      } satisfies ImportMapPluginArgs;
      await importMapPlugin(importMapPluginArgs).setup(build);

      const denoSpecifierPluginOptions = {
        nodeModulesDir: config.nodeModulesDir,
        denoDir: options.denoDir,
      };
      await denoSpecifierPlugin(denoSpecifierPluginOptions).setup(build);
    },
  };
}
