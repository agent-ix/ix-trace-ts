---
id: TM-001
title: "ix-trace-ts Test Matrix"
type: TestMatrix
---

# Test Matrix

## Overview

This matrix maps every acceptance criterion in `ix-trace-ts/spec/` to the test
that verifies it. Test cases use the `TC-XXX` prefix, and the `Type` column says
what kind of evidence each row is. The package marks its own tests with its own
helper wherever it can.

## Matrix Rules

1. **Coverage Rule** — every acceptance criterion has at least one trace, or an
   explicit row saying why it has none.
2. **One id, one symbol** — no trace id appears on two different tests.
3. **Real runs** — emission is observed by running vitest in a subprocess over a
   fixture suite and reading the JUnit file the reporter wrote, not by calling
   reporter internals.

## Functional Requirement Coverage

| Functional Req                            | Acceptance Criteria | Test Cases             | Status     |
| ----------------------------------------- | ------------------- | ---------------------- | ---------- |
| FR-001 vitest trace helper and reporter   | AC-1..14; CON-1     | TC-001..TC-013, TC-029 | ✅ Passing |
| FR-002 implementing decorator and wrapper | AC-1..16; CON-1..5  | TC-014..TC-029         | ✅ Passing |

## Test Case Summary

| Test ID | Title                                                                                                                                                                                                                                                                                                                  | Type        | Priority | Traces To                  | Status     |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- | -------------------------- | ---------- |
| TC-001  | `trace` helper type-checks string ids and rejects a non-string at compile time                                                                                                                                                                                                                                         | Integration | P1       | FR-001-AC-1                | ✅ Passing |
| TC-002  | Emission off: helper is a no-op, no `trace` property, results equal a no-package run, no extra runtime dependency                                                                                                                                                                                                      | Integration | P1       | FR-001-AC-2                | ✅ Passing |
| TC-003  | Emission on: several ids or repeated calls give each distinct id once; an uncalled test carries none                                                                                                                                                                                                                   | Integration | P1       | FR-001-AC-3                | ✅ Passing |
| TC-004  | Emission on: ids are only `trace` call arguments, none inferred from titles                                                                                                                                                                                                                                            | Integration | P1       | FR-001-AC-4                | ✅ Passing |
| TC-005  | Symbols: nested `describe` gives bare title, `it.each` yields two cases named by the template title; `name`==`classname`, `file` set, equal to `quire coverage --json`                                                                                                                                                 | Integration | P1       | FR-001-AC-5                | ✅ Passing |
| TC-006  | Modifier registrations (`skipIf`, `only`, `skip`) report the registered title once with the runner's outcome; a test skipped by its modifier carries no ids                                                                                                                                                            | Integration | P1       | FR-001-AC-6                | ✅ Passing |
| TC-007  | A test that calls `trace` then throws is `fail` with its ids                                                                                                                                                                                                                                                           | Integration | P1       | FR-001-AC-7                | ✅ Passing |
| TC-008  | Default parallel execution across files: each tagged test once with its own ids; `trace()` in an `it.concurrent` test, and in a test inheriting concurrency from `describe.concurrent`, throws an error stating the call was made in a concurrent test                                                                 | Integration | P1       | FR-001-AC-8                | ✅ Passing |
| TC-009  | Result file written by the reporter during the run, no sidecar or post-run rewrite                                                                                                                                                                                                                                     | Integration | P1       | FR-001-AC-9                | ✅ Passing |
| TC-010  | Cost: 500-test tagged suite under 5% median wall-clock overhead with emission on (opt-in: runs only with `QUIRE_PERF_TESTS=1`)                                                                                                                                                                                         | Integration | P1       | FR-001-AC-10               | ✅ Passing |
| TC-011  | End to end: real vitest suite -> `quoin evidence record` binds; failing variant binds nothing                                                                                                                                                                                                                          | E2E         | P1       | FR-001-AC-11               | ✅ Passing |
| TC-012  | An `it.each` whose template cannot be recovered (variable or expression) fails the enabled run naming the test, with no interpolated-title fallback                                                                                                                                                                    | Integration | P1       | FR-001-AC-12               | ✅ Passing |
| TC-013  | Emission off: a project configured with the reporter still gets the plain JUnit result a project would get without it, no `trace` property, never no file                                                                                                                                                              | Integration | P1       | FR-001-AC-13               | ✅ Passing |
| TC-014  | Type-check: string ids accepted; a non-string argument and an empty call are compile-time errors                                                                                                                                                                                                                       | Unit        | P1       | FR-002-AC-1                | ✅ Passing |
| TC-015  | Standard decorators: class is the identical constructor; class, method, getter and setter descriptors on the prototype equal the unmarked member's on every attribute                                                                                                                                                  | Unit        | P1       | FR-002-AC-2                | ✅ Passing |
| TC-016  | `experimentalDecorators`: class, method and accessor unchanged, prototype descriptors equal on every attribute                                                                                                                                                                                                         | Unit        | P1       | FR-002-AC-3                | ✅ Passing |
| TC-017  | Wrapper returns the identical arrow function and function expression and keeps their types                                                                                                                                                                                                                             | Unit        | P1       | FR-002-AC-4                | ✅ Passing |
| TC-018  | No retained reference, run under `--expose-gc` (dedicated subprocess or worker execArgv), failing when `gc` is not a function, yielding before `gc()` and before `deref()`: every `WeakRef` dereferences to `undefined`; own names and symbols unchanged; module-level array, closure array and `Map` fixtures fail it | Unit        | P1       | FR-002-AC-5                | ✅ Passing |
| TC-019  | Run-time `TypeError`: empty call shows a well-formed call, non-string names its type and position; several and repeated ids accepted                                                                                                                                                                                   | Unit        | P1       | FR-002-AC-6                | ✅ Passing |
| TC-020  | Package root loads with `vitest` unresolvable, `implementing` works, and no `vitest` module is loaded                                                                                                                                                                                                                  | Integration | P1       | FR-002-AC-7                | ✅ Passing |
| TC-021  | On a test registration or `describe` callback it changes neither registration nor recorded `trace` ids under emission                                                                                                                                                                                                  | Integration | P1       | FR-002-AC-8                | ✅ Passing |
| TC-022  | Zero-argument call of the returned function throws `TypeError` showing the call shapes; two arguments return `undefined`; one returns the argument                                                                                                                                                                     | Unit        | P1       | FR-002-AC-9                | ✅ Passing |
| TC-023  | A fixture module with a marked class, method and wrapped arrow const yields one `implements` per id and no `verifies` through `quire coverage --json`, for both spellings; a renamed import and single-quoted, template-literal and concatenated ids run and bind nothing                                              | E2E         | P1       | FR-002-AC-10               | ✅ Passing |
| TC-024  | Shape rule: `""`, `"FR 2"`, `"A-1, A-2"`, `"FR-XXX"` and `"1-A"` throw `TypeError` naming the argument; `ZZ-001`, `MADEUP-042-AC-9` and `interface_004-AC-1` are accepted; no kind list exists in the package                                                                                                          | Unit        | P1       | FR-002-AC-11               | ✅ Passing |
| TC-025  | A nested marked declaration checks its ids on each call of the enclosing function, a module-level one once at load, and both stay unchanged                                                                                                                                                                            | Unit        | P1       | FR-002-AC-12               | ✅ Passing |
| TC-026  | Positions: standard decorators accept class, method, getter and setter and reject a field; `experimentalDecorators` accepts class and member calls and rejects a property call and a parameter call; a class expression type-checks                                                                                    | Unit        | P1       | FR-002-AC-13               | ✅ Passing |
| TC-027  | Package root namespace keys equal `["implementing"]`                                                                                                                                                                                                                                                                   | Unit        | P1       | FR-002-AC-14               | ✅ Passing |
| TC-028  | Module graph from the built root contains no `vitest` specifier and the package declares no runtime dependency                                                                                                                                                                                                         | Integration | P1       | FR-002-AC-15               | ✅ Passing |
| TC-029  | `exports` map declares `.` and `./vitest`; `@agent-ix/ix-trace-ts/vitest` exports `trace` and `TraceReporter` and the root does not                                                                                                                                                                                    | Integration | P1       | FR-002-AC-16, FR-001-AC-14 | ✅ Passing |

## Constraint Coverage

| Constraint   | Covering evidence                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| FR-001-CON-1 | Inspection — the reporter writes the file once during the run and no step rewrites it (also exercised by TC-009) |
| FR-002-CON-1 | Inspection — no flag on `trace`; inspected, holds (PLAT-866 review SR-014)                                       |
| FR-002-CON-2 | Inspection — no production `trace` export; inspected, holds (PLAT-866 review SR-014)                             |
| FR-002-CON-3 | Inspection — the package parses no source; inspected, holds (PLAT-866 review SR-014)                             |
| FR-002-CON-4 | TC-024 — no kind list in the package, `ZZ-001` accepted                                                          |
| FR-002-CON-5 | Inspection — the root re-exports neither `trace` nor `TraceReporter`; inspected, holds (PLAT-866 review SR-014)  |

## Stakeholder Validation

| ID           | Traces To      | Validation                                        | Status |
| ------------ | -------------- | ------------------------------------------------- | ------ |
| StR-001-VC-1 | US-001; FR-001 | Demonstration — covered by TC-011                 | ✅     |
| StR-001-VC-2 | FR-001         | Demonstration — covered by TC-011 failing variant | ✅     |
| StR-001-VC-3 | FR-001         | Demonstration — covered by TC-008                 | ✅     |
| StR-002-VC-1 | US-002; FR-002 | Demonstration — covered by TC-023                 | ✅     |
| StR-002-VC-2 | FR-002         | Demonstration — covered by TC-015 and TC-020      | ✅     |

## Verification Status

TC-001..TC-013 are implemented in `tests/reporter.test.ts` (and `tests/cost.test.ts`
for TC-010) and pass. Each runs vitest in a subprocess over a fixture suite and
reads the JUnit file the reporter wrote. TC-014..TC-019, TC-021, TC-022 and TC-024..TC-027 are in
`tests/implementing.test.ts`, TC-020, TC-028 and TC-029 in `tests/entries.test.ts`,
and all pass. TC-023 is in `tests/binding.test.ts`; it finds the `spec-artifacts-process` module through
`IX_FILAMENT_MODULES_PATH` (never copied into this repo) and is skipped when `quire` is not on `PATH` or no module there declares
`typescript_decorator` and `typescript_wrapper`. TC-005 compares the reporter's symbols with `quire coverage --json`, and
TC-011 runs `quoin evidence record`; each is reported as skipped when its tool is not on `PATH`. jest is
unsupported and is not counted as a gap here.

TC-010 times wall-clock and is skipped unless `QUIRE_PERF_TESTS=1` is set, since
wall-clock varies with host load. FR-001-AC-10 is therefore verified only on an
opt-in run, which passes on an uncontended host.
