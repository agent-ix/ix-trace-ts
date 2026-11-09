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
export const SRC = join(REPO, "src/index.ts");
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
  /** User plus system CPU seconds of the vitest process tree. */
  cpuSeconds: number;
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
    writeFileSync(target, text.replaceAll("__SRC__", SRC));
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
    // bash's `time` reports user and system CPU of the command and its children.
    execFile(
      "bash",
      [
        "-c",
        'TIMEFORMAT="%3U %3S"; time "$0" "$@"',
        process.execPath,
        VITEST,
        "run",
        "--root",
        dir,
        "--allowOnly",
      ],
      { env, cwd: dir, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        let xml: string | undefined;
        try {
          xml = readFileSync(join(dir, "junit.xml"), "utf8");
        } catch {
          xml = undefined;
        }
        const times = /(\d+\.\d+) (\d+\.\d+)\s*$/.exec(stderr);
        const cpuSeconds = times ? Number(times[1]) + Number(times[2]) : NaN;
        const code = error ? ((error as { code?: number }).code ?? 1) : 0;
        done({
          dir,
          code,
          output: stdout + stderr,
          cpuSeconds,
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
