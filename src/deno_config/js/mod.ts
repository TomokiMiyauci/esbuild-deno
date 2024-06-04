// TODO: use rust crate from 'deno_config'

import * as JSONC from "@std/jsonc";
import { assertDenoConfig } from "./validator.ts";
import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

export { DenoConfig };

export async function readDenoConfig(url: URL): Promise<DenoConfig> {
  const denoConfigText = await Deno.readTextFile(url);

  const config = JSONC.parse(denoConfigText);

  assertDenoConfig(config);

  return config;
}
