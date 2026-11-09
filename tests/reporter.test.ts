import { execFile, execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

import { trace } from "../src";
import {
  REPO,
  SRC,
  header,
  makeProject,
  parseCases,
  removeProject,
  runSuite,
  runVitest,
} from "./support/run";

const exec = promisify(execFile);
const projects: string[] = [];
const project = (files: Record<string, string>) => {
  const dir = makeProject(files);
  projects.push(dir);
  return dir;
};
afterAll(() => projects.forEach(removeProject));

const hasTool = (cmd: string) => {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const hasQuire = hasTool("quire");
const hasQuoin = hasTool("quoin");

describe("FR-001 trace helper and reporter", () => {
  it("TC-001 trace type-checks string ids and rejects a non-string", async () => {
    trace("FR-001-AC-1", "TC-001");
    const dir = project({
      "ok.ts": `import { trace } from ${JSON.stringify(SRC.replace(/\.ts$/, ""))};
trace("A-1", "B-2");
const f: (...ids: string[]) => void = trace;
f();
`,
      "bad.ts": `import { trace } from ${JSON.stringify(SRC.replace(/\.ts$/, ""))};
trace(1);
`,
    });
    const tsc = join(REPO, "node_modules/typescript/bin/tsc");
    const args = [
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--module",
      "esnext",
      "--moduleResolution",
      "bundler",
      "--target",
      "esnext",
    ];
    await exec(process.execPath, [tsc, ...args, join(dir, "ok.ts")]);
    await expect(
      exec(process.execPath, [tsc, ...args, join(dir, "bad.ts")]),
    ).rejects.toMatchObject({
      stdout: expect.stringContaining("TS2345"),
    });
  });

  it("TC-002 emission off: helper records nothing, no trace property, results equal a no-package run, no runtime dependency", async () => {
    trace("FR-001-AC-2", "TC-002");
    const files = {
      "a.test.ts": `${header}
it("tagged", () => { trace("X-1"); });
it("empty meta", () => {
  trace("X-2");
  expect(TestRunner.getCurrentTest()!.meta).toEqual({});
});
it("fails", () => { trace("X-3"); expect(1).toBe(2); });
it.skip("skipped", () => {});
`,
    };
    const baseline = await runSuite(files, { plain: true });
    for (const emit of [undefined, "0", "true"] as const) {
      const run = await runSuite(files, { emit });
      expect(run.xml).not.toContain('name="trace"');
      expect(run.cases.map((c) => [c.name, c.outcome])).toEqual(
        baseline.cases.map((c) => [c.name.replace(/^.*> /, ""), c.outcome]),
      );
    }
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
    expect(pkg.dependencies).toBeUndefined();
  });

  it("TC-003 emission on: each distinct id once, uncalled test carries none", async () => {
    trace("FR-001-AC-3", "TC-003");
    const run = await runSuite(
      {
        "a.test.ts": `${header}
it("several", () => { trace("A-1", "A-2", "A-1"); });
it("twice", () => { trace("B-1"); trace("B-2", "B-1"); });
it("none", () => {});
`,
      },
      { emit: "1" },
    );
    const by = Object.fromEntries(
      run.cases.map((c) => [c.name, c.trace.sort()]),
    );
    expect(by).toEqual({
      several: ["A-1", "A-2"],
      twice: ["B-1", "B-2"],
      none: [],
    });
  });

  it("TC-004 emission on: ids are only trace arguments, none inferred from titles", async () => {
    trace("FR-001-AC-4", "TC-004");
    const run = await runSuite(
      {
        "FR-009-AC-9.test.ts": `${header}
it("FR-009-AC-9 TC-9 looks tagged", () => {});
it("explicit", () => { trace("Z-1"); });
`,
      },
      { emit: "1" },
    );
    const by = Object.fromEntries(run.cases.map((c) => [c.name, c.trace]));
    expect(by).toEqual({
      "FR-009-AC-9 TC-9 looks tagged": [],
      explicit: ["Z-1"],
    });
  });

  const symbolFixture = {
    "spec/.keep": "",
    "src/deep.test.ts": `${header}
describe("outer", () => {
  describe("inner", () => {
    it("nested title", () => { trace("N-1"); });
  });
});
it.each([1, 2])("adds %s", () => { trace("E-1"); });
test.each([[1], [2]])(\`tpl %s\`, () => { trace("E-2"); });
it.each(["a)"])("paren %s", () => { trace("E-3"); });
it.for([1, 2])("for %s", () => { trace("E-5"); });
it("plain \\"q\\" title", () => { trace("E-6"); });
test.each\`
  a | b
  \${1} | \${2}

\`("multi $a $b", () => { trace("E-7"); });
test.each\`
  a | b
  \${1} | \${2}
\`(
  "multi2 $a $b",
  () => { trace("E-8"); },
);
it.each([1])('quote\\'s %s', () => { trace("E-4"); });
`,
  };
  const symbols = [
    "nested title",
    "adds %s",
    "adds %s",
    "tpl %s",
    "tpl %s",
    "paren %s",
    "for %s",
    "for %s",
    'plain \\"q\\" title',
    "multi $a $b",
    "multi2 $a $b",
    "quote\\'s %s",
  ];

  it("TC-005 symbols: bare titles, each template, name == classname, file", async () => {
    const run = await runSuite(symbolFixture, { emit: "1" });
    expect(run.code).toBe(0);
    expect(run.cases.map((c) => c.name)).toEqual(symbols);
    for (const c of run.cases) {
      expect(c.classname).toBe(c.name);
      expect(c.file).toBe("src/deep.test.ts");
      expect(c.trace.length).toBe(1);
    }
  });

  it.skipIf(!hasQuire)(
    "TC-005 symbols equal what quire coverage --json reports",
    async () => {
      trace("FR-001-AC-5", "TC-005");
      const dir = project(symbolFixture);
      const run = await runVitest(dir, { emit: "1" });
      const { stdout } = await exec(
        "quire",
        ["coverage", "--json", "--scope", dir],
        { maxBuffer: 64 * 1024 * 1024 },
      );
      const report = JSON.parse(stdout) as {
        untracked_symbols: { path: string; symbol: string }[];
      };
      const key = (path: string, name: string) => `${path}::${name}`;
      const extractor = new Set(
        report.untracked_symbols.map((s) => key(s.path, s.symbol)),
      );
      const emitted = new Set(run.cases.map((c) => key(c.file, c.name)));
      expect(emitted).toEqual(extractor);
    },
  );

  it("TC-006 modifier registrations report the registered title once with the runner's outcome", async () => {
    trace("FR-001-AC-6", "TC-006");
    const run = await runSuite(
      {
        "a.test.ts": `${header}
it.skipIf(true)("skipif title", () => { trace("S-1"); });
it.skip("skip title", () => { trace("S-2"); });
it("plain title", () => { trace("P-1"); });
`,
        "only.test.ts": `${header}
it.only("only title", () => { trace("O-1"); });
it("not run under only", () => {});
`,
      },
      { emit: "1" },
    );
    const by = Object.fromEntries(
      run.cases.map((c) => [c.name, [c.outcome, c.trace]]),
    );
    expect(by).toEqual({
      "skipif title": ["skip", []],
      "skip title": ["skip", []],
      "plain title": ["pass", ["P-1"]],
      "only title": ["pass", ["O-1"]],
      "not run under only": ["skip", []],
    });
    expect(run.cases).toHaveLength(5);
  });

  it("TC-007 a test that calls trace then throws is fail with its ids", async () => {
    trace("FR-001-AC-7", "TC-007");
    const run = await runSuite(
      {
        "a.test.ts": `${header}
it("throws", () => { trace("T-1"); throw new Error("boom"); });
it("asserts", () => { trace("T-2"); expect(1).toBe(2); });
it("throws first", () => { throw new Error("early"); trace("T-3"); });
`,
      },
      { emit: "1" },
    );
    const by = Object.fromEntries(
      run.cases.map((c) => [c.name, [c.outcome, c.trace]]),
    );
    expect(by).toEqual({
      throws: ["fail", ["T-1"]],
      asserts: ["fail", ["T-2"]],
      "throws first": ["fail", []],
    });
  });

  it("TC-008 parallel files keep ids unmixed; trace() in a concurrent test throws", async () => {
    trace("FR-001-AC-8", "TC-008");
    const files: Record<string, string> = {};
    for (let f = 0; f < 6; f++) {
      let body = header;
      for (let t = 0; t < 5; t++) {
        body += `it("f${f}t${t}", async () => { await new Promise((r) => setTimeout(r, ${(f * 7 + t * 3) % 11})); trace("ID-${f}-${t}"); });\n`;
      }
      files[`f${f}.test.ts`] = body;
    }
    const run = await runSuite(files, { emit: "1" });
    expect(run.cases).toHaveLength(30);
    for (const c of run.cases) {
      const [, f, t] = /f(\d)t(\d)/.exec(c.name)!;
      expect(c.trace).toEqual([`ID-${f}-${t}`]);
    }

    const conc = await runSuite(
      {
        "c.test.ts": `${header}
it.concurrent("direct", () => { trace("C-1"); });
describe.concurrent("inherits", () => {
  it("member", () => { trace("C-2"); });
});
`,
      },
      { emit: "1" },
    );
    expect(conc.cases).toHaveLength(2);
    for (const c of conc.cases) {
      expect(c.outcome).toBe("fail");
      expect(c.trace).toEqual([]);
      expect(c.body).toContain("called in a concurrent test");
    }
  });

  it("TC-009 the reporter writes the result file during the run; no sidecar, no rewrite step", async () => {
    trace("FR-001-AC-9", "TC-009");
    const dir = project({
      "a.test.ts": `${header}\nit("one", () => { trace("W-1"); });\n`,
    });
    const run = await runVitest(dir, { emit: "1" });
    expect(run.output).toContain("JUNIT report written");
    expect(
      readdirSync(dir)
        .filter((f) => f !== "node_modules")
        .sort(),
    ).toEqual(["a.test.ts", "junit.xml", "vitest.config.mts"]);
    expect(parseCases(run.xml!)[0].trace).toEqual(["W-1"]);
  });

  it.skipIf(!hasQuoin)(
    "TC-011 end to end: quoin evidence record binds a passing run and binds nothing for a failing one",
    async () => {
      trace("FR-001-AC-11", "TC-011");
      const record = async (assertion: string) => {
        const dir = project({
          "a.test.ts": `${header}\nit("verifies", () => { trace(["FR-001-AC", "1"].join("-")); ${assertion} });\n`,
        });
        await exec("cp", ["-r", join(REPO, "spec"), join(dir, "spec")]);
        await exec("git", ["init", "-q"], { cwd: dir });
        await exec(
          "git",
          [
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@t",
            "commit",
            "-q",
            "--allow-empty",
            "-m",
            "x",
          ],
          { cwd: dir },
        );
        const { stdout: sha } = await exec("git", ["rev-parse", "HEAD"], {
          cwd: dir,
        });
        const run = await runVitest(dir, { emit: "1" });
        const { stdout } = await exec(
          "quoin",
          [
            "evidence",
            "record",
            "--suite",
            "s",
            "--commit",
            sha.trim(),
            "--tool",
            "vitest",
            "--results",
            join(dir, "junit.xml"),
            "--adapter",
            "junit",
            "--json",
          ],
          { cwd: dir },
        );
        return { run, outcome: JSON.parse(stdout) as { bound: string[] } };
      };
      const pass = await record("");
      expect(pass.run.cases[0].outcome).toBe("pass");
      expect(pass.outcome.bound).toEqual(["FR-001-AC-1"]);
      const fail = await record("expect(1).toBe(2);");
      expect(fail.run.cases[0].outcome).toBe("fail");
      expect(fail.outcome.bound).toEqual([]);
    },
    60_000,
  );

  it("TC-012 an each whose template cannot be recovered fails the run naming the test", async () => {
    trace("FR-001-AC-12", "TC-012");
    for (const registration of [
      `const title = "held %s"; it.each([1])(title, () => {});`,
      `const n = "x"; it.each([1])("built " + n + " %s", () => {});`,
      `const t = "z %s"; it.each(["a)"])(t, () => {});`,
    ]) {
      const run = await runSuite(
        { "a.test.ts": `${header}\n${registration}\n` },
        { emit: "1" },
      );
      expect(run.code).not.toBe(0);
      expect(run.output).toMatch(/cannot name test "(held 1|built x 1|z a\))"/);
      expect(run.xml ?? "").not.toMatch(/held 1|built x 1|z a\)/);
    }
  });

  it("TC-013 emission off: configured reporter still writes the plain JUnit result", async () => {
    trace("FR-001-AC-13", "TC-013");
    const files = {
      "a.test.ts": `${header}
describe("d", () => {
  it("pass", () => { trace("Q-1"); });
  it("fail", () => { expect(1).toBe(2); });
  it.skip("skip", () => {});
});
`,
    };
    const normalise = (xml: string) =>
      xml
        .replace(/\b(time|timestamp|hostname)="[^"]*"/g, "")
        .replace(/<failure[\s\S]*?<\/failure>/g, "<failure/>")
        .replace(/\s+/g, " ");
    const plain = await runSuite(files, { plain: true });
    const off = await runSuite(files, {});
    expect(off.xml).toBeDefined();
    expect(off.xml).not.toContain('name="trace"');
    expect(normalise(off.xml!)).toBe(normalise(plain.xml!));
  });
});
