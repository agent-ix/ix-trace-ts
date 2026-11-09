import { describe, expect, it } from "vitest";

import { recoverEachTemplate } from "../src/template";

const at = (source: string, line: number, column: number) =>
  recoverEachTemplate(source, line, column);

describe("recoverEachTemplate", () => {
  it("reads single, double and tagged-template titles", () => {
    expect(at(`it.each([1])("a %s", f)`, 1, 13)).toBe("a %s");
    expect(at(`it.each([1])('b\\'s %s', f)`, 1, 13)).toBe("b's %s");
    expect(at("it.each`x|y`(`c %s`, f)", 1, 13)).toBe("c %s");
  });

  it("is not an each form for plain and modifier registrations", () => {
    expect(at(`it("plain", f)`, 1, 1)).toBeUndefined();
    expect(at(`it.skipIf(c)("m", f)`, 1, 13)).toBeUndefined();
  });

  it("refuses a title that is not a plain literal", () => {
    expect(() => at(`it.each([1])(t, f)`, 1, 13)).toThrow();
    expect(() => at(`it.each([1])("a" + b, f)`, 1, 13)).toThrow();
    expect(() => at("it.each([1])(`a ${b}`, f)", 1, 13)).toThrow();
  });
});
