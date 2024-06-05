import { resolveURL } from "./utils.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { resolve, toFileUrl } from "@std/path";

const cwd = Deno.cwd();

describe("resolveURL", () => {
  it("should return same", () => {
    const table: URL[] = [
      new URL("file:///"),
      new URL("https://test.test"),
    ];

    table.forEach((url) => {
      expect(resolveURL(url, cwd)).toBe(url);
    });
  });

  it("should return resolved url", () => {
    const table: [string, URL | string][] = [
      ["./main.ts", toFileUrl(resolve("./main.ts"))],
      ["a", toFileUrl(resolve("a"))],
      ["../main.ts", toFileUrl(resolve("../main.ts"))],
      ["/", "file:///"],
      ["/a/b", "file:///a/b"],
    ];

    table.forEach(([url, expected]) => {
      expect(resolveURL(url, cwd)).toEqual(new URL(expected));
    });
  });
});
