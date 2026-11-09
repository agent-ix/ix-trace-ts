---
id: SR-007
title: "Gap analysis of agent-ix/ix-trace-ts PR 3 (PLAT-334) against FR-001"
type: SpecReview
analysis: gap-analysis
scope: "agent-ix/ix-trace-ts; spec/functional/FR-001, spec/tests.md, src/, tests/ (PR 3 diff only, head 0ba515f)"
review_set: subset
---

## Summary

Ticket: PLAT-334. Planless gap analysis of PR 3, head `0ba515f`. Plan completion: not assessed.

`quire matrix --scope .` (quire 0.36.2) reports all 13 ACs of FR-001 as `tagged`. FR-001-CON-1 is `method-without-symbol`, which is correct for its Inspection method. StR-001-VC-1..3 are unbacked by design (Demonstration). `quire coverage --json` reports 0 unbacked rows and 0 status lies.

Each AC was then checked against the assertions that the tagged test actually makes:

- AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9, AC-10, AC-12 and AC-13 are asserted by their tests as stated.
- The code-review findings on AC-12 (SR-006 FND-001/002), AC-13 (FND-004), AC-6 under CI (FND-005) and AC-10 (FND-006) are recorded in SR-006, not repeated here.
- Production code with no owning requirement: none. Every function in src/ serves FR-001.
- No stubs, no `todo`, no skipped tests.

Examined: FR-001-AC-1, FR-001-AC-2, FR-001-AC-3, FR-001-AC-4, FR-001-AC-5, FR-001-AC-6, FR-001-AC-7, FR-001-AC-8, FR-001-AC-9, FR-001-AC-10, FR-001-AC-11, FR-001-AC-12, FR-001-AC-13, FR-001-CON-1. Context only: FR-001 (statement and Limits), StR-001, spec/tests.md.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | medium | TC-011 (AC-11) returns early, and TC-005's `quire coverage` equality (the last clause of AC-5) is skipped, whenever `quoin` or `quire` is not on PATH. Both then report **pass**. In the repo's CI workflow neither tool is installed, so AC-11 is never exercised there and still shows green, yet spec/tests.md marks TC-005 and TC-011 `✅ Passing`. Fix: use `it.skipIf(!tool)` for TC-011 and split the quire equality into its own `skipIf` test, so a missing tool reports **skip**, not pass. Alternatively, fail when the tool is missing. | tests/reporter.test.ts:136-181,310-365; spec/tests.md |
| FND-002 | medium | The static extractor binds TC-011 to FR-001-AC-1, which TC-011 does not verify. TC-011's fixture source holds the literal text `trace("FR-001-AC-1")` inside a template string, and `quire matrix` lists `tests/reporter.test.ts:310:3` as a binder of AC-1. This inflates AC-1's coverage. Fix: build the fixture id at run time (for example `"FR-001-" + "AC-1"` interpolated into the fixture), so that only the fixture's runtime `trace` call carries it. Whether quire-rs should scan template-literal contents at all is a separate upstream question. | tests/reporter.test.ts:310-318 |

## Verdict

Every AC is tagged, and every test asserts what its AC states. There are two medium gaps. AC-11, plus the extractor-equality clause of AC-5, is not verified in CI while being reported as passing. One binding is wrong (TC-011 → AC-1). Neither is high on its own. Merge readiness is decided together with SR-006.
