import type { Validator } from "../types.ts";
import { display } from "../utils.ts";
import { isObject } from "../../utils.ts";

export function string(): Validator<unknown, string> {
  return {
    is(input): input is string {
      return typeof input === "string";
    },

    *validate(input) {
      if (!this.is(input)) {
        yield {
          message: `should be string, actual ${typeof input}`,
          instancePath: [],
        };
      }
    },

    toString() {
      return "string";
    },
  };
}

export function partial<T extends Record<string, Validator>>(
  record: T,
): Validator<
  unknown,
  {
    [k in keyof T]?: T[k] extends Validator<infer _, infer U> ? U : never;
  }
> {
  return {
    is(
      input,
    ): input is {
      [k in keyof T]?: T[k] extends Validator<infer _, infer U> ? U : never;
    } {
      for (const _ of this.validate(input)) {
        return false;
      }

      return true;
    },

    *validate(input) {
      if (!isObject(input)) {
        return yield { instancePath: [], message: `should be object` };
      }

      for (const key in record) {
        if (!Reflect.has(input, key)) continue;

        const value = Reflect.get(input, key);

        const validator = record[key];

        const result = validator.validate(value);

        for (const r of result) {
          yield { instancePath: [key, ...r.instancePath], message: r.message };
        }
      }
    },
  };
}

export function boolean(): Validator<unknown, boolean> {
  return {
    is(input): input is boolean {
      return typeof input === "string";
    },

    *validate(input) {
      if (!this.is(input)) {
        yield {
          message: `should be boolean, actual ${typeof input}`,
          instancePath: [],
        };
      }
    },

    toString() {
      return "boolean";
    },
  };
}

export function record<K extends PropertyKey, V>(
  key: Validator<unknown, K>,
  value: Validator<unknown, V>,
): Validator<unknown, Record<K, V>> {
  return {
    is(input): input is Record<K, V> {
      for (const _ of this.validate(input)) {
        return false;
      }

      return true;
    },

    *validate(input) {
      if (!isObject(input)) {
        return yield { instancePath: [], message: `should be object` };
      }

      for (const k in input) {
        const v = Reflect.get(input, k);

        const keyResults = key.validate(v);

        for (const result of keyResults) {
          yield {
            instancePath: [k, ...result.instancePath],
            message: result.message,
          };
        }

        const valueResults = value.validate(v);

        for (const result of valueResults) {
          yield {
            instancePath: [k, ...result.instancePath],
            message: result.message,
          };
        }
      }
    },

    toString() {
      return `Record<${key}, ${value}>`;
    },
  };
}

export function or<T extends Validator[]>(
  ...validators: T
): Validator<
  unknown,
  T[number] extends Validator<infer _, infer Out> ? Out : never
> {
  return {
    is(
      input,
    ): input is T[number] extends Validator<infer _, infer Out> ? Out : never {
      for (const _ of this.validate(input)) {
        return false;
      }

      return true;
    },

    *validate(input) {
      for (const validator of validators) {
        if (validator.is(input)) return;
      }

      yield {
        instancePath: [],
        message: `should be ${this.toString()}`,
      };
    },

    toString() {
      const or = validators.map(String);
      const expected = formatter.format(or);

      return expected;
    },
  };
}

const formatter = /* @__PURE__ */ new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

export function value<const T>(value: T): Validator<unknown, T> {
  return {
    is(input): input is T {
      return input === value;
    },

    *validate(input) {
      if (!this.is(input)) {
        yield {
          instancePath: [],
          message: `should be ${value} actual ${input}`,
        };
      }
    },

    toString() {
      return display(value);
    },
  };
}

export function array<T>(
  validator?: Validator<unknown, T>,
): Validator<unknown, T[]> {
  return {
    is(input): input is T[] {
      for (const _ of this.validate(input)) {
        return false;
      }

      return true;
    },

    *validate(input) {
      if (!Array.isArray(input)) {
        return yield { instancePath: [], message: `should be array` };
      }

      if (validator) {
        for (const [index, value] of input.entries()) {
          const failures = validator.validate(value);

          for (const failure of failures) {
            yield {
              instancePath: [index, ...failure.instancePath],
              message: failure.message,
            };
          }
        }
      }
    },

    toString() {
      const type = validator ? validator.toString() : "unknown";

      return `${type}[]`;
    },
  };
}
