---
id: SR-006
title: "Code review of agent-ix/ix-trace-ts PR 3 (PLAT-334): vitest trace() helper and reporter"
type: SpecReview
analysis: code-review
scope: "agent-ix/ix-trace-ts; src/, tests/, vite.config.ts, package.json, README.md, spec/tests.md (PR 3 diff only, head 0ba515f)"
review_set: subset
---

## Summary

Ticket: PLAT-334. PR 3, head `0ba515f`, scoped to `git diff origin/main...HEAD`. This covers the code-review method with its TypeScript and test-quality lane. There are no `.tsx` files and no React, so review-react does not apply. All checks ran on a `git archive` copy of the head commit in a scratch directory, not in the repository.

Evidence gathered:

- The change-scoped tests (`tests/index.test.ts`, `tests/reporter.test.ts`, `tests/scripts.test.ts`) pass: 17 of 17, with quire 0.36.2 and quoin 0.29.1 on PATH. eslint is clean and `tsc --noEmit` is clean.
- With `CI=true`, which GitHub Actions sets, TC-006 fails (FND-005).
- With 14 busy-loop processes loading all 14 cores, TC-010 failed 1 run in 3, at a median ratio of 1.19 (FND-006). On an idle machine three runs gave ratios of 0.928, 0.944 and 0.927.
- With emission off, `--configLoader runner` and the package loaded from a path outside `node_modules`, the run fails with `Error: Vite module runner has been closed` and writes no JUnit file (FND-004). With the package installed under `node_modules`, the same run succeeds.
- An `it.each` registration whose table holds a `)` inside a string, `it.each(["a)"])("x %s", …)`, is written as `name="x a)"`, the interpolated title, and the run exits 0 (FND-001).
- `quire coverage --json` reports titles as raw source text (`b\'s %s`, `plain \"q\" title`). The reporter writes the decoded values (`b's %s`, `plain "q" title`), so the symbols differ (FND-003).

Examined: src/trace.ts, src/reporter.ts, src/template.ts, src/index.ts, tests/reporter.test.ts, tests/index.test.ts, tests/support/run.ts, vite.config.ts, package.json, README.md, spec/tests.md, against FR-001-AC-1 through FR-001-AC-13 and FR-001-CON-1. Context only: spec/functional/FR-001-vitest-trace-helper-and-reporter.md (Limits and Symbol sections).

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | high | `followsEach` decides whether a test is an `each` form by scanning parentheses backwards through raw source, and that scan does not skip string literals. When a `)` or `(` sits inside a string in the `each` table, for example `it.each(["a)"])("x %s", …)`, the scan matches the wrong `(`, `recoverEachTemplate` returns `undefined`, and `symbolOf` silently writes the interpolated title (`x a)`) with exit 0. This breaks the FR-001 rule that the reporter never falls back to the interpolated title (AC-12), and the ids do not bind because quire reports `x %s` (AC-5). Fix: decide each-ness from vitest's own `task.each` flag (`TestCase.task.each`, documented as "produced with `.each()`"), and throw `TemplateNotRecovered` whenever an each task's literal cannot be read. | src/template.ts:25-49; src/reporter.ts:197-203 |
| FND-002 | medium | `symbolOf` returns `test.name` whenever `test.location` is missing or the module source cannot be read, for an `each` task too. In that case the reporter silently writes the interpolated title instead of failing the run. FR-001 says the enabled run fails naming the test and never falls back. Fix: when `test.task.each` is true and the location or source is missing, raise the same naming failure that AC-12 uses. | src/reporter.ts:181-187,197-203 |
| FND-003 | medium | Symbols for titles containing escape sequences do not equal `quire coverage --json`, which AC-5 requires. quire reports the raw source text (`b\'s %s`, `plain \"q\" title`, `A %s`). For `each` titles the reporter decodes escapes itself (`b's %s`), and it decodes `A` wrongly to `u0041` because `ESCAPES` has no `u`, `x` or line continuation. For plain titles it writes vitest's runtime string (`plain "q" title`). FR-001 says "exactly as written in source". Fix: for `each`, return the raw literal body without decoding it. For a plain title, either read the raw literal at the task location in the same way, or get the contract with quire-rs FR-051 settled (raw or cooked) and add an escaped-title row to the TC-005 fixture. | src/template.ts:4-12,52-76; src/reporter.ts:197-203 |
| FND-004 | medium | With emission off, `onInit` calls `await import("vitest/node")` lazily. Under `vitest run --configLoader runner`, when the package resolves outside `node_modules` (a `link:`/workspace dependency or a source path), that import goes through the config loader's module runner after the runner has closed. The run then fails with `Error: Vite module runner has been closed` and writes no JUnit file, which breaks AC-13 ("the reporter never writes nothing"). The default `bundle` loader works, and so does an installed copy under `node_modules`. The FR-001 Limits section does not state this limitation. Fix: take the reporter off the lazy import, for example with a `./reporter` subpath entry that imports `JUnitReporter` statically so workers importing `trace` still never load `vitest/node`. Otherwise, state the limitation in FR-001 Limits. | src/reporter.ts:57-64; spec/functional/FR-001-vitest-trace-helper-and-reporter.md:79-103 |
| FND-005 | high | TC-006 fails whenever `CI=true`, which GitHub Actions always sets. Its fixture uses `it.only`, `runVitest` passes `process.env` through to the child vitest, and vitest refuses `.only` under CI unless `--allowOnly` is given. So `make test` in the repo's CI workflow goes red. Reproduced with `CI=true vitest run tests/reporter.test.ts -t TC-006`; every other TC passes under `CI=true`. Fix: pass `--allowOnly` to the child vitest, or delete `CI` from the child environment, in `runVitest`. | tests/support/run.ts:113-123; tests/reporter.test.ts:183-209 |
| FND-006 | medium | TC-010 is load-sensitive. The 5% margin is about half the run-to-run spread on an idle machine: one set of off-runs ranged from 2026 to 2480 ms. Under full CPU load it failed 1 run in 3, at a ratio of 1.19. It passes when idle only because the emission-off baseline uses vitest's slower async JUnit reporter, which puts the idle ratio at about 0.93. Fix, keeping the AC: run more interleaved pairs (for example 11), compare the medians of per-pair ratios, and keep the timed runs out of parallel test files (put TC-010 in its own file run with `--no-file-parallelism`, or mark the file sequential). Do not raise the 5% threshold. | tests/reporter.test.ts:285-307 |
| FND-007 | low | `spec/tests.md`, which this PR changes, fails `prettier --check`, so the CI lint job (`make lint`) stays red. The failure already exists on main, along with seven other spec files, and the PR body notes it but says the files are "not touched here", which is not true of spec/tests.md. Fix: run `pnpm format` over `spec/` in this PR. | spec/tests.md |

## Verdict

Not mergeable as is: there are two high findings.

- FND-001 is a silent wrong symbol, so ids go unbound with no error. It breaks the spec's no-fallback rule.
- FND-005 is a deterministic test failure in the repo's CI environment.

The design is otherwise sound:

- Emission off delegates to vitest's own `JUnitReporter`, and TC-013 proves the output is byte-equal after normalisation.
- Emission on writes the file once, during `onTestRunEnd` (CON-1 holds).
- `trace()` is a real no-op when emission is off.
- Concurrent tests throw.
- There is no runtime dependency.
- The `vitest` external and peer dependency are required. A build from the unmodified template config bundles vitest and vite into a 1 MB `dist/`, and then `trace()` throws "called outside a running test" because the bundled `TestRunner` is a separate instance.
- No pin, digest, tracking record, vendored file or compatibility layer was added.
