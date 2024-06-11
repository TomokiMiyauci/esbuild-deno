export interface ValidationFailure {
  /** The path to a part of the instance. */
  instancePath: PropertyKey[];

  actual: unknown;

  expected: unknown;
  by: Messenger;
}

export interface Messenger extends Serialize {
  message: DynamicMessage;
}

export interface Validator<In = unknown, Out extends In = In>
  extends Serialize {
  is: (input: In) => input is Out;

  check: (input: In) => Iterable<ValidationFailure>;
}

export interface Expectation {
  expect(message: string | DynamicMessage): this;
}

export interface DynamicMessage {
  (failure: ValidationFailure): string;
}

export interface Serialize {
  toString(): string;
}

export type InferIn<T extends Validator> = T extends
  Validator<infer In, infer _> ? In
  : never;

export type InferOut<T extends Validator> = T extends
  Validator<infer _, infer Out> ? Out
  : never;
