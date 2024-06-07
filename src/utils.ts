import { isAbsolute } from "@std/path/is-absolute";
import { resolve } from "@std/path/resolve";
import { join } from "@std/path/join";
import { format } from "@miyauci/format";
import { Message } from "./constants.ts";

/** Resolve path to absolute.
 *
 * @returns {string} Absolute path
 */
export function resolvePath(
  path: string,
  baseDir: string,
): string {
  const absPath = isAbsolute(path) ? resolve(path) : resolve(baseDir, path);

  return absPath;
}

export function resolveLock(
  lock: string | boolean | undefined,
  { cwd, configDir }: { cwd: string; configDir: string },
): string | undefined {
  if (typeof lock === "string") return resolvePath(lock, configDir);

  if (lock === false) return undefined;

  return join(cwd, "deno.lock");
}

export function tabbed(indent: number): (input: string) => string {
  return (input: string): string => {
    const prefix = " ".repeat(indent);

    return `${prefix}${input}`;
  };
}

export function listed(input: string): `- ${string}` {
  return `- ${input}`;
}

export function formatImportMapDiagnostics(diagnostics: string[]): string {
  const body = diagnostics.map(listed).map(tabbed(2))
    .join("\n");
  const message = format(Message.ImportMapDiagnostic, { body });

  return message;
}
