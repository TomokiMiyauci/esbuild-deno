import type { Validator } from "./types.ts";

export function assert<In, Out extends In>(
  input: In,
  validator: Validator<In, Out>,
): asserts input is Out {
  for (const problem of validator.inspect(input)) {
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
