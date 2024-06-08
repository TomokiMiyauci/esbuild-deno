import { parse } from "@std/jsonc";
import { format } from "@miyauci/format";
import { isObject } from "../../utils.ts";
import { Message } from "./constants.ts";
import { assertDenoConfig, type JsonValue } from "./validator.ts";
import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

export function parseDenoConfig(input: string, url: URL | string): DenoConfig {
  let json: JsonValue;

  try {
    json = parse(input) as JsonValue;
  } catch (e) {
    const message = format(Message.InvalidJsonFormat, { url });

    throw new Error(message, { cause: e });
  }

  if (!isObject(json)) {
    const message = format(Message.InvalidJsonType, { url });

    throw new Error(message);
  }

  assertDenoConfig(json);

  return json;
}
