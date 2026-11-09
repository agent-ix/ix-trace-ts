---
id: SR-011
title: "Scope-boundary review of ix-trace-ts PR 8: implementing construct FR-002 (PLAT-866)"
type: SpecReview
analysis: scope-boundary
scope: "agent-ix/ix-trace-ts; spec/ (PR 8 diff only, head a10bb7d)"
review_set: subset
relationships:
  - target: ix://agent-ix/ix-trace-ts/FR-002
    type: references
---

## Summary

Ticket: PLAT-866. Spec-only PR agent-ix/ix-trace-ts#8, head `a10bb7d`, scoped to `git diff origin/main...HEAD` (spec/functional/FR-002-implementing-construct.md, spec/stakeholder/StR-002-*.md, spec/usecase/US-002-*.md, spec/spec.md, spec/tests.md), read from a clean export of `a10bb7d`. Review set: subset, base plus ears-conformance, integrity, scope-boundary, failure-domain and evidence. criterion-strength was skipped because no Jev client is installed; its can-this-fail judgement was done by hand in the evidence review. No AssuranceProfile exists in this repository, so this is a direct review and not an enforced ix-flow run. Sibling texts read for consistency: quire-rs#628 FR-062 at `c7eadc1`, spec-artifacts-process FR-004 on main (`9fc6a8b`), ix-trace-py#4 FR-002 at `34188b5`, ix-trace-rs FR-003 on main, and the ix-trace-ts main source (`src/index.ts`, `src/trace.ts`, README). `quire validate --scope .` over the five changed documents exits 0 (quire 0.36.2).

Checked the allocation between this package (run-time object), quire-rs FR-062 (binding) and spec-artifacts-process FR-004 (declared forms). The spellings agree across all three: `implementing(...)` and `ixTrace.implementing(...)` with `import * as ixTrace from "@agent-ix/ix-trace-ts"`, double-quoted ids only, patterns anchored at the start, so a renamed import binds nothing and raises no finding (FR-062 Spellings and AC-25; FR-004 Behavior and AC-32). The form is described as planned and not yet declared, which matches FR-004 on main. CON-3 keeps parsing out of the package. The ix-trace-py#4 scope-boundary findings are fixed here (literal spellings pinned, planned status stated). Two findings follow. The first is against the package's real entry layout on main.

Examined: FR-002-IMPORT, FR-002-SPELLINGS, FR-002-FORMS, FR-002-TYPING, FR-002-AC-7, FR-002-AC-10, FR-002-CON-3. Context only: FR-002.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | high | The import-posture paragraph claims 'The reporter of FR-001 is a separate entry that only a vitest configuration loads'. On main that is false. The package has one entry (`main: dist/index.js`, no `exports` map, one vite lib entry `src/index.ts`). `src/index.ts` re-exports `trace` from `./trace` and `TraceReporter` (also the default export) from `./reporter`. `src/trace.ts` starts with a value import `import { TestRunner } from "vitest"`, and the README tells users to import `TraceReporter` from `@agent-ix/ix-trace-ts`. FR-004 and FR-062 pin the namespace spelling to the root specifier. So `import * as ixTrace from "@agent-ix/ix-trace-ts"` in production code loads vitest, and AC-7 and StR-002-VC-2 cannot pass without restructuring the package. The spec does not state that restructuring, and doing it changes FR-001's documented import paths. Specify the entry layout in FR-002, for example `implementing` alone at the root and `trace` plus `TraceReporter` at a subpath through an `exports` map, amending FR-001 and the README to match. Alternatively, require the root to load no vitest module at import time, and say how `trace` reaches the runner. | spec/functional/FR-002-implementing-construct.md:101-105 |
| FND-002 | medium | The decorator positions FR-002 types differ from those FR-062 binds. FR-062 ('What a TypeScript decorator reaches') binds a decorator on a `get`/`set` accessor as a method, and says a decorator on a class expression, a property or a parameter binds nothing and yields no finding. FR-002 types the decorator only for class and method positions. It does not say whether `@implementing` on an accessor compiles: under TC39 an accessor gets a `ClassGetterDecoratorContext`, not a method context. It also does not say whether `@implementing` on a field or a parameter is a compile-time error or a silently unbound marker. Name the accepted positions, matching FR-062 (class, method, get/set accessor), and require the field and parameter positions to be compile-time errors. A legacy parameter decorator receives a numeric index, so a typed overload can reject it. Add a case to AC-1 or AC-2. | spec/functional/FR-002-implementing-construct.md:132-138 |

## Verdict

Not mergeable: one high finding (import posture versus the single package entry) and one medium finding (decorator positions versus FR-062) must be fixed.

## Dispositions

Round 1, verified against head eb6d7e0 (fix commit eb6d7e0, merge 56eaf94).

| FND | Outcome | Reason |
| --- | --- | --- |
| FND-001 | fixed | FR-002 Package entries pins root = implementing only with no vitest in its graph and ./vitest for trace and TraceReporter; FR-001 gains a Package entry section and AC-14; spec.md Interfaces and README name the subpath; AC-14..16 and TC-027..029 test it. |
| FND-002 | fixed | Accepted positions now match FR-062 (class, method, get/set accessor); field and parameter are compile-time errors under both conventions; a class expression type-checks and binds nothing; AC-13/TC-026 test it. |
