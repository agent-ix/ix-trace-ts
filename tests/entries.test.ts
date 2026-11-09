import { execFile } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { trace } from "../src/vitest";
import { REPO } from "./support/run";

const exec = promisify(execFile);
const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
const outside = mkdtempSync(join(tmpdir(), "ix-trace-ts-entry-"));
afterAll(() => rmSync(outside, { recursive: true, force: true }));

beforeAll(async () => {
  await exec(
    process.execPath,
    [join(REPO, "node_modules/vite/bin/vite.js"), "build"],
    {
      cwd: REPO,
      env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: "true" },
    },
  );
}, 180_000);

const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/\b(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map(
    (m) => m[1],
  );

/** Every specifier reachable from a built entry, following relative imports. */
function reachable(entry: string, seen = new Set<string>()): string[] {
  if (seen.has(entry)) return [];
  seen.add(entry);
  const specifiers: string[] = [];
  for (const spec of importSpecifiers(readFileSync(entry, "utf8"))) {
    specifiers.push(spec);
    if (spec.startsWith(".")) {
      specifiers.push(...reachable(resolve(dirname(entry), spec), seen));
    }
  }
  return specifiers;
}

describe("FR-002 package entries", { timeout: 60_000 }, () => {
  it("TC-020 the root loads where vitest cannot be resolved", async () => {
    trace("FR-002-AC-7", "TC-020");
    cpSync(join(REPO, "dist/index.js"), join(outside, "index.mjs"));
    const script = `
let resolved = true;
try { await import("vitest"); } catch { resolved = false; }
const mod = await import(${JSON.stringify(join(outside, "index.mjs"))});
const marker = mod.implementing("FR-002-AC-7");
const fn = () => 1;
console.log(JSON.stringify({ resolved, same: marker(fn) === fn }));
`;
    const { stdout } = await exec(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: outside },
    );
    expect(JSON.parse(stdout)).toEqual({
      resolved: false,
      same: true,
    });
  });

  it("TC-028 no vitest specifier is reachable from the built root and there is no runtime dependency", () => {
    trace("FR-002-AC-15", "TC-028");
    const specifiers = reachable(join(REPO, "dist/index.js"));
    expect(specifiers.filter((s) => s.includes("vitest"))).toEqual([]);
    expect(pkg.dependencies).toBeUndefined();
  });

  it("TC-029 the exports map declares . and ./vitest, and only the subpath exports trace and TraceReporter", async () => {
    trace("FR-002-AC-16", "TC-029", "FR-001-AC-14");
    expect(Object.keys(pkg.exports)).toEqual([".", "./vitest"]);
    const script = `
const root = await import("@agent-ix/ix-trace-ts");
const sub = await import("@agent-ix/ix-trace-ts/vitest");
console.log(JSON.stringify({
  root: Object.keys(root),
  trace: typeof sub.trace,
  reporter: typeof sub.TraceReporter,
}));
`;
    const { stdout } = await exec(
      process.execPath,
      ["--input-type=module", "-e", script],
      { cwd: REPO },
    );
    expect(JSON.parse(stdout)).toEqual({
      root: ["implementing"],
      trace: "function",
      reporter: "function",
    });
    const readme = readFileSync(join(REPO, "README.md"), "utf8");
    expect(readme).toContain('from "@agent-ix/ix-trace-ts/vitest"');
    expect(readme).not.toMatch(
      /import\s*\{[^}]*\b(trace|TraceReporter)\b[^}]*\}\s*from\s*"@agent-ix\/ix-trace-ts"/,
    );
  });
});
