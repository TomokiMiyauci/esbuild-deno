import type { Expectation, Validator } from "../types.ts";
import {
  ArrayValidator,
  EqualityValidator,
  IntersectionValidator,
  PartialValidator,
  RecordValidator,
  TypeValidator,
  UnionValidator,
} from "./validator.ts";

export const string: Validator<unknown, string> & Expectation =
  new TypeValidator("string");

export const boolean: Validator<unknown, boolean> & Expectation =
  new TypeValidator("boolean");

export const object: Validator<unknown, object> & Expectation =
  new TypeValidator("object");

export function value<const T>(value: T): Validator<unknown, T> & Expectation {
  return new EqualityValidator(value);
}

export function partial<T extends object>(
  record: {
    [k in keyof T]: Validator<unknown, T[k]>;
  },
): Validator<object, T> & Expectation {
  return new PartialValidator(record);
}

export function record<K extends string, V>(
  key: Validator<string, K>,
  value: Validator<unknown, V>,
): Validator<object, Record<K, V>> & Expectation {
  return new RecordValidator(key, value);
}

export function or<In, Out extends In>(
  ...validators: Validator<In, Out>[]
): Validator<In, Out> & Expectation {
  return new UnionValidator(validators);
}

export function and<In, Out extends Via, Via extends In>(
  left: Validator<In, Via>,
  right: Validator<Via, Out>,
): Validator<In, Out> & Expectation {
  return new IntersectionValidator(left, right);
}

export function array<T>(
  validator?: Validator<unknown, T>,
): Validator<unknown, T[]> & Expectation {
  return new ArrayValidator(validator);
}
