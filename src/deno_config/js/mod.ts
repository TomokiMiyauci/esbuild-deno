// TODO: use rust crate from 'deno_config'

import * as JSONC from "@std/jsonc";
import { format } from "@miyauci/format";
import { Message } from "./constants.ts";
import { assertDenoConfig } from "./validator.ts";
import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

export { DenoConfig };

export async function readDenoConfig(url: URL): Promise<DenoConfig> {
  let denoConfigText: string;

  try {
    denoConfigText = await Deno.readTextFile(url);
  } catch (e) {
    const message = format(Message.FailReadConfig, { url });

    throw new Error(message, { cause: e });
  }

  let config: unknown;

  try {
    config = JSONC.parse(denoConfigText);
  } catch (e) {
    const message = format(Message.InvalidJsonType, { url });

    throw new Error(message, { cause: e });
  }

  assertDenoConfig(config);

  return config;
}
