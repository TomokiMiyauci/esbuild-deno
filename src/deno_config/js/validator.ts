import { Ajv } from "ajv";
import schema from "./schema.json" with { type: "json" };
import { type DenoConfigurationFileSchema as DenoConfig } from "./types.ts";

const validate = new Ajv({ allowUnionTypes: true, allErrors: true })
  .addKeyword("markdownDescription")
  .compile(schema);

export function assertDenoConfig(
  input: unknown,
): asserts input is DenoConfig {
  if (!validate(input)) {
    const message = JSON.stringify(validate.errors, null, 4);

    throw new Error(message);
  }
}
