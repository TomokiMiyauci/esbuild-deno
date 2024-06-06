import {
  denoSpecifierPlugin,
  type DenoSpecifierPluginOptions,
} from "@miyauci/esbuild-deno-specifier";
import { type Plugin } from "esbuild";
import {
  importMapPlugin,
  type ImportMapPluginArgs,
} from "@miyauci/esbuild-import-map";
import { readDenoConfig } from "@deno/deno-config";
import { format } from "@miyauci/format";
import { dirname } from "@std/path/dirname";
import { toFileUrl } from "@std/path/to-file-url";
import { embedImportMaps } from "./import_map.ts";
import { initCompilerOptionsPlugin } from "./compiler_options.ts";
import { resolveLock, resolvePath } from "./utils.ts";
import { type DenoConfig, resolveImportMap } from "./deno_config.ts";
import { Message } from "./constants.ts";

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
 * @param configPath Path to deno config.
 *
 * If it is a relative path, it is resolved based on the current directory.
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
  configPath: string,
  options?: DenoPluginOptions,
): Plugin {
  return {
    name: "deno",
    async setup(build) {
      const cwd = build.initialOptions.absWorkingDir || Deno.cwd();
      const absConfigPath = resolvePath(configPath, cwd);
      const configURL = toFileUrl(absConfigPath);

      const config = options?.config
        ? options.config
        : await readDenoConfig(configURL).catch((e) => {
          const message = format(Message.FailReadConfig, {
            url: configURL,
          });

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

      const configDir = dirname(absConfigPath);
      const lock = resolveLock(config.lock, { cwd, configDir });
      const denoSpecifierPluginOptions = {
        nodeModulesDir: config?.nodeModulesDir,
        denoDir: options?.denoDir,
        lock,
      } satisfies DenoSpecifierPluginOptions;
      await denoSpecifierPlugin(denoSpecifierPluginOptions).setup(build);
    },
  };
}
