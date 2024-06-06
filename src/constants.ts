export const enum Message {
  InvalidJson = "'{name}' is invalid JSON format",
  Invalid = "'{name}' should be {expected} but {actual}",
  FailFetchDenoConfig = "Fail to fetch deno config from {location}",
  NotSupported = "'{name}' is not supported. {actual}",
}

export const enum Field {
  TsconfigRaw = "tsconfigRaw",
  CompilerOptions = "compilerOptions",
  Paths = "paths",
}
