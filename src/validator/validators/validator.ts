import { display } from "../utils.ts";
import type { ValidationFailure, Validator } from "../types.ts";

abstract class BaseValidator<In, Out extends In> implements Validator<In, Out> {
  is(input: In): input is Out {
    for (const _ of this.check(input)) {
      return false;
    }

    return true;
  }

  abstract check(input: In): Iterable<ValidationFailure>;

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

  *check(input: unknown): Iterable<ValidationFailure> {
    const type = input === null ? "null" : typeof input;

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

export class EqualityValidator<const T> extends BaseValidator<unknown, T> {
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

export class ArrayValidator<T> extends BaseValidator<unknown, T[]> {
  constructor(public validator?: BaseValidator<unknown, T>) {
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

export class RecordValidator<K extends string, V>
  extends BaseValidator<object, Record<K, V>> {
  constructor(
    public key: Validator<string, K>,
    public value: Validator<unknown, V>,
  ) {
    super();
  }

  *check(input: object): Iterable<ValidationFailure> {
    for (const [k, v] of Object.entries(input)) {
      const keyResults = this.key.check(k);

      for (const result of keyResults) {
        yield {
          instancePath: [k, ...result.instancePath],
          message: result.message,
        };
      }

      const valueResults = this.value.check(v);

      for (const result of valueResults) {
        yield {
          instancePath: [k, ...result.instancePath],
          message: result.message,
        };
      }
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

  *check(input: In): Iterable<ValidationFailure> {
    yield* this.left.check(input);
    yield* this.right.check(input as Via);
  }

  toString(): string {
    return `${this.left} & ${this.right}`;
  }
}

export class UnionValidator<In, Out extends In> extends BaseValidator<In, Out> {
  constructor(public validators: Validator<In, Out>[]) {
    super();
  }

  *check(input: In): Iterable<ValidationFailure> {
    for (const validator of this.validators) {
      if (validator.is(input)) return;
    }

    const or = this.validators.map(String);
    const expected = formatter.format(or);

    yield {
      instancePath: [],
      message: `should be ${expected}`,
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
