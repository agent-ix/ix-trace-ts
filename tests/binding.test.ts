import { execFile, execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { delimiter, join } from "node:path";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

import { trace } from "../src/vitest";
import { compileAndRun, makeProject, removeProject } from "./support/run";

const exec = promisify(execFile);
const projects: string[] = [];
const project = (files: Record<string, string>) => {
  const dir = makeProject(files);
  projects.push(dir);
  return dir;
};
afterAll(() => projects.forEach(removeProject));

const hasQuire = (() => {
  try {
    execFileSync("quire", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

/**
 * Module directories, found the way quire finds them: every entry of
 * IX_FILAMENT_MODULES_PATH (a path-delimited list, each entry either a module
 * directory or a directory of modules). Nothing is copied into this repo.
 */
function moduleDirs(): string[] {
  const found: string[] = [];
  for (const root of (process.env.IX_FILAMENT_MODULES_PATH ?? "")
    .split(delimiter)
    .filter(Boolean)) {
    if (existsSync(join(root, "manifest.yaml"))) found.push(root);
    else if (existsSync(root))
      for (const name of readdirSync(root))
        if (existsSync(join(root, name, "manifest.yaml")))
          found.push(join(root, name));
  }
  return found;
}

const modules = moduleDirs();
const declaresForms = modules.some((dir) => {
  const text = readFileSync(join(dir, "manifest.yaml"), "utf8");
  return (
    text.includes("syntax: typescript_decorator") &&
    text.includes("syntax: typescript_wrapper")
  );
});
const skipReason = !hasQuire
  ? "quire is not on PATH"
  : !declaresForms
    ? "IX_FILAMENT_MODULES_PATH names no spec-artifacts-process module that declares typescript_decorator and typescript_wrapper"
    : undefined;

const production = (importLine: string) => `${importLine}
import * as ixTrace from "./implementing";
import { implementing as renamed } from "./implementing";

@implementing("FR-001", "FR-002")
export class Widget {
  @ixTrace.implementing("FR-003")
  method() {
    return 1;
  }
  @implementing("FR-004")
  get acc() {
    return 2;
  }
}
export const plain = implementing("FR-005")(() => 5);
export const qualified = ixTrace.implementing("FR-006")(() => 6);
@renamed("FR-007")
export class Renamed {}
export const single = implementing('FR-008')(() => 8);
export const template = implementing(\`FR-009\`)(() => 9);
export const concat = implementing("FR-0" + "10")(() => 10);
`;
const IMPORT = `import { implementing } from "./implementing";`;

describe("FR-002 static binding through quire", { timeout: 120_000 }, () => {
  it.skipIf(skipReason !== undefined)(
    "TC-023 marked class, method, accessor and wrapped const bind implements through quire coverage",
    async () => {
      trace("FR-002-AC-10", "TC-023");
      const dir = project({
        "src/prod.ts": production(IMPORT),
        "spec/.keep": "",
      });
      const { stdout } = await exec(
        "quire",
        [
          "coverage",
          "--json",
          "--scope",
          dir,
          ...modules.flatMap((m) => ["--module", m]),
        ],
        { maxBuffer: 64 * 1024 * 1024 },
      );
      const report = JSON.parse(stdout) as Record<string, unknown> & {
        implements: { path: string; symbol: string; trace_id: string }[];
      };
      const bound = report.implements
        .map((r) => `${r.path}::${r.symbol}::${r.trace_id}`)
        .sort();
      expect(bound).toEqual(
        [
          "Widget::FR-001",
          "Widget::FR-002",
          "Widget.acc::FR-004",
          "Widget.method::FR-003",
          "plain::FR-005",
          "qualified::FR-006",
        ]
          .map((s) => `src/prod.ts::${s}`)
          .sort(),
      );
      // Static binding is `implements`, never `verifies`.
      expect(JSON.stringify(report)).not.toContain("verifies");

      // The same file, with the same marked declarations, runs unchanged:
      // renamed import, single-quoted, template-literal and concatenated ids
      // execute and bind nothing.
      const runDir = project({
        "main.ts": `import * as p from "./prod";
console.log(JSON.stringify([new p.Widget().method(), new p.Widget().acc, p.plain(), p.qualified(), p.single(), p.template(), p.concat(), typeof p.Renamed]));`,
        "prod.ts": production(IMPORT),
        "implementing.ts": readFileSync(
          join(__dirname, "../src/implementing.ts"),
          "utf8",
        ),
      });
      const run = await compileAndRun(runDir);
      expect(run.code, run.out).toBe(0);
      expect(JSON.parse(run.out)).toEqual([1, 2, 5, 6, 8, 9, 10, "function"]);
    },
  );
});
