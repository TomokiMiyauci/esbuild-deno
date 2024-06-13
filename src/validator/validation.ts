import type { Inspector, Validator } from "./types.ts";

export function assert<In, Out extends In = In>(
  input: In,
  inspector: Inspector<In> | Validator<In, Out>,
): asserts input is Out {
  for (const problem of inspector.inspect(input)) {
    const message = problem.by.message(problem);
    const error = new Error(message);

    throw captured(error);
  }

  // deno-lint-ignore ban-types
  function captured<T extends Object>(error: T): T {
    Error.captureStackTrace(error, assert);

    return error;
  }
}
