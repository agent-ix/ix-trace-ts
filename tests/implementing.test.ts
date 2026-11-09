import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { implementing } from "../src";
import { trace } from "../src/vitest";
import {
  IMPL,
  REPO,
  compileAndRun,
  makeProject,
  removeProject,
  runSuite,
  typeCheck,
} from "./support/run";

const projects: string[] = [];
const project = (files: Record<string, string>) => {
  const dir = makeProject(files);
  projects.push(dir);
  return dir;
};
afterAll(() => projects.forEach(removeProject));

const impl = JSON.stringify(IMPL.replace(/\.ts$/, ""));
const implSource = readFileSync(join(REPO, "src/implementing.ts"), "utf8");

describe("FR-002 implementing construct", { timeout: 120_000 }, () => {
  it("TC-014 type-checks string ids and rejects a non-string and an empty call", async () => {
    trace("FR-002-AC-1", "TC-014");
    const dir = project({
      "ok.ts": `import { implementing } from ${impl};
implementing("FR-002-AC-1", "FR-002-AC-2");
const f: (first: string, ...rest: string[]) => unknown = implementing;
f("A-1");
`,
      "number.ts": `import { implementing } from ${impl};
implementing(1);
`,
      "empty.ts": `import { implementing } from ${impl};
implementing();
`,
    });
    expect((await typeCheck(dir, "ok.ts")).code).toBe(0);
    expect((await typeCheck(dir, "number.ts")).out).toContain("TS2345");
    expect((await typeCheck(dir, "empty.ts")).out).toContain("TS2555");
  });

  const members = `import { implementing } from "./implementing";
const seen: Record<string, unknown> = {};
const cap =
  (name: string) =>
  (...args: unknown[]): void => {
    const d = args[2] as PropertyDescriptor | undefined;
    seen[name] = d === undefined ? args[0] : (d.value ?? d.get ?? d.set);
  };

@implementing("A-1")
@cap("class")
class Marked {
  @implementing("A-1") @cap("m") m() { return 1; }
  @implementing("A-1") @cap("get") get g() { return 1; }
  @implementing("A-1") @cap("set") set s(v: number) { void v; }
  u() { return 1; }
  get ug() { return 1; }
  set us(v: number) { void v; }
}
const d = (n: string) => Object.getOwnPropertyDescriptor(Marked.prototype, n)!;
const shape = (x: PropertyDescriptor) => ({
  writable: x.writable,
  enumerable: x.enumerable,
  configurable: x.configurable,
  value: x.value !== undefined,
  get: x.get !== undefined,
  set: x.set !== undefined,
});
console.log(JSON.stringify({
  classSame: Marked === seen.class,
  mSame: d("m").value === seen.m,
  getSame: d("g").get === seen.get,
  setSame: d("s").set === seen.set,
  m: [shape(d("m")), shape(d("u"))],
  g: [shape(d("g")), shape(d("ug"))],
  s: [shape(d("s")), shape(d("us"))],
}));
`;

  const unchanged = async (experimental: boolean) => {
    const dir = project({ "main.ts": members, "implementing.ts": implSource });
    const run = await compileAndRun(dir, { experimental });
    expect(run.code, run.out).toBe(0);
    const out = JSON.parse(run.out) as Record<string, unknown>;
    expect(out).toMatchObject({
      classSame: true,
      mSame: true,
      getSame: true,
      setSame: true,
    });
    const pairs = [out.m, out.g, out.s] as [unknown, unknown][];
    for (const [marked, plain] of pairs) expect(marked).toEqual(plain);
  };

  it("TC-015 standard decorators leave a class, method, getter and setter unchanged", async () => {
    trace("FR-002-AC-2", "TC-015");
    await unchanged(false);
  });

  it("TC-016 experimentalDecorators leave a class, method and accessor unchanged", async () => {
    trace("FR-002-AC-3", "TC-016");
    await unchanged(true);
  });

  it("TC-017 the wrapper returns the identical function and keeps its types", async () => {
    trace("FR-002-AC-4", "TC-017");
    const arrow = (n: number): string => String(n);
    const expression = function (n: number): string {
      return String(n);
    };
    expect(implementing("FR-002-AC-3")(arrow)).toBe(arrow);
    expect(implementing("FR-002-AC-3")(expression)).toBe(expression);
    const dir = project({
      "ok.ts": `import { implementing } from ${impl};
const f = implementing("A-1")((n: number): string => String(n));
const s: string = f(1);
const g = implementing("A-1")(function (n: number): number { return n; });
const n: number = g(1);
void s; void n;
`,
      "bad.ts": `import { implementing } from ${impl};
const f = implementing("A-1")((n: number): string => String(n));
f("x");
`,
    });
    expect((await typeCheck(dir, "ok.ts")).code).toBe(0);
    expect((await typeCheck(dir, "bad.ts")).out).toContain("TS2345");
  });

  const gcMain = (
    leak: string,
  ) => `import { implementing } from "./implementing";
declare const gc: unknown;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const keys = (o: object) => [...Object.getOwnPropertyNames(o), ...Object.getOwnPropertySymbols(o).map(String)];
async function main() {
  if (typeof gc !== "function") throw new Error("gc is not a function: run with --expose-gc");
  const refs: WeakRef<object>[] = [];
  const implementingBefore = keys(implementing);
  const scope = () => {
    const fn = () => 1;
    class K { m() { return 1; } }
    const method = K.prototype.m;
    const targets = [fn, K, method];
    const before = targets.map(keys);
    const marker = implementing("A-1", "A-2");
    for (const t of targets) marker(t);
    expect(targets.map(keys)).toEqual(before);
    for (const t of targets) refs.push(new WeakRef(t));
  };
  scope();
  expect(keys(implementing)).toEqual(implementingBefore);
  await tick();
  (gc as () => void)();
  await tick();
  const alive = refs.map((r) => r.deref() !== undefined);
  if (alive.some(Boolean)) throw new Error("retained: " + JSON.stringify(alive));
  console.log("released");
}
function expect(actual: unknown) {
  return { toEqual(expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("own keys changed");
  } };
}
${leak}
main().catch((e) => { console.error(String(e)); process.exit(1); });
`;

  const gcRun = async (source: string, leak = "", args = ["--expose-gc"]) =>
    compileAndRun(
      project({ "main.ts": gcMain(leak), "implementing.ts": source }),
      { nodeArgs: args },
    );

  it("TC-018 retains no reference to what it marks, and the test fails without gc", async () => {
    trace("FR-002-AC-5", "TC-018");
    const ok = await gcRun(implSource);
    expect(ok.code, ok.out).toBe(0);
    expect(ok.out).toContain("released");

    const noGc = await gcRun(implSource, "", []);
    expect(noGc.code).not.toBe(0);
    expect(noGc.out).toContain("gc is not a function");

    const tail = "return args.length === 1 ? args[0] : undefined;";
    expect(implSource).toContain(tail);
    expect(implSource).toContain("function mark(");
    const leaks: Record<string, string> = {
      "module-level array": `const registry: unknown[] = [];\n${implSource.replace(tail, `registry.push(args[0]);\n  ${tail}`)}`,
      "module-level Map": `const registry = new Map<unknown, boolean>();\n${implSource.replace(tail, `registry.set(args[0], true);\n  ${tail}`)}`,
      "closure array": `${implSource.replace("function mark(", "function markReal(")}
const mark = (() => {
  const seen: unknown[] = [];
  return (...args: unknown[]): unknown => {
    seen.push(args[0]);
    return markReal(...args);
  };
})();`,
    };
    for (const [name, source] of Object.entries(leaks)) {
      const run = await gcRun(source);
      expect(run.code, name).not.toBe(0);
      expect(run.out, name).toContain("retained");
    }
  });

  it("TC-019 throws a TypeError for no argument and for a non-string, accepts several and repeated ids", () => {
    trace("FR-002-AC-6", "TC-019");
    expect(() => (implementing as () => unknown)()).toThrow(TypeError);
    expect(() => (implementing as () => unknown)()).toThrow(
      'implementing("FR-007-AC-1")',
    );
    expect(() => implementing("A-1", 2 as unknown as string)).toThrow(
      "argument 2 must be a string, got number",
    );
    expect(() => implementing(null as unknown as string)).toThrow(
      "argument 1 must be a string, got null",
    );
    expect(() => implementing(undefined as unknown as string)).toThrow(
      TypeError,
    );
    expect(() => implementing("A-1", "B-2", "C_3-4")).not.toThrow();
    expect(() => implementing("A-1", "A-1")).not.toThrow();
  });

  it("TC-022 the returned function throws with no argument, returns undefined for two, the argument for one", () => {
    trace("FR-002-AC-9", "TC-022");
    const marker = implementing("A-1") as (...args: unknown[]) => unknown;
    expect(() => marker()).toThrow(TypeError);
    expect(() => marker()).toThrow("implementing(");
    const value = {};
    expect(marker(value)).toBe(value);
    expect(marker(value, {})).toBeUndefined();
    expect(marker(value, "key", {})).toBeUndefined();
  });

  it("TC-024 checks id shape and never membership", () => {
    trace("FR-002-AC-11", "TC-024", "FR-002-CON-4");
    for (const bad of ["", "FR 2", "A-1, A-2", "FR-XXX", "1-A"]) {
      expect(() => implementing(bad), bad).toThrow(TypeError);
      expect(() => implementing(bad), bad).toThrow(JSON.stringify(bad));
    }
    for (const good of ["ZZ-001", "MADEUP-042-AC-9", "interface_004-AC-1"]) {
      expect(() => implementing(good), good).not.toThrow();
    }
  });

  it("TC-025 a nested declaration checks its ids on each call and stays unchanged", () => {
    trace("FR-002-AC-12", "TC-025");
    let calls = 0;
    const counted = (id: string) => {
      calls++;
      return implementing(id);
    };
    const original = () => 1;
    const top = counted("A-1")(original);
    expect(calls).toBe(1);
    expect(top).toBe(original);
    const nested = (id: string) => {
      const inner = () => 2;
      return [inner, counted(id)(inner)] as const;
    };
    for (let i = 1; i <= 3; i++) {
      const [inner, marked] = nested("B-2");
      expect(marked).toBe(inner);
      expect(calls).toBe(1 + i);
    }
    expect(() => nested("not an id")).toThrow(TypeError);
  });

  it("TC-026 accepts the documented positions and rejects a field and a parameter", async () => {
    trace("FR-002-AC-13", "TC-026");
    const dir = project({
      "std-ok.ts": `import { implementing } from ${impl};
@implementing("A-1") class C {
  @implementing("A-1") m() {}
  @implementing("A-1") get g() { return 1; }
  @implementing("A-1") set s(v: number) { void v; }
}
const E = @implementing("A-1") class {};
void C; void E;
`,
      "std-field.ts": `import { implementing } from ${impl};
class C { @implementing("A-1") x = 1; }
void C;
`,
      "exp-ok.ts": `import { implementing } from ${impl};
@implementing("A-1") class C {
  @implementing("A-1") m() {}
  @implementing("A-1") get g() { return 1; }
  @implementing("A-1") set s(v: number) { void v; }
}
void C;
`,
      "exp-property.ts": `import { implementing } from ${impl};
class C { @implementing("A-1") x = 1; }
void C;
`,
      "exp-parameter.ts": `import { implementing } from ${impl};
class C { m(@implementing("A-1") p: number) { void p; } }
void C;
`,
    });
    const exp = ["--experimentalDecorators"];
    const ok = await typeCheck(dir, "std-ok.ts");
    expect(ok.out).toBe("");
    expect((await typeCheck(dir, "std-field.ts")).code).not.toBe(0);
    const expOk = await typeCheck(dir, "exp-ok.ts", exp);
    expect(expOk.out).toBe("");
    expect((await typeCheck(dir, "exp-property.ts", exp)).code).not.toBe(0);
    expect((await typeCheck(dir, "exp-parameter.ts", exp)).code).not.toBe(0);
  });

  it("TC-027 the package root exports exactly implementing", async () => {
    trace("FR-002-AC-14", "TC-027");
    const root = await import("../src");
    expect(Object.keys(root)).toEqual(["implementing"]);
  });

  it("TC-021 changes neither a test's registration nor its recorded trace ids", async () => {
    trace("FR-002-AC-8", "TC-021");
    const suite = (mark: (body: string) => string, describeMark: string) => ({
      "a.test.ts": `import { describe, it } from "vitest";
import { trace } from "__SRC__";
import { implementing } from "__IMPL__";
describe("suite", ${describeMark.replace(
        "BODY",
        `() => {
  it("one", ${mark(`() => { trace("X-1"); }`)});
  it("two", ${mark(`() => { trace("X-2", "X-3"); }`)});
}`,
      )});
`,
    });
    const plain = await runSuite(
      suite((b) => b, "BODY"),
      { emit: "1" },
    );
    const marked = await runSuite(
      suite(
        (b) => `implementing("FR-002-AC-8")(${b})`,
        `implementing("FR-002-AC-8")(BODY)`,
      ),
      { emit: "1" },
    );
    expect(plain.code, plain.output).toBe(0);
    expect(marked.code, marked.output).toBe(0);
    expect(plain.cases.map((c) => [c.name, c.trace, c.outcome])).toEqual([
      ["one", ["X-1"], "pass"],
      ["two", ["X-2", "X-3"], "pass"],
    ]);
    expect(marked.cases).toEqual(plain.cases);
  });
});
