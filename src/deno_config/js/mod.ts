import { format } from "@miyauci/format";
import { Message } from "./constants.ts";
import { parseDenoConfig } from "./parser.ts";
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

  return parseDenoConfig(denoConfigText, url);
}
