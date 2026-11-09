---
id: SR-003
title: "Integrity review of agent-ix/ix-trace-ts PR 2 (PLAT-334)"
type: SpecReview
analysis: integrity
scope: "agent-ix/ix-trace-ts; spec/ (PR 2 diff only, head e9dbfb5)"
review_set: subset
---

## Summary

Ticket: PLAT-334. Spec-only PR, head `e9dbfb5`, scoped to `git diff origin/main...HEAD`. The PR relocates quire-rs FR-080 (merged in quire-rs PR 613) into this repository as FR-001, with StR-001, US-001, spec.md and a Test Matrix (TC-001..TC-011). Contract: Quoin FR-120 (E-1..E-10, amended E-4/AC-5) and ADR-100 on quoin main. Prior quire-rs reviews (spec/reviews/plat-334-335-spec-review-*.md) were read so fixed issues are not re-raised. `quire validate --scope . "spec/**/*.md"` exits 0 (quire 0.36.2). Checked the id space, the relationships, the spec.md index and the Test Matrix. Every AC maps to exactly one TC and every TC maps back. CON-1 is recorded as Inspection. StR-001-VC-1..3 are mapped, with VC-3 to TC-008, the concurrent throw. Checked the layout against ix-trace-rs spec/. Upstream citations to quoin FR-120 and quire-rs FR-051 are present in the frontmatter and in the prose. FR-051-AC-47 and AC-48 are not on quire-rs main. Open quire-rs PR 622 adds them, and that PR also deletes FR-079 and FR-080.

Examined: FR-001, FR-001-CON-1, StR-001, US-001, spec/spec.md, TM-001. Context only: none.

No assurance profile exists in this repository; this is a direct review, not an enforced ix-flow run.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | low | FR-001 Dependencies, spec.md References and tests.md Verification Status cite quire-rs FR-051-AC-47 and FR-051-AC-48. Those criteria are not on quire-rs main. Open quire-rs PR 622 adds them, and it also deletes FR-080. If this PR merges alone, it cites ids that do not resolve, and the requirement exists twice: FR-080 in quire-rs and FR-001 here. Fix: merge quire-rs PR 622 in the same batch as this PR. No text change is needed if they land together. | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:127, spec/spec.md:106, spec/tests.md:64 |
| FND-002 | low | FR-001 `implements` StR-001 directly. US-001 `traces_to` StR-001 only, so no relationship joins FR-001 and US-001, which the checklist requires (`FR links to US`). The Dependencies line `StR-001 through US-001` states the chain backwards. In ix-trace-rs, FR-001 `implements` US-001. Fix: add `implements` US-001 to FR-001, and reword the line to `US-001, which traces to StR-001`. | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:5-14, spec/functional/FR-001-vitest-trace-helper-and-reporter.md:128 |

## Verdict

The ids are consistent, the matrix is complete and the layout matches ix-trace-rs. Two low findings. FND-001 is a merge-ordering condition: land this PR together with quire-rs PR 622.

## Dispositions

| FND | outcome | reason |
| --- | --- | --- |
| FND-001 | fixed | Fix commit 8ca5fbc: the Dependencies section now states that FR-051-AC-47 and AC-48 are added by quire-rs#622, which lands together with this spec. Merge-batch condition: land with quire-rs PR 622. |
| FND-002 | fixed | Fix commit 8ca5fbc: FR-001 now `implements` US-001, and Dependencies reads `US-001, which traces to StR-001`. |
