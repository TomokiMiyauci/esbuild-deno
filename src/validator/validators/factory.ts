import type { Validator } from "../types.ts";
import {
  ArrayValidator,
  EqualityValidator,
  IntersectionValidator,
  PartialValidator,
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

export function partial<T extends object>(
  record: {
    [k in keyof T]: Validator<unknown, T[k]>;
  },
): Validator<object, T> {
  return new PartialValidator(record);
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
