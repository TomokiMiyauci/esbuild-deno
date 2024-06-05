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
  /** Deno config as JavaScript value.
   */
  value?: DenoConfig;

  /** Location of config.
   *
   * If it is an absolute path, it is converted to a file URL.
   * If it is a relative path, it is resolved based on the current directory and converted to a file URL.
   *
   * If {@link value} is not specified, deno config is fetched using this.
   */
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

/** Create esbuild plugin for deno.
 *
 * @example
 * ```ts
 * import { denoPlugin } from "@miyauci/esbuild-deno";
 * import { build } from "esbuild";
 *
 * await build({
 *  stdin: {
 *    contents: `import "jsr:@std/assert";`,
 *  },
 *  format: "esm",
 *  bundle: true,
 *  plugins: [denoPlugin({ config: { location: "path/to/deno.json" } })],
 * });
 * ```
 */
export function denoPlugin(options?: DenoPluginOptions): Plugin {
  return {
    name: "deno",
    async setup(build) {
      if (options) {
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
          denoDir: options?.denoDir,
        };
        await denoSpecifierPlugin(denoSpecifierPluginOptions).setup(build);
      } else {
        await denoSpecifierPlugin().setup(build);
      }
    },
  };
}
