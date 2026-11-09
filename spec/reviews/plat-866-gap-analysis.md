---
id: SR-015
title: "Gap analysis of agent-ix/ix-trace-ts PR 9 (PLAT-866) against FR-002 and FR-001-AC-14"
type: SpecReview
analysis: gap-analysis
scope: "agent-ix/ix-trace-ts; spec/functional/FR-002, spec/functional/FR-001 (AC-14), spec/stakeholder/StR-002, spec/tests.md, src/, tests/ (PR 9 diff only, head 7ee355f)"
review_set: subset
---

## Summary

Ticket: PLAT-866. This is a planless gap analysis of PR 9, head `7ee355f`. Plan completion: not assessed.

The computed matrix (`quire matrix --scope . --format tsv`, quire 0.36.2) reports FR-002-AC-1 through AC-9, AC-11 through AC-16, FR-002-CON-4 and FR-001-AC-14 as `tagged`. The bindings are in tests/implementing.test.ts and tests/entries.test.ts. FR-002-AC-10 is `untagged`. FR-002-CON-1, CON-2, CON-3 and CON-5 are `method-without-symbol` (Inspection).

FR-002-AC-10 (TC-023) is left Planned for a reason that holds. On main, the spec-artifacts-process module manifest does not declare the `typescript_decorator` or `typescript_wrapper` forms; they appear only in FR-004's spec text, marked planned. quire-rs main has no binder code for them either; they appear only in FR-062 and FR-051 spec text. So `quire coverage --json` cannot yield the relations AC-10 asks for from this repo. StR-002-VC-1 stays 🚧 consistently.

Reviewer inspection of the Inspection constraints at head `7ee355f`:

- CON-1 holds: `trace` is unchanged and has no flag.
- CON-2 holds: the root exports only `implementing`.
- CON-3 holds: `src/implementing.ts` parses no source and imports nothing.
- CON-5 holds: `src/index.ts` is a single `export { implementing }`.

The binder spellings agree with quire-rs FR-062 and spec-artifacts-process FR-004:

- The README documents `import * as ixTrace from "@agent-ix/ix-trace-ts"`.
- It shows `@ixTrace.implementing("…")` and `ixTrace.implementing("…")(…)` with double-quoted ids.
- It says only double-quoted literals bind.

StR-002-VC-2 is marked ✅ on TC-015 and TC-020. TC-020 runs the built root where vitest cannot be resolved, so the status is supported.

Examined: FR-002-AC-1 through FR-002-AC-16, FR-002-CON-1 through FR-002-CON-5, FR-001-AC-14, StR-002-VC-1, StR-002-VC-2, and the spec/tests.md rows changed by this PR. Context only: quire-rs FR-062, spec-artifacts-process FR-004, ix-trace-rs FR-003.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Refs                   |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| FND-001 | low      | spec/tests.md "Verification Status" still says "Every test case is implemented in `tests/reporter.test.ts` and passes". After this PR, TC-014 through TC-029 live in tests/implementing.test.ts and tests/entries.test.ts, and TC-023 is not implemented. The FR-002-CON-1, CON-2, CON-3 and CON-5 rows also still say "not performed", although each inspection can now be done against shipped code; the reviewer did them and all four hold. Fix: rewrite the paragraph to name the three test files and the TC-023 exception, and update the four constraint rows to the inspection result. | spec/tests.md:71-75,89 |

## Verdict

Mergeable. Every FR-002 acceptance criterion except AC-10 is bound to a test that asserts it. AC-10 is deferred for a reason that holds: the upstream module form and binder do not exist yet. The status columns in spec/tests.md match what runs. The one finding is stale prose next to those columns.

spec/tests.md also fails `prettier --check`. main's copy fails the same check, so this is not a regression from this PR.

## Dispositions

| FND     | Outcome | Reason                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FND-001 | fixed   | Disposition round 1, fix commit 6657b77. The Verification Status paragraph now names tests/reporter.test.ts (and tests/cost.test.ts for TC-010) for TC-001..013, tests/implementing.test.ts and tests/entries.test.ts for the FR-002 cases, and says TC-023 is not implemented. The FR-002-CON-1, CON-2, CON-3 and CON-5 rows now read "inspected, holds" (spec/tests.md:71-75,89-93). |
