---
id: SR-001
title: "Base spec review of agent-ix/ix-trace-ts PR 2 (PLAT-334)"
type: SpecReview
analysis: base
scope: "agent-ix/ix-trace-ts; spec/ (PR 2 diff only, head e9dbfb5)"
review_set: subset
---

## Summary

Ticket: PLAT-334. Spec-only PR, head `e9dbfb5`, scoped to `git diff origin/main...HEAD`. The PR relocates quire-rs FR-080 (merged in quire-rs PR 613) into this repository as FR-001, with StR-001, US-001, spec.md and a Test Matrix (TC-001..TC-011). Contract: Quoin FR-120 (E-1..E-10, amended E-4/AC-5) and ADR-100 on quoin main. Prior quire-rs reviews (spec/reviews/plat-334-335-spec-review-*.md) were read so fixed issues are not re-raised. `quire validate --scope . "spec/**/*.md"` exits 0 (quire 0.36.2). Carry-over check: after renaming FR-080 to FR-001, the Description, The helper, The reporter, The symbol and Limits sections, all eleven AC texts and CON-1 are identical to quire-rs main FR-080 apart from line wrapping. No AC is weakened and no constraint is lost. Every fix the prior rounds asked for is present: jest is unsupported, with its cause; concurrent tests throw loudly (`it.concurrent` and `describe.concurrent`), with no before-first-await claim; the `it.each` template is recovered through task location; there is no class-qualified row; the amended E-4 exception now cites merged quoin FR-120; AC-11 has no staleness clause; `QUIRE_TRACE_EMIT=1` is scoped to the pytest and TypeScript emitters. The ids are unique and sequential. The PR adds no hash, pin, digest, tally or tracking record, no vendored or copied schema, and no compatibility layer.

Examined: FR-001, FR-001-AC-1, FR-001-AC-2, FR-001-AC-3, FR-001-AC-4, FR-001-AC-5, FR-001-AC-6, FR-001-AC-7, FR-001-AC-8, FR-001-AC-9, FR-001-AC-10, FR-001-AC-11, FR-001-CON-1, StR-001, US-001, spec/spec.md, TM-001. Context only: none.

No assurance profile exists in this repository; this is a direct review, not an enforced ix-flow run.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | low | Every AC Verification cell reads `Test (TC-NNN)`. The quoin checklist says a Verification cell names a method only, with no `TC-` id. The relocation added these ids; quire-rs FR-080 had `Test`. The AC-to-TC mapping already lives in the Test Matrix `Traces To` column, so this is a second copy that can drift (the prior quire-rs round found stale off-by-one audit rows of exactly this kind). Fix: make each cell `Test`. ix-trace-rs uses the same form, outside this diff. | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:107-117 |

## Verdict

The relocation is faithful: nothing is weakened or lost. One low finding, no high. The base checklist does not block merge.

## Dispositions

| FND | outcome | reason |
| --- | --- | --- |
| FND-001 | fixed | Fix commit 8ca5fbc: every AC Verification cell, including the new AC-12 and AC-13, now reads `Test`, with no TC id. |
