import {
  denoSpecifierPlugin,
  type DenoSpecifierPluginOptions,
} from "@miyauci/esbuild-deno-specifier";
import { type Plugin } from "esbuild";
import {
  importMapPlugin,
  type ImportMapPluginArgs,
} from "@miyauci/esbuild-import-map";
import {
  type AbsolutePath,
  findDenoConfig,
  readDenoConfig,
} from "@deno/deno-config";
import { dirname } from "@std/path/dirname";
import { toFileUrl } from "@std/path/to-file-url";
import { initCompilerOptionsPlugin } from "./compiler_options.ts";
import { formatImportMapDiagnostics, resolvePath } from "./utils.ts";
import {
  type DenoConfig,
  resolveImportMap,
  resolveLock,
} from "./deno_config.ts";
import { parseImportMap } from "@deno/import-map";

export interface DenoConfigPluginOptions {
  /** Deno config as JavaScript value. */
  config?: DenoConfig;

  /** Path to deno dir.
   *
   * @default DENO_DIR
   */
  denoDir?: string;
}

/** Create esbuild plugin for deno config.
 *
 * @param path Path to deno config.
 *
 * If it is a relative path, it is resolved based on the current directory.
 *
 * If {@link DenoConfigPluginOptions.config} is not specified, deno config is fetched using this.
 *
 * @param options Plugin options.
 */
export function denoConfigPlugin(
  path: string,
  options?: DenoConfigPluginOptions,
): Plugin {
  return {
    name: "deno-config",
    async setup(build) {
      const cwd = build.initialOptions.absWorkingDir || Deno.cwd();
      const absConfigPath = resolvePath(path, cwd);
      const configURL = toFileUrl(absConfigPath);

      const config = options?.config
        ? options.config
        : await readDenoConfig(configURL);

      await initCompilerOptionsPlugin(config.compilerOptions).setup(build);

      const resolvedImportMap = await resolveImportMap(config, configURL);

      if (resolvedImportMap) {
        const { importMap, warnings } = parseImportMap(
          resolvedImportMap.source,
          resolvedImportMap.baseURL,
        );

        if (warnings.length) {
          const message = formatImportMapDiagnostics(warnings);

          console.warn(message);
        }

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

export interface DenoPluginOptions {
  /** Specify the configuration file.
   *
   * @example relative path
   * - "./deno.json"
   * - "deno.json"
   *
   * @example absolute path
   * "/path/to/deno.json"
   */
  config?: string;

  /** Path to deno dir.
   *
   * @default DENO_DIR
   */
  denoDir?: string;
}

/** Create esbuild plugin for deno.
 *
 * @example Basic usage
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
 *  plugins: [denoPlugin()],
 * });
 * ```
 */
export function denoPlugin(options?: DenoPluginOptions): Plugin {
  return {
    name: "deno",
    async setup(build) {
      const denoDir = options?.denoDir;

      if (options?.config) {
        return denoConfigPlugin(options.config, { denoDir })
          .setup(build);
      }

      const cwd =
        (build.initialOptions.absWorkingDir || Deno.cwd()) as AbsolutePath; // This is guaranteed
      const configFile = await findDenoConfig(cwd);

      if (configFile) {
        const { config, path } = configFile;

        await denoConfigPlugin(path, { config, denoDir })
          .setup(build);
      } else await denoSpecifierPlugin({ denoDir }).setup(build);
    },
  };
}
