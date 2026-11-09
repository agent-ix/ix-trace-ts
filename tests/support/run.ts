import { execFile } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(here, "../..");
export const SRC = join(REPO, "src/vitest.ts");
export const IMPL = join(REPO, "src/index.ts");
const VITEST = join(REPO, "node_modules/vitest/vitest.mjs");

export type Emit = "1" | "0" | "true" | undefined;

export interface RunOptions {
  /** Value of QUIRE_TRACE_EMIT for the run; undefined leaves it unset. */
  emit?: Emit;
  /** Use vitest's own junit reporter instead of this package's reporter. */
  plain?: boolean;
  /** Extra `test` config, as source text of an object literal body. */
  testConfig?: string;
}

export interface Case {
  name: string;
  classname: string;
  file: string;
  trace: string[];
  outcome: "pass" | "fail" | "skip";
  body: string;
}

export interface Run {
  dir: string;
  code: number;
  output: string;
  xml: string | undefined;
  cases: Case[];
}

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

function attributes(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of text.matchAll(/([\w:-]+)="([^"]*)"/g))
    out[m[1]] = unescapeXml(m[2]);
  return out;
}

export function parseCases(xml: string): Case[] {
  const cases: Case[] = [];
  for (const m of xml.matchAll(
    /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g,
  )) {
    const attrs = attributes(m[1]);
    const body = m[3] ?? "";
    const trace: string[] = [];
    for (const p of body.matchAll(/<property\b([^>]*?)\/?>/g)) {
      const a = attributes(p[1]);
      if (a.name === "trace")
        trace.push(...a.value.split(/[\s,]+/).filter(Boolean));
    }
    cases.push({
      name: attrs.name,
      classname: attrs.classname,
      file: attrs.file,
      trace,
      outcome: /<failure\b|<error\b/.test(body)
        ? "fail"
        : /<skipped\b/.test(body)
          ? "skip"
          : "pass",
      body,
    });
  }
  return cases;
}

/** Write a fixture project into a fresh temp dir. Files map path to source text. */
export function makeProject(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "ix-trace-ts-"));
  for (const [path, text] of Object.entries(files)) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(
      target,
      text.replaceAll("__SRC__", SRC).replaceAll("__IMPL__", IMPL),
    );
  }
  return dir;
}

export function removeProject(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Run vitest in a subprocess over an existing fixture project. */
export function runVitest(dir: string, options: RunOptions = {}): Promise<Run> {
  const reporter = options.plain
    ? `["junit", { outputFile: "junit.xml" }]`
    : `new TraceReporter({ outputFile: "junit.xml" })`;
  writeFileSync(
    join(dir, "vitest.config.mts"),
    `import { TraceReporter } from ${JSON.stringify(SRC)};
export default { test: { reporters: [${reporter}], ${options.testConfig ?? ""} } };
`,
  );
  const env = { ...process.env };
  delete env.QUIRE_TRACE_EMIT;
  delete env.CI;
  env.VITE_CONFIG_NATIVE_IGNORE_WARNING = "true";
  if (options.emit !== undefined) env.QUIRE_TRACE_EMIT = options.emit;
  return new Promise((done) => {
    execFile(
      process.execPath,
      [VITEST, "run", "--root", dir, "--allowOnly"],
      { env, cwd: dir, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        let xml: string | undefined;
        try {
          xml = readFileSync(join(dir, "junit.xml"), "utf8");
        } catch {
          xml = undefined;
        }
        const code = error ? ((error as { code?: number }).code ?? 1) : 0;
        done({
          dir,
          code,
          output: stdout + stderr,
          xml,
          cases: xml ? parseCases(xml) : [],
        });
      },
    );
  });
}

/** Write files, run vitest once, remove the project. */
export async function runSuite(
  files: Record<string, string>,
  options: RunOptions = {},
): Promise<Run> {
  const dir = makeProject(files);
  try {
    return await runVitest(dir, options);
  } finally {
    removeProject(dir);
  }
}

export const header = `import { TestRunner, describe, expect, it, test } from "vitest";
import { trace } from "__SRC__";
`;

const TSC = join(REPO, "node_modules/typescript/bin/tsc");

/** Type-check one fixture file; `code` is tsc's exit status, `out` its diagnostics. */
export function typeCheck(
  dir: string,
  file: string,
  flags: string[] = [],
): Promise<{ code: number; out: string }> {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [
        TSC,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--module",
        "esnext",
        "--moduleResolution",
        "bundler",
        "--target",
        "esnext",
        "--types",
        "node",
        "--typeRoots",
        join(REPO, "node_modules/@types"),
        ...flags,
        join(dir, file),
      ],
      (error, stdout, stderr) =>
        done({
          code: error ? ((error as { code?: number }).code ?? 1) : 0,
          out: stdout + stderr,
        }),
    );
  });
}

export interface Compiled {
  code: number;
  out: string;
}

/**
 * Compile fixture files with tsc to CommonJS next to a copy of the construct's
 * source (written by the caller as `implementing.ts`), then run `main.js` under
 * node.
 */
export function compileAndRun(
  dir: string,
  options: { experimental?: boolean; nodeArgs?: string[] } = {},
): Promise<Compiled> {
  return new Promise((done) => {
    const flags = options.experimental ? ["--experimentalDecorators"] : [];
    execFile(
      process.execPath,
      [
        TSC,
        "--strict",
        "--skipLibCheck",
        "--target",
        "es2022",
        "--module",
        "commonjs",
        "--outDir",
        join(dir, "out"),
        "--types",
        "node",
        "--typeRoots",
        join(REPO, "node_modules/@types"),
        ...flags,
        join(dir, "main.ts"),
        join(dir, "implementing.ts"),
      ],
      (compileError, compileOut, compileErr) => {
        if (compileError) {
          done({ code: 1, out: `tsc: ${compileOut}${compileErr}` });
          return;
        }
        execFile(
          process.execPath,
          [...(options.nodeArgs ?? []), join(dir, "out/main.js")],
          (error, stdout, stderr) =>
            done({
              code: error ? ((error as { code?: number }).code ?? 1) : 0,
              out: stdout + stderr,
            }),
        );
      },
    );
  });
}
