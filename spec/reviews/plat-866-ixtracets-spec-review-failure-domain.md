---
id: SR-012
title: "Failure-domain review of ix-trace-ts PR 8: implementing construct FR-002 (PLAT-866)"
type: SpecReview
analysis: failure-domain
scope: "agent-ix/ix-trace-ts; spec/ (PR 8 diff only, head a10bb7d)"
review_set: subset
relationships:
  - target: ix://agent-ix/ix-trace-ts/FR-002
    type: references
---

## Summary

Ticket: PLAT-866. Spec-only PR agent-ix/ix-trace-ts#8, head `a10bb7d`, scoped to `git diff origin/main...HEAD` (spec/functional/FR-002-implementing-construct.md, spec/stakeholder/StR-002-*.md, spec/usecase/US-002-*.md, spec/spec.md, spec/tests.md), read from a clean export of `a10bb7d`. Review set: subset, base plus ears-conformance, integrity, scope-boundary, failure-domain and evidence. criterion-strength was skipped because no Jev client is installed; its can-this-fail judgement was done by hand in the evidence review. No AssuranceProfile exists in this repository, so this is a direct review and not an enforced ix-flow run. Sibling texts read for consistency: quire-rs#628 FR-062 at `c7eadc1`, spec-artifacts-process FR-004 on main (`9fc6a8b`), ix-trace-py#4 FR-002 at `34188b5`, ix-trace-rs FR-003 on main, and the ix-trace-ts main source (`src/index.ts`, `src/trace.ts`, README). `quire validate --scope .` over the five changed documents exits 0 (quire 0.36.2).

Checked the decorator conventions against the return-value rule. The rule is correct for both conventions. TypeScript's legacy `__decorate` helper calls a class decorator with one argument and keeps the class when the result is the same constructor. It calls a method or accessor decorator with `(target, key, descriptor)` and keeps the descriptor when the result is `undefined` (`d(...) || r`). Returning the first argument there would install the prototype object as the descriptor, as FR-002 says. TC39 decorators are called with `(value, context)`, and `undefined` keeps the original class or method. Nested and chained wrappers (`implementing(A)(implementing(B)(fn))`) return `fn`. Evaluation timing for nested declarations is stated (AC-12), which fixes ix-trace-py's failure-domain FND-002 in TypeScript terms. The shape check fixes ix-trace-py's FND-001 (silent non-binding of `""`, `"FR 2"`, `"A-1, A-2"`). One edge remains.

Examined: FR-002-RETURN, FR-002-AC-4, FR-002-AC-6, FR-002-AC-11, FR-002-AC-12. Context only: FR-002-TYPING.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | low | The returned function chooses its result by argument count alone. When it is used as a callback (`fns.map(implementing("A-1"))`, called as `(fn, index, array)`) or called with a stray second argument, it returns `undefined` with no error, and the two-argument decorator overload lets that type-check. A zero-argument call is unspecified. Distinguish the decorator conventions by shape: return `undefined` only when the second argument is a TC39 decorator context (an object with `kind`), or a property key with a descriptor. Otherwise return the first argument, or throw a `TypeError`. State the zero-argument case. | spec/functional/FR-002-implementing-construct.md:55-62 |

## Verdict

No blocking findings. The low finding should be fixed in the same PR.

## Dispositions

Round 1, verified against head eb6d7e0 (fix commit eb6d7e0, merge 56eaf94).

| FND | Outcome | Reason |
| --- | --- | --- |
| FND-001 | fixed | The zero-argument case now throws TypeError (AC-9/TC-022), and the callback / stray-argument case is a stated limit outside the construct. Both cases are now specified, which was the defect. |
