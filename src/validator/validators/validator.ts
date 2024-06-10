import { display } from "../utils.ts";
import { ValidationFailure, Validator } from "../types.ts";

interface TypeMap {
  string: string;
  symbol: symbol;
  boolean: boolean;
  number: number;
  bigint: bigint;
  object: object | null;
  // deno-lint-ignore ban-types
  function: Function;
  undefined: undefined;
}

type TypeName = keyof TypeMap;

export class TypeValidator<T extends TypeName>
  extends Validator<unknown, TypeMap[T]> {
  constructor(public type: T) {
    super();
  }

  *check(input: unknown): Iterable<ValidationFailure> {
    const type = typeof input;

    if (type !== this.type) {
      yield {
        instancePath: [],
        message: `should be ${this.type}, actual ${type}`,
      };
    }
  }

  toString(): string {
    return this.type;
  }
}

export class EqualityValidator<const T> extends Validator<unknown, T> {
  constructor(public value: T) {
    super();
  }

  *check(input: unknown): Iterable<ValidationFailure> {
    if (input !== this.value) {
      yield {
        instancePath: [],
        message: `should be ${this.value} actual ${input}`,
      };
    }
  }

  toString(): string {
    return display(this.value);
  }
}

export class ArrayValidator<T> extends Validator<unknown, T[]> {
  constructor(public validator?: Validator<unknown, T>) {
    super();
  }

  *check(input: unknown): Iterable<ValidationFailure> {
    if (!Array.isArray(input)) {
      return yield { instancePath: [], message: `should be array` };
    }

    if (this.validator) {
      for (const [index, value] of input.entries()) {
        const failures = this.validator.check(value);

        for (const failure of failures) {
          yield {
            instancePath: [index, ...failure.instancePath],
            message: failure.message,
          };
        }
      }
    }
  }

  toString(): string {
    const repr = this.validator ? this.validator.toString() : "unknown";

    return `${repr}[]`;
  }
}
