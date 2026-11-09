---
id: SR-013
title: "Evidence review of ix-trace-ts PR 8: implementing construct FR-002 (PLAT-866)"
type: SpecReview
analysis: evidence
scope: "agent-ix/ix-trace-ts; spec/ (PR 8 diff only, head a10bb7d)"
review_set: subset
relationships:
  - target: ix://agent-ix/ix-trace-ts/FR-002
    type: references
---

## Summary

Ticket: PLAT-866. Spec-only PR agent-ix/ix-trace-ts#8, head `a10bb7d`, scoped to `git diff origin/main...HEAD` (spec/functional/FR-002-implementing-construct.md, spec/stakeholder/StR-002-_.md, spec/usecase/US-002-_.md, spec/spec.md, spec/tests.md), read from a clean export of `a10bb7d`. Review set: subset, base plus ears-conformance, integrity, scope-boundary, failure-domain and evidence. criterion-strength was skipped because no Jev client is installed; its can-this-fail judgement was done by hand in the evidence review. No AssuranceProfile exists in this repository, so this is a direct review and not an enforced ix-flow run. Sibling texts read for consistency: quire-rs#628 FR-062 at `c7eadc1`, spec-artifacts-process FR-004 on main (`9fc6a8b`), ix-trace-py#4 FR-002 at `34188b5`, ix-trace-rs FR-003 on main, and the ix-trace-ts main source (`src/index.ts`, `src/trace.ts`, README). `quire validate --scope .` over the five changed documents exits 0 (quire 0.36.2).

Verification method per obligation, and whether each criterion can fail. Test is right for AC-1..AC-12. Inspection is right for CON-1..CON-3. CON-4 is a Test through TC-024, which is the more useful choice. The StR-002 VCs are Demonstrations backed by TC-023 and by TC-015 plus TC-020. AC-1's compile-time half needs a type-level test (`@ts-expect-error` or `tsc --noEmit` over fixtures); the spec does not say which, and either will do. The ix-trace-py evidence findings are fixed here: there is no timing clause, and the registry check is a `WeakRef`/`gc()` collection check with failing module, closure and in-place fixtures, so a retained reference can make it fail. Two findings remain on how AC-5 runs. spec-criterion-strength-analysis was not run (no Jev client); its judgement was done by hand here.

Examined: FR-002-AC-1, FR-002-AC-2, FR-002-AC-3, FR-002-AC-4, FR-002-AC-5, FR-002-AC-6, FR-002-AC-7, FR-002-AC-8, FR-002-AC-9, FR-002-AC-10, FR-002-AC-11, FR-002-AC-12, FR-002-CON-1, FR-002-CON-2, FR-002-CON-3, FR-002-CON-4, StR-002-VC-1, StR-002-VC-2. Context only: none.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Refs                                                 |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| FND-001 | medium   | AC-5 and TC-018 say only 'under `--expose-gc`'. They do not say how a vitest worker gets the flag, for example `poolOptions.forks.execArgv: ["--expose-gc"]` or a dedicated `node --expose-gc` subprocess. They do not require the test to fail rather than skip when `globalThis.gc` is undefined, which would be a vacuous pass. They do not require the test to yield to the event loop between taking the `WeakRef` and calling `gc()`, and again before `deref()`. Without that yield, a correct implementation fails: WeakRef's KeepDuringJob semantics hold the target alive until the current job ends. State all three in the AC or the TC row. | spec/functional/FR-002-implementing-construct.md:158 |
| FND-002 | low      | The clause 'the package's exports are equal before and after marking' cannot fail. An ES module namespace object is non-extensible, and its own keys are fixed when the module is linked, so no implementation can add an export by marking something. Drop the clause; the `WeakRef` check and the marked object's own keys are what can fail.                                                                                                                                                                                                                                                                                                          | spec/functional/FR-002-implementing-construct.md:158 |

## Verdict

Changes requested: one medium finding (how the AC-5 collection test runs) must be fixed or dispositioned before merge.

## Dispositions

Round 1, verified against head eb6d7e0 (fix commit eb6d7e0, merge 56eaf94).

| FND     | Outcome | Reason                                                                                                                                                                                                         |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FND-001 | fixed   | AC-5 and TC-018 now name the subprocess or worker execArgv, fail (never skip) when gc is not a function, and yield before gc() and again before deref().                                                       |
| FND-002 | fixed   | The vacuous package-exports clause is gone; AC-5 compares own names and symbols of each marked object and of implementing itself, and AC-14 checks the root namespace keys as a real export-surface assertion. |
