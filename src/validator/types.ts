export interface Messenger extends Serialize {
  message: DynamicMessage;
}

export interface Validator<In = unknown, Out extends In = In>
  extends Inspector<In> {
  is: (input: In) => input is Out;
}

export interface Expectation {
  expect(message: string | DynamicMessage): this;
}

export interface DynamicMessage {
  (problem: Problem): string;
}

export interface Serialize {
  toString(): string;
}

export interface Inspector<In = unknown> extends Serialize {
  inspect: (input: In) => Iterable<Problem>;
}

export interface Problem {
  /** The path to a part of the instance. */
  instancePath: PropertyKey[];

  actual: unknown;

  expected: unknown;

  by: Messenger;
}

export type Inspection<In, Out extends In = In> =
  | Inspector<In>
  | Validator<In, Out>;
