import { display, dotted } from "../utils.ts";
import type {
  DynamicMessage,
  Expectation,
  Inspection,
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

export class ArrayValidator<T> extends BaseValidator<unknown, T[]> {
  constructor(public validator?: Validator<unknown, T>) {
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

    if (this.validator) {
      for (const [index, value] of input.entries()) {
        const problems = this.validator.inspect(value);

        for (const problem of problems) yield shiftPath(index, problem);
      }
    }
  }

  toString(): string {
    const repr = this.validator ? this.validator.toString() : "unknown";

    return `${repr}[]`;
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
    public left: Inspection<In, Via>,
    public right: Inspection<Via, Out>,
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

function shiftPath(
  path: PropertyKey,
  problem: Problem,
): Problem {
  return {
    ...problem,
    instancePath: [path, ...problem.instancePath],
  };
}
