// TODO: use rust crate from 'deno_config'

import * as JSONC from "@std/jsonc";
import { assertDenoConfig } from "./validator.ts";
import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

export { DenoConfig };

export async function fetchDenoConfig(url: URL): Promise<DenoConfig> {
  const res = await fetch(url);
  const denoConfigText = await res.text();

  const config = JSONC.parse(denoConfigText);

  assertDenoConfig(config);

  return config;
}
