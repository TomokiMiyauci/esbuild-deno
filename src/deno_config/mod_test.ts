import { getDenoConfigPaths } from "./mod.ts";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

describe("getDenoConfigPaths", () => {
  it("should return paths with normal pattern", () => {
    const table: [
      string,
      string[],
    ][] = [
      ["/", ["/deno.json", "/deno.jsonc"]],
      ["/dir", [
        "/dir/deno.json",
        "/dir/deno.jsonc",
        "/deno.json",
        "/deno.jsonc",
      ]],
      ["/dir/", [
        "/dir/deno.json",
        "/dir/deno.jsonc",
        "/deno.json",
        "/deno.jsonc",
      ]],
      ["/path/to", [
        "/path/to/deno.json",
        "/path/to/deno.jsonc",
        "/path/deno.json",
        "/path/deno.jsonc",
      ]],
      ["/path/to/", [
        "/path/to/deno.json",
        "/path/to/deno.jsonc",
        "/path/deno.json",
        "/path/deno.jsonc",
      ]],
    ];

    for (const [basePath, expected] of table) {
      expect([...getDenoConfigPaths(basePath)]).toEqual(expected);
    }
  });

  it("should not return duplicate values if invalid input", () => {
    const table: [
      string,
      string[],
    ][] = [
      ["", ["deno.json", "deno.jsonc"]],
      [" ", [" /deno.json", " /deno.jsonc", "deno.json", "deno.jsonc"]],
      ["  ", ["  /deno.json", "  /deno.jsonc", "deno.json", "deno.jsonc"]],
      ["//", ["/deno.json", "/deno.jsonc"]],
      ["///", ["/deno.json", "/deno.jsonc"]],
      [".", ["deno.json", "deno.jsonc"]],
      ["./", ["deno.json", "deno.jsonc"]],
      ["./a", ["a/deno.json", "a/deno.jsonc", "deno.json", "deno.jsonc"]],
      ["../", ["../deno.json", "../deno.jsonc", "deno.json", "deno.jsonc"]],
      ["../a", [
        "../a/deno.json",
        "../a/deno.jsonc",
        "../deno.json",
        "../deno.jsonc",
      ]],
    ];

    for (const [basePath, expected] of table) {
      expect([...getDenoConfigPaths(basePath)]).toEqual(expected);
    }
  });
});
