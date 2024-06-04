import { compile } from "json-schema-to-typescript";
import schema from "./schema.json" with { type: "json" };

if (import.meta.main) {
  // deno-lint-ignore no-explicit-any
  const result = await compile(schema as any, "");

  Deno.writeTextFile("./types.ts", result);
}
