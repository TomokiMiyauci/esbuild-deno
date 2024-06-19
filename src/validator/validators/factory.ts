import type { Expectation, Inspection, Validator } from "../types.ts";
import {
  ArrayValidator,
  EqualityValidator,
  IntersectionValidator,
  IterableValidator,
  MaxInspector,
  MinInspector,
  PartialValidator,
  RecordValidator,
  TupleValidator,
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

export function and<In, Out extends Via, Via extends In = In>(
  left: Inspection<In, Via>,
  right: Inspection<Via, Out>,
): Validator<In, Out> & Expectation {
  return new IntersectionValidator(left, right);
}

export const array: Validator<unknown, unknown[]> & Expectation =
  new ArrayValidator();

export function max(
  expected: number,
): Validator<Iterable<unknown>> & Expectation {
  return new MaxInspector(expected);
}

export function min(
  expected: number,
): Validator<Iterable<unknown>> & Expectation {
  return new MinInspector(expected);
}

export function iter<In, Out extends In>(
  inspector: Inspection<In, Out>,
): Validator<Iterable<In>, Iterable<Out>> & Expectation {
  return new IterableValidator(inspector);
}

export function tuple<
  In extends unknown[],
  Out extends In,
>(
  ...inspectors:
    & { [k in keyof In]: Inspection<In[k], Out[k]> }
    & { [k in keyof Out]: Inspection<Out[k]> }
): Validator<In, Out> {
  return new TupleValidator<In, Out>(inspectors);
}
