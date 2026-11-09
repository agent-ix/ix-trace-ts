---
id: SR-005
title: "Failure-domain review of agent-ix/ix-trace-ts PR 2 (PLAT-334)"
type: SpecReview
analysis: failure-domain
scope: "agent-ix/ix-trace-ts; spec/ (PR 2 diff only, head e9dbfb5)"
review_set: subset
---

## Summary

Ticket: PLAT-334. Spec-only PR, head `e9dbfb5`, scoped to `git diff origin/main...HEAD`. The PR relocates quire-rs FR-080 (merged in quire-rs PR 613) into this repository as FR-001, with StR-001, US-001, spec.md and a Test Matrix (TC-001..TC-011). Contract: Quoin FR-120 (E-1..E-10, amended E-4/AC-5) and ADR-100 on quoin main. Prior quire-rs reviews (spec/reviews/plat-334-335-spec-review-*.md) were read so fixed issues are not re-raised. `quire validate --scope . "spec/**/*.md"` exits 0 (quire 0.36.2). Checked for unstated failure modes. Already settled and present: jest is unsupported, concurrent tests throw, the template is recovered from source, the amended E-4 exception, and runner-only outcomes (AC-7).

Examined: FR-001, FR-001-AC-2, FR-001-AC-6, FR-001-AC-7, FR-001-AC-8. Context only: US-001, spec/spec.md.

No assurance profile exists in this repository; this is a direct review, not an enforced ix-flow run.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | medium | The FR says the reporter writes the JUnit file itself `while emission is enabled`. spec.md says that while emission is not enabled the reporter is inert. AC-2 says only that the disabled reporter writes no `trace` property. Nothing says whether a configured reporter writes a plain JUnit file or no file at all when the variable is unset. Two implementers would differ. A project that replaces vitest's `junit` reporter with this one would then lose its JUnit output whenever `QUIRE_TRACE_EMIT` is unset. Fix: state the disabled behaviour. Either the reporter writes a plain JUnit file with no `trace` property and with runner naming, or it writes nothing and is configured beside vitest's own `junit` reporter. Then make AC-2 assert it. | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:42-46, spec/functional/FR-001-vitest-trace-helper-and-reporter.md:108, spec/spec.md:72-77 |
| FND-002 | low | AC-6 ends `a skipped test carries no ids`. Limits says `A test that calls trace before it throws or skips is recorded with its ids`, so a body that calls `trace(...)` and then `ctx.skip()` is skipped and carries ids. Read on its own, AC-6 forbids that. Its scope is the modifier registrations, but the clause does not say so. Fix: reword it to `a test skipped by its modifier carries no ids`. | spec/functional/FR-001-vitest-trace-helper-and-reporter.md:80-81, spec/functional/FR-001-vitest-trace-helper-and-reporter.md:112 |

## Verdict

One medium ambiguity (FND-001) and one low wording conflict (FND-002). Fix both in this PR.
