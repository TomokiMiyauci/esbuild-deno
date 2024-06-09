export interface ValidationFailure {
  /** The validation failure message. */
  message: string;

  /** The path to a part of the instance. */
  instancePath: PropertyKey[];
}

export interface Validator<In = unknown, Out extends In = In>
  extends Serialize {
  validate: (input: In) => Iterable<ValidationFailure>;

  is: (input: In) => input is Out;
}

export interface Serialize {
  toString(): string;
}
