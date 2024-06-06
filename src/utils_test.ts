import { resolvePath } from "./utils.ts";
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
