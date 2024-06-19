import { display, dotted } from "../utils.ts";
import type {
  DynamicMessage,
  Expectation,
  Problem,
  Validator,
} from "../types.ts";

function defaultMessage(problem: Problem): string {
  const pathStr = dotted(...problem.instancePath);
  const body = `should be ${problem.expected} but ${problem.actual}`;
  const message = pathStr ? `'${pathStr}' ${body}` : body;

  return message;
}

abstract class BaseValidator<In = unknown, Out extends In = In>
  implements Validator<In, Out>, Expectation {
  is(input: In): input is Out {
    for (const _ of this.inspect(input)) {
      return false;
    }

    return true;
  }

  #message: string | DynamicMessage = defaultMessage;

  expect(message: string | DynamicMessage): this {
    this.#message = message;

    return this;
  }

  message(problem: Problem): string {
    if (typeof this.#message === "string") return this.#message;

    return this.#message(problem);
  }

  abstract inspect(input: In): Iterable<Problem>;

  abstract toString(): string;
}

interface TypeMap {
  string: string;
  symbol: symbol;
  boolean: boolean;
  number: number;
  bigint: bigint;
  object: object;
  // deno-lint-ignore ban-types
  function: Function;
  undefined: undefined;
  null: null;
}

type TypeName = keyof TypeMap;

export class TypeValidator<T extends TypeName>
  extends BaseValidator<unknown, TypeMap[T]> {
  constructor(public type: T) {
    super();
  }

  *inspect(input: unknown): Iterable<Problem> {
    const type = input === null ? "null" : typeof input;

    if (type !== this.type) {
      yield {
        instancePath: [],
        expected: this.type,
        actual: type,
        by: this,
      };
    }
  }

  toString(): string {
    return this.type;
  }
}

export class EqualityValidator<const T> extends BaseValidator<unknown, T> {
  constructor(public value: T) {
    super();
  }

  *inspect(input: unknown): Iterable<Problem> {
    if (input !== this.value) {
      yield {
        instancePath: [],
        actual: input,
        expected: this.value,
        by: this,
      };
    }
  }

  toString(): string {
    return display(this.value);
  }
}

export class ArrayValidator extends BaseValidator<unknown, unknown[]> {
  constructor() {
    super();
  }

  *inspect(input: unknown): Iterable<Problem> {
    if (!Array.isArray(input)) {
      return yield {
        instancePath: [],
        actual: input,
        expected: "array",
        by: this,
      };
    }
  }

  toString(): string {
    return `unknown[]`;
  }
}

export class RecordValidator<K extends string, V>
  extends BaseValidator<object, Record<K, V>> {
  constructor(
    public key: Validator<string, K>,
    public value: Validator<unknown, V>,
  ) {
    super();
  }

  *inspect(input: object): Iterable<Problem> {
    for (const [k, v] of Object.entries(input)) {
      for (const result of this.key.inspect(k)) yield shiftPath(k, result);

      for (const result of this.value.inspect(v)) yield shiftPath(k, result);
    }
  }

  toString(): string {
    return `Record<${this.key}, ${this.value}>`;
  }
}

export class IntersectionValidator<In, Via extends In, Out extends Via>
  extends BaseValidator<In, Out> {
  constructor(
    public left: Validator<In, Via>,
    public right: Validator<Via, Out>,
  ) {
    super();
  }

  *inspect(input: In): Iterable<Problem> {
    yield* this.left.inspect(input);
    yield* this.right.inspect(input as Via);
  }

  toString(): string {
    return `${this.left} & ${this.right}`;
  }
}

export class UnionValidator<In, Out extends In> extends BaseValidator<In, Out> {
  constructor(public validators: Validator<In, Out>[]) {
    super();
  }

  *inspect(input: In): Iterable<Problem> {
    for (const validator of this.validators) {
      if (validator.is(input)) return;
    }

    const or = this.validators.map(String);
    const expected = formatter.format(or);

    yield {
      instancePath: [],
      actual: input,
      expected,
      by: this,
    };
  }

  toString(): string {
    const repr = this.validators.map(String).join(" | ");

    return repr;
  }
}

const formatter = /* @__PURE__ */ new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

export class PartialValidator<T extends object>
  extends BaseValidator<object, T> {
  constructor(
    public record: {
      [k in keyof T]: Validator<unknown, T[k]>;
    },
  ) {
    super();
  }

  *inspect(input: object): Iterable<Problem> {
    for (const key in this.record) {
      if (!Reflect.has(input, key)) continue;

      const value = Reflect.get(input, key);
      const validator = this.record[key];
      const problems = validator.inspect(value);

      for (const problem of problems) yield shiftPath(key, problem);
    }
  }

  toString(): string {
    return `Partial<record>`;
  }
}

export class IterableValidator<In, Out extends In = In>
  extends BaseValidator<Iterable<In>, Iterable<Out>> {
  constructor(public validator: Validator<In, Out>) {
    super();
  }

  *inspect(input: Iterable<In>): Iterable<Problem> {
    for (const [index, iter] of enumerate(input)) {
      for (const problem of this.validator.inspect(iter)) {
        yield shiftPath(index, problem);
      }
    }
  }

  toString(): string {
    return `Iterable<${this.validator.toString()}>`;
  }
}

export class TupleValidator<In extends unknown[], Out extends In>
  extends BaseValidator<In, Out> {
  constructor(
    public validators:
      & { [k in keyof In]: Validator<In[k], Out[k]> }
      & { [k in keyof Out]: Validator<Out[k]> },
  ) {
    super();
  }

  *inspect(input: In) {
    for (const [index, validator] of this.validators.entries()) {
      const value = input[index];

      for (const problem of validator.inspect(value)) {
        yield shiftPath(index, problem);
      }
    }
  }

  toString(): string {
    const inner = this.validators.join(", ");

    return `[${inner}]`;
  }
}

export function* enumerate<T>(
  iterable: Iterable<T>,
  start: number = 0,
): Iterable<[index: number, item: T]> {
  for (const item of iterable) yield [start++, item];
}

function shiftPath(
  path: PropertyKey,
  problem: Problem,
): Problem {
  return {
    ...problem,
    instancePath: [path, ...problem.instancePath],
  };
}

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
  implements Validator<In>, Expectation {
  is(input: In): input is In {
    for (const _ of this.inspect(input)) {
      return false;
    }

    return true;
  }

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
