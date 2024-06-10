export interface ValidationFailure {
  /** The validation failure message. */
  message: string;

  /** The path to a part of the instance. */
  instancePath: PropertyKey[];
}

export interface Validator<In = unknown, Out extends In = In>
  extends Serialize {
  is: (input: In) => input is Out;

  check: (input: In) => Iterable<ValidationFailure>;

  toString(): string;
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
