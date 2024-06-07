export const enum Message {
  InvalidJson = "'{name}' is invalid JSON format",
  Invalid = "'{name}' should be {expected} but {actual}",
  FailResolveImportMap = "Unable to resolve import map in '{url}'",
  NotSupported = "'{name}' is not supported. {actual}",
  ImportMapDiagnostic = `Import map diagnostics:
{body}`,
}

export const enum Field {
  TsconfigRaw = "tsconfigRaw",
  CompilerOptions = "compilerOptions",
  Paths = "paths",
}
