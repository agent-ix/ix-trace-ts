import { TestRunner } from "vitest";

/** The environment variable that enables emission. Nothing else does. */
export const EMIT_ENV = "QUIRE_TRACE_EMIT";

/** The key under which declared ids travel on a test's `meta`. */
export const TRACE_META_KEY = "quireTraceIds";

/** True only while `QUIRE_TRACE_EMIT` is exactly `1`. */
export function emissionEnabled(): boolean {
  return process.env[EMIT_ENV] === "1";
}

/**
 * Declare the requirement ids the running test verifies.
 *
 * Does nothing unless `QUIRE_TRACE_EMIT=1`. Throws when called in a concurrent
 * test, because the current-test slot cannot be trusted there.
 */
export function trace(...ids: string[]): void {
  if (!emissionEnabled()) return;
  const test = TestRunner.getCurrentTest();
  if (test === undefined) {
    throw new Error("trace() was called outside a running test");
  }
  if (test.concurrent) {
    throw new Error(
      `trace() was called in a concurrent test; the test observed as running is "${test.name}", which may be another concurrent test. Concurrent tests are unsupported.`,
    );
  }
  const meta = test.meta as Record<string, unknown>;
  const declared = (meta[TRACE_META_KEY] as string[] | undefined) ?? [];
  for (const id of ids) {
    if (!declared.includes(id)) declared.push(id);
  }
  meta[TRACE_META_KEY] = declared;
}
