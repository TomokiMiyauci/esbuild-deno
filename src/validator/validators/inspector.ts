import type {
  DynamicMessage,
  Expectation,
  Inspector,
  Problem,
} from "../types.ts";

abstract class Messenger {
  #message: string | DynamicMessage | undefined;

  expect(message: string | DynamicMessage): this {
    this.#message = message;

    return this;
  }

  message(problem: Problem): string {
    if (this.#message === undefined) return this.template(problem);

    if (typeof this.#message === "string") return this.#message;

    return this.#message(problem);
  }

  protected abstract template(problem: Problem): string;
}

abstract class BaseInspector<In = unknown> extends Messenger
  implements Inspector<In>, Expectation {
  abstract inspect(input: In): Iterable<Problem>;

  abstract toString(): string;
}

export class MaxInspector extends BaseInspector<Iterable<unknown>> {
  constructor(public expected: number) {
    super();
  }

  *inspect(input: Iterable<unknown>): Iterable<Problem> {
    const actual = count(input);
    const expected = this.expected;

    if (expected < actual) {
      yield { actual, expected, instancePath: [], by: this };
    }
  }

  protected template(problem: Problem): string {
    return `should be less than or equal to ${problem.expected} but ${problem.actual}`;
  }

  toString(): string {
    return `Max(${this.expected})`;
  }
}

export class MinInspector extends BaseInspector<Iterable<unknown>> {
  constructor(public expected: number) {
    super();
  }

  *inspect(input: Iterable<unknown>): Iterable<Problem> {
    const actual = count(input);
    const expected = this.expected;

    if (actual < expected) {
      yield { actual, expected, instancePath: [], by: this };
    }
  }

  template(problem: Problem): string {
    return `should be greater than or equal to ${problem.expected} but ${problem.actual}`;
  }

  toString(): string {
    return `Min(${this.expected})`;
  }
}

function count(input: Iterable<unknown>): number {
  return [...input].length;
}
