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

| Functional Req | Acceptance Criteria | Test Cases | Status |
|----|----|----|--------|
| FR-001 vitest trace helper and reporter | AC-1..13; CON-1 | TC-001..TC-013 | 🚧 Planned — not run |

## Test Case Summary

| Test ID | Title | Type | Priority | Traces To | Status |
|----|----|----|----|----|----|
| TC-001 | `trace` helper type-checks string ids and rejects a non-string at compile time | Integration | P1 | FR-001-AC-1 | 🚧 Planned — not run |
| TC-002 | Emission off: helper is a no-op, no `trace` property, results equal a no-package run, no extra runtime dependency | Integration | P1 | FR-001-AC-2 | 🚧 Planned — not run |
| TC-003 | Emission on: several ids or repeated calls give each distinct id once; an uncalled test carries none | Integration | P1 | FR-001-AC-3 | 🚧 Planned — not run |
| TC-004 | Emission on: ids are only `trace` call arguments, none inferred from titles | Integration | P1 | FR-001-AC-4 | 🚧 Planned — not run |
| TC-005 | Symbols: nested `describe` gives bare title, `it.each` yields two cases named by the template title; `name`==`classname`, `file` set, equal to `quire coverage --json` | Integration | P1 | FR-001-AC-5, FR-001-AC-12 | 🚧 Planned — not run |
| TC-006 | Modifier registrations (`skipIf`, `only`, `skip`) report the registered title once with the runner's outcome; a test skipped by its modifier carries no ids | Integration | P1 | FR-001-AC-6 | 🚧 Planned — not run |
| TC-007 | A test that calls `trace` then throws is `fail` with its ids | Integration | P1 | FR-001-AC-7 | 🚧 Planned — not run |
| TC-008 | Default parallel execution across files: each tagged test once with its own ids; `trace()` in an `it.concurrent` test, and in a test inheriting concurrency from `describe.concurrent`, throws an error stating the call was made in a concurrent test | Integration | P1 | FR-001-AC-8 | 🚧 Planned — not run |
| TC-009 | Result file written by the reporter during the run, no sidecar or post-run rewrite | Integration | P1 | FR-001-AC-9 | 🚧 Planned — not run |
| TC-010 | Cost: 500-test tagged suite under 5% median overhead with emission on | Integration | P1 | FR-001-AC-10 | 🚧 Planned — not run |
| TC-011 | End to end: real vitest suite -> `quoin evidence record` binds; failing variant binds nothing | E2E | P1 | FR-001-AC-11 | 🚧 Planned — not run |
| TC-012 | An `it.each` whose template cannot be recovered (variable or expression) fails the enabled run naming the test, with no interpolated-title fallback | Integration | P1 | FR-001-AC-12 | 🚧 Planned — not run |
| TC-013 | Emission off: a project configured with the reporter still gets the plain JUnit result a project would get without it, no `trace` property, never no file | Integration | P1 | FR-001-AC-13 | 🚧 Planned — not run |

## Constraint Coverage

| Constraint | Covering evidence |
|----|----|
| FR-001-CON-1 | Inspection — no post-write rewrite step in the package; not performed |

## Stakeholder Validation

| ID | Traces To | Validation | Status |
|----|----|----|----|
| StR-001-VC-1 | US-001; FR-001 | Demonstration — covered by TC-011 | 🚧 |
| StR-001-VC-2 | FR-001 | Demonstration — covered by TC-011 failing variant | 🚧 |
| StR-001-VC-3 | FR-001 | Demonstration — covered by TC-008 | 🚧 |

## Verification Status

Planned: no test exists yet and none has been run. The extractor-side equality of
the reporter's symbols (TC-005) is cross-checked by quire-rs FR-051-AC-47 and
FR-051-AC-48. jest is unsupported and is not counted as a gap here.
