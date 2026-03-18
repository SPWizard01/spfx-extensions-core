import { describe, expect, it } from "vitest";
import { blue, bold, dim, red, reset } from "../colors";

describe("core/utility/colors", () => {
  it("wraps text with ANSI open/close", () => {
    expect(red("hi")).toBe("\x1b[31mhi\x1b[39m");
    expect(blue("")).toBe("\x1b[34m\x1b[39m");
  });

  it("leaves early inner close (index < open.length) as-is for bold", () => {
    const innerClose = "\x1b[22m";
    const input = `foo${innerClose}bar`;
    const out = bold(input);
    // Because search starts at open.length (4), the close at index 3 is not replaced
    expect(out).toBe("\x1b[1mfoo\x1b[22mbar\x1b[22m");
  });

  it("replaces only inner closes found at index >= open.length (dim)", () => {
    const innerClose = "\x1b[22m";
    const input = `x${innerClose}y${innerClose}z`;
    const out = dim(input);
    // First close at index 1 is before open.length (4) and stays; second is replaced
    expect(out).toBe("\x1b[2mx\x1b[22my\x1b[22m\x1b[2mz\x1b[22m");
  });

  it("reset uses same open/close and still wraps input", () => {
    const input = `a\x1b[0mb`;
    const out = reset(input);
    // replace == open for reset; occurrences stay the same
    expect(out).toBe("\x1b[0ma\x1b[0mb\x1b[0m");
  });

  it("composes styles when nested (blue and bold)", () => {
    const nested = blue(bold("X"));
    expect(nested).toBe("\x1b[34m\x1b[1mX\x1b[22m\x1b[39m");
  });
});
