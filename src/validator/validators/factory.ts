import type { Validator } from "../types.ts";
import { isObject } from "../../utils.ts";
import {
  ArrayValidator,
  EqualityValidator,
  IntersectionValidator,
  RecordValidator,
  TypeValidator,
  UnionValidator,
} from "./validator.ts";

export function string(): Validator<unknown, string> {
  return new TypeValidator("string");
}

export function boolean(): Validator<unknown, boolean> {
  return new TypeValidator("boolean");
}

export function object(): Validator<unknown, object> {
  return new TypeValidator("object");
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

export function record<K extends string, V>(
  key: Validator<string, K>,
  value: Validator<unknown, V>,
): Validator<object, Record<K, V>> {
  return new RecordValidator(key, value);
}

export function or<In, Out extends In>(
  ...validators: Validator<In, Out>[]
): Validator<In, Out> {
  return new UnionValidator(validators);
}

export function and<In, Via extends In, Out extends Via>(
  left: Validator<In, Via>,
  right: Validator<Via, Out>,
): Validator<In, Out> {
  return new IntersectionValidator(left, right);
}

export function array<T>(
  validator?: Validator<unknown, T>,
): Validator<unknown, T[]> {
  return new ArrayValidator(validator);
}
