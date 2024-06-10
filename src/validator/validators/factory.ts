import type { Validator } from "../types.ts";
import { isObject } from "../../utils.ts";
import {
  ArrayValidator,
  EqualityValidator,
  TypeValidator,
} from "./validator.ts";

export function string(): Validator<unknown, string> {
  return new TypeValidator("string");
}

export function boolean(): Validator<unknown, boolean> {
  return new TypeValidator("boolean");
}

export function value<const T>(value: T): Validator<unknown, T> {
  return new EqualityValidator(value);
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
      for (const _ of this.check(input)) {
        return false;
      }

      return true;
    },

    *check(input) {
      if (!isObject(input)) {
        return yield { instancePath: [], message: `should be object` };
      }

      for (const key in record) {
        if (!Reflect.has(input, key)) continue;

        const value = Reflect.get(input, key);

        const validator = record[key];

        const result = validator.check(value);

        for (const r of result) {
          yield { instancePath: [key, ...r.instancePath], message: r.message };
        }
      }
    },
  };
}

export function record<K extends PropertyKey, V>(
  key: Validator<unknown, K>,
  value: Validator<unknown, V>,
): Validator<unknown, Record<K, V>> {
  return {
    is(input): input is Record<K, V> {
      for (const _ of this.check(input)) {
        return false;
      }

      return true;
    },

    *check(input) {
      if (!isObject(input)) {
        return yield { instancePath: [], message: `should be object` };
      }

      for (const k in input) {
        const v = Reflect.get(input, k);

        const keyResults = key.check(v);

        for (const result of keyResults) {
          yield {
            instancePath: [k, ...result.instancePath],
            message: result.message,
          };
        }

        const valueResults = value.check(v);

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
      for (const _ of this.check(input)) {
        return false;
      }

      return true;
    },

    *check(input) {
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

export function array<T>(
  validator?: Validator<unknown, T>,
): Validator<unknown, T[]> {
  return new ArrayValidator(validator);
}
