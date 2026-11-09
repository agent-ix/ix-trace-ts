import { describe, expect, it } from "vitest";

import { recoverTitle } from "../src/template";

describe("recoverTitle", () => {
  it("reads single, double and tagged-template titles as written in source", () => {
    expect(recoverTitle(`it.each([1])("a %s", f)`, 1, 13, "a 1", true)).toBe(
      "a %s",
    );
    expect(
      recoverTitle(`it.each([1])('b\\'s %s', f)`, 1, 13, "b's 1", true),
    ).toBe("b\\'s %s");
    expect(recoverTitle("it.each`x|y`(`c %s`, f)", 1, 13, "c 1", true)).toBe(
      "c %s",
    );
  });

  it("keeps escapes of a plain title raw", () => {
    expect(recoverTitle(`it("p \\"q\\"", f)`, 1, 1, 'p "q"', false)).toBe(
      'p \\"q\\"',
    );
  });

  it("refuses an each title that is not a plain literal", () => {
    expect(() =>
      recoverTitle(`it.each([1])(t, f)`, 1, 13, "t", true),
    ).toThrow();
    expect(() =>
      recoverTitle(`it.each([1])("a" + b, f)`, 1, 13, "a1", true),
    ).toThrow();
    expect(() =>
      recoverTitle("it.each([1])(`a ${b}`, f)", 1, 13, "a 1", true),
    ).toThrow();
  });

  it("refuses a literal that does not match the run title", () => {
    expect(() => recoverTitle(`it("other", f)`, 1, 1, "mine", false)).toThrow();
  });
});
