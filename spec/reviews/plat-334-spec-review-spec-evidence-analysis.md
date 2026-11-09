---
id: SR-004
title: "Evidence review of agent-ix/ix-trace-ts PR 2 (PLAT-334)"
type: SpecReview
analysis: evidence
scope: "agent-ix/ix-trace-ts; spec/ (PR 2 diff only, head e9dbfb5)"
review_set: subset
---

## Summary

Ticket: PLAT-334. Spec-only PR, head `e9dbfb5`, scoped to `git diff origin/main...HEAD`. The PR relocates quire-rs FR-080 (merged in quire-rs PR 613) into this repository as FR-001, with StR-001, US-001, spec.md and a Test Matrix (TC-001..TC-011). Contract: Quoin FR-120 (E-1..E-10, amended E-4/AC-5) and ADR-100 on quoin main. Prior quire-rs reviews (spec/reviews/plat-334-335-spec-review-_.md) were read so fixed issues are not re-raised. `quire validate --scope . "spec/\*\*/_.md"`exits 0 (quire 0.36.2). Checked that each AC can fail and that its verification method fits. AC-1 is a compile-time type error. AC-2..AC-11 each state an observable result with a negative control: an exact id set, a`<testcase>`count, the runner's outcome, a named throw, no sidecar file, a 5% median over five or more runs, and a bound or unbound obligation.`Test`is the right method for every AC, and`Inspection` is right for CON-1.

Examined: FR-001-AC-1, FR-001-AC-2, FR-001-AC-3, FR-001-AC-4, FR-001-AC-5, FR-001-AC-6, FR-001-AC-7, FR-001-AC-8, FR-001-AC-9, FR-001-AC-10, FR-001-AC-11, FR-001-CON-1, TM-001. Context only: FR-001.

No assurance profile exists in this repository; this is a direct review, not an enforced ix-flow run.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Refs                                                                                                                             |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FND-001 | medium   | The FR says that if the `it.each` template cannot be recovered from source at the task location, the enabled run fails with an error naming the test. This is the loud-failure path of the mechanism the prior failure-domain round asked for. No AC states it and no TC tests it. AC-5 covers only the success case. An implementation that falls back silently to the interpolated title would pass every criterion, and its symbols would never join the static view. Fix: add the failing case to AC-5 (or a new AC) and to TC-005, for example a template held in a variable or built from an expression. | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:64-68, spec/functional/FR-001-vitest-trace-helper-and-reporter.md:111 |
| FND-002 | low      | Limits makes `trace()` throw in any test whose `concurrent` flag is true, naming both `it.concurrent` and a test inside `describe.concurrent`. Both the AC-8 text and TC-008 exercise only `it.concurrent`. The inherited-flag case would leave a helper that checks only the registration modifier untested. Fix: add a test in `describe.concurrent` to AC-8 and TC-008.                                                                                                                                                                                                                                     | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:88-95, spec/functional/FR-001-vitest-trace-helper-and-reporter.md:114 |

## Verdict

Every AC can fail as written. FND-001 (medium) and FND-002 (low) are coverage gaps; fix both in this PR.

## New findings (disposition pass 1)

| ID      | Severity | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Refs                               |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| FND-003 | medium   | The fix round added FR-001-AC-12 to the Traces To column of TC-005 (`FR-001-AC-5, FR-001-AC-12`) and also made it the only trace of the new TC-012. The Test Matrix's rule 2 says `no trace id appears on two different tests`. A collision is invisible to `quire coverage`: deleting either test leaves the row green on the strength of the other. TC-005's title does not exercise the unrecoverable-template case at all. Fix: remove FR-001-AC-12 from TC-005's Traces To, leaving `FR-001-AC-5`. | spec/tests.md:39, spec/tests.md:46 |

## Dispositions

| FND     | outcome | reason                                                                                                                                                                                                                                                                                   |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FND-001 | fixed   | Fix commit 8ca5fbc: the new FR-001-AC-12 and TC-012 test that an unrecoverable `it.each` template fails the run naming the test, with no fallback to the interpolated title. The FR prose now states there is no fallback. See FND-003 for the duplicate trace this fix added to TC-005. |
| FND-002 | fixed   | Fix commit 8ca5fbc: AC-8 and TC-008 now cover a test that inherits concurrency from `describe.concurrent`.                                                                                                                                                                               |
