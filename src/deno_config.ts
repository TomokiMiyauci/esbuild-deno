import type { DenoConfig } from "./types.ts";
import * as JSONC from "@std/jsonc";

export async function readDenoConfig(url: URL): Promise<DenoConfig> {
  const denoConfigText = await Deno.readTextFile(url);
  const config = JSONC.parse(denoConfigText);

  assertDenoConfig(config);

  return config;
}

export function assertDenoConfig(
  input: unknown,
): asserts input is DenoConfig {
  if (!validateDenoConfig(input)) {
    throw new Error();
  }
}

export function validateDenoConfig(input: unknown): input is DenoConfig {
  // TODO
  return true;
}
