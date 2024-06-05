import {
  denoSpecifierPlugin,
  type DenoSpecifierPluginOptions,
} from "@miyauci/esbuild-deno-specifier";
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

export interface DenoPluginOptions {
  /** Deno config as JavaScript value. */
  config?: DenoConfig;

  /** Path to deno dir.
   *
   * @default DENO_DIR
   */
  denoDir?: string;
}

/** Create esbuild plugin for deno.
 *
 * @param location Location of deno config.
 *
 * If it is an absolute path, it is converted to a file URL.
 * If it is a relative path, it is resolved based on the current directory and converted to a file URL.
 *
 * If {@link DenoPluginOptions.config} is not specified, deno config is fetched using this.
 *
 * @param options Plugin options.
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
 *  plugins: [denoPlugin("path/to/deno.json")],
 * });
 * ```
 */
export function denoPlugin(
  location: URL | string,
  options?: DenoPluginOptions,
): Plugin {
  return {
    name: "deno",
    async setup(build) {
      const cwd = build.initialOptions.absWorkingDir || Deno.cwd();
      const configURL = resolveURL(location, cwd);

      const config = options?.config
        ? options.config
        : await fetchDenoConfig(configURL).catch((e) => {
          const message = `Fail to fetch deno config from '${configURL}'`;

          throw new Error(message, { cause: e });
        });

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
        nodeModulesDir: config?.nodeModulesDir,
        denoDir: options?.denoDir,
      } satisfies DenoSpecifierPluginOptions;
      await denoSpecifierPlugin(denoSpecifierPluginOptions).setup(build);
    },
  };
}
