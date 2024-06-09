/** join by dot.  */
export function dotted(...rest: readonly unknown[]): string {
  const str = rest
    .map(String)
    .join(".");

  return str;
}

export function display(input: unknown): string {
  if (typeof input === "string") return `'${input}'`;

  return String(input);
}
