import { denoSpecifierPlugin } from "@miyauci/esbuild-deno-specifier";
import { type Plugin } from "esbuild";
import {
  importMapPlugin,
  type ImportMapPluginArgs,
} from "@miyauci/esbuild-import-map";
import { fetchDenoConfig } from "@deno/deno-config";
import { embedImportMaps } from "./import_map.ts";
import { initCompilerOptionsPlugin } from "./compiler_options.ts";
import { resolveURL } from "./utils.ts";
import { type DenoConfig, resolveImportMap } from "./deno_config.ts";

export interface DenoConfigOptions {
  value?: DenoConfig;
  location: URL | string;
}

export interface DenoPluginOptions {
  /** Deno config options. */
  config: DenoConfigOptions;

  /** Path to deno dir.
   *
   * @default DENO_DIR
   */
  denoDir?: string;
}

export function denoPlugin(options: DenoPluginOptions): Plugin {
  return {
    name: "deno",
    async setup(build) {
      const configURL = resolveURL(options.config.location);
      const config = options.config.value
        ? options.config.value
        : await fetchDenoConfig(configURL);

      await initCompilerOptionsPlugin(config.compilerOptions).setup(build);

      const resolvedImportMap = await resolveImportMap(config, configURL);

      if (resolvedImportMap) {
        const importMap = embedImportMaps(resolvedImportMap.importMap);
        const importMapPluginArgs = {
          baseURL: resolvedImportMap.baseURL,
          importMap,
        } satisfies ImportMapPluginArgs;

        await importMapPlugin(importMapPluginArgs).setup(build);
      }

      const denoSpecifierPluginOptions = {
        nodeModulesDir: config.nodeModulesDir,
        denoDir: options.denoDir,
      };
      await denoSpecifierPlugin(denoSpecifierPluginOptions).setup(build);
    },
  };
}
