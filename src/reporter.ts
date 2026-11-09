import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { hostname } from "node:os";

import type {
  JUnitReporter,
  Reporter,
  TestCase,
  TestModule,
  Vitest,
} from "vitest/node";

import { recoverTitle, TemplateNotRecovered } from "./template";
import { emissionEnabled, TRACE_META_KEY } from "./trace";

export interface TraceReporterOptions {
  /** Where the JUnit file is written; defaults to vitest's `outputFile` config. */
  outputFile?: string;
}

interface Row {
  symbol: string;
  file: string;
  state: "passed" | "failed" | "skipped" | "pending";
  seconds: number;
  ids: string[];
  errors: { message?: string; name?: string; stack?: string }[];
}

function escapeXml(value: string): string {
  return value
    .replace(/[\0-\x08\v\f\x0E-\x1F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attrs(values: Record<string, string | number>): string {
  return Object.entries(values)
    .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
    .join(" ");
}

/**
 * Vitest reporter. Without `QUIRE_TRACE_EMIT=1` it is vitest's own JUnit
 * reporter. With it, it writes the JUnit file itself, adding the `trace`
 * property declared by `trace()` and naming each case by its source symbol.
 */
export class TraceReporter implements Reporter {
  private plain: JUnitReporter | undefined;
  private ctx: Vitest | undefined;

  constructor(private readonly options: TraceReporterOptions = {}) {}

  async onInit(ctx: Vitest): Promise<void> {
    this.ctx = ctx;
    if (!emissionEnabled()) {
      // Loaded here so test workers that import `trace` never load vitest/node.
      const { JUnitReporter } = await import("vitest/node");
      this.plain = new JUnitReporter(this.options);
      await this.plain.onInit(ctx);
      return;
    }
    // Workers read this to attach the registration location to each task.
    ctx.config.includeTaskLocation = true;
    for (const project of ctx.projects) {
      project.config.includeTaskLocation = true;
    }
  }

  async onTestRunEnd(testModules: ReadonlyArray<TestModule>): Promise<void> {
    const ctx = this.ctx;
    if (this.plain) {
      await this.plain.onTestRunEnd(testModules);
      return;
    }
    if (!ctx) return;
    const root = ctx.config.root;
    const modules: { name: string; rows: Row[] }[] = [];
    const failures: string[] = [];
    for (const mod of testModules) {
      const file = relative(root, mod.moduleId).split("\\").join("/");
      const source = readSource(mod.moduleId);
      const rows: Row[] = [];
      for (const test of mod.children.allTests()) {
        try {
          rows.push(row(test, file, source));
        } catch (error) {
          failures.push(
            `ix-trace-ts: cannot name test "${test.name}" in ${file}: ${(error as Error).message}`,
          );
        }
      }
      modules.push({ name: file, rows });
    }
    if (failures.length > 0) {
      for (const message of failures) ctx.logger.error(message);
      process.exitCode = 1;
      return;
    }
    this.write(ctx, modules);
  }

  private write(ctx: Vitest, modules: { name: string; rows: Row[] }[]): void {
    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8" ?>'];
    const all = modules.flatMap((m) => m.rows);
    const failed = (rows: Row[]) =>
      rows.filter((r) => r.state === "failed").length;
    const time = (rows: Row[]) => rows.reduce((sum, r) => sum + r.seconds, 0);
    lines.push(
      `<testsuites ${attrs({ name: "vitest tests", tests: all.length, failures: failed(all), errors: 0, time: time(all) })}>`,
    );
    for (const mod of modules) {
      lines.push(
        `    <testsuite ${attrs({
          name: mod.name,
          timestamp: new Date().toISOString(),
          hostname: hostname(),
          tests: mod.rows.length,
          failures: failed(mod.rows),
          errors: 0,
          skipped: mod.rows.filter(
            (r) => r.state === "skipped" || r.state === "pending",
          ).length,
          time: time(mod.rows),
        })}>`,
      );
      for (const r of mod.rows) {
        lines.push(
          `        <testcase ${attrs({ classname: r.symbol, file: r.file, name: r.symbol, time: r.seconds })}>`,
        );
        if (r.ids.length > 0) {
          lines.push(
            `            <property ${attrs({ name: "trace", value: r.ids.join(",") })}/>`,
          );
        }
        if (r.state === "skipped" || r.state === "pending") {
          lines.push("            <skipped/>");
        }
        if (r.state === "failed") {
          for (const e of r.errors) {
            lines.push(
              `            <failure ${attrs({ message: e.message ?? "", type: e.name ?? "Error" })}>${escapeXml(e.stack ?? e.message ?? "")}</failure>`,
            );
          }
          if (r.errors.length === 0) lines.push("            <failure/>");
        }
        lines.push("        </testcase>");
      }
      lines.push("    </testsuite>");
    }
    lines.push("</testsuites>");
    const text = `${lines.join("\n")}\n`;
    const outputFile = this.options.outputFile ?? configuredOutput(ctx);
    if (outputFile) {
      const target = resolve(ctx.config.root, outputFile);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, text);
      ctx.logger.log(`JUNIT report written to ${target}`);
    } else {
      ctx.logger.log(text);
    }
  }
}

function configuredOutput(ctx: Vitest): string | undefined {
  const out = ctx.config.outputFile as
    | string
    | Record<string, string>
    | undefined;
  return typeof out === "string" ? out : out?.junit;
}

function readSource(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

function row(test: TestCase, file: string, source: string | undefined): Row {
  const result = test.result();
  const diagnostic = test.diagnostic();
  const ids = (test.meta() as Record<string, unknown>)[TRACE_META_KEY];
  return {
    symbol: symbolOf(test, source),
    file,
    state: result.state,
    seconds: (diagnostic?.duration ?? 0) / 1000,
    ids: Array.isArray(ids) ? [...new Set(ids as string[])] : [],
    errors: "errors" in result && result.errors ? [...result.errors] : [],
  };
}

function symbolOf(test: TestCase, source: string | undefined): string {
  const each = (test as unknown as { task: { each?: boolean } }).task.each;
  const location = test.location;
  if (!location || source === undefined) {
    if (each) {
      throw new TemplateNotRecovered(
        "the registration location or source is unavailable",
      );
    }
    return test.name;
  }
  try {
    return recoverTitle(
      source,
      location.line,
      location.column,
      test.name,
      !!each,
    );
  } catch (error) {
    // A plain title held in a variable is the registered title itself.
    if (each || !(error instanceof TemplateNotRecovered)) throw error;
    return test.name;
  }
}
