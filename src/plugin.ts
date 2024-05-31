import { denoSpecifier } from "@miyauci/esbuild-deno-specifier";
import { type Plugin } from "esbuild";
import {
  importMapPlugin,
  type ImportMapPluginArgs,
} from "@miyauci/esbuild-import-map";
import { resolve, toFileUrl } from "@std/path";
import { embedImportMaps } from "./import_map.ts";
import type { ImportMap } from "./types.ts";
import { readDenoConfig } from "./deno_config.ts";

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

      const _importMap = {
        imports: config.imports,
        scopes: config.scopes,
      } satisfies ImportMap;
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
      await denoSpecifier(denoSpecifierPluginOptions).setup(build);
    },
  };
}
