import { isObject, resolvePath } from "./utils.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";

const cwd = Deno.cwd();

describe("resolvePath", () => {
  it("should return absolute path", () => {
    const table: [string, string][] = [
      ["./main.ts", join(cwd, "./main.ts")],
      ["a", join(cwd, "a")],
      ["../main.ts", join(cwd, "../main.ts")],
      ["/", "/"],
      ["/a/b", "/a/b"],
      ["file:///", join(cwd, "file:")],
      ["file:///main.ts", join(cwd, "file:/main.ts")],
    ];

    table.forEach(([path, expected]) => {
      expect(resolvePath(path, cwd)).toEqual(expected);
    });
  });
});

describe("isObject", () => {
  it("should return true", () => {
    const table: unknown[] = [
      {},
      { a: "" },
      new Object(),
    ];

    table.forEach((input) => {
      expect(isObject(input)).toBeTruthy();
    });
  });

  it("should return false", () => {
    const table: unknown[] = [
      0,
      "",
      false,
      [],
      [""],
    ];

    table.forEach((input) => {
      expect(isObject(input)).toBeFalsy();
    });
  });
});
