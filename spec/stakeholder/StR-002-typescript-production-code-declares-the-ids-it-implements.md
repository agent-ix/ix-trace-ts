---
id: StR-002
title: "TypeScript authors need production code to declare the requirement ids it implements"
type: StR
relationships:
  - target: "ix://agent-ix/ix-trace-ts/FR-002"
    type: "satisfied_by"
---

# StR-002: TypeScript authors need production code to declare the requirement ids it implements

## Stakeholder Need

Authors of traced TypeScript repositories shall state, on a production class,
method or function, the specification ids it implements, in a construct the
compiler checks and the extractor reads from the syntax tree, so that the link
from a requirement to its production code does not depend on how a comment
happens to be worded or wrapped.

## Rationale

Test evidence is already declared with a call, `trace(...)`. Production scope is
not: TypeScript code carries it only as an `Implements:` comment matched as text,
so a changed separator, a wrapped line or an example in prose binds the wrong
thing or nothing. Rust declares the same scope with `#[implements]`. The link from
a requirement to its code, which mutation scoping and impact analysis depend on,
should be as hard to mistype as the test side.

## Validation Criteria

| ID | Criteria | Validation |
|----|----------|------------|
| StR-002-VC-1 | A production class, method and arrow-valued const marked with the construct are read by `quire coverage` as `implements` relations to their ids and contribute no verification evidence | Demonstration |
| StR-002-VC-2 | A marked production module runs unchanged where no test runner is installed | Demonstration |

## Stakeholders

Authors and reviewers of traced TypeScript repositories, and consumers of
coverage and mutation-scoping reports that need a requirement's production files.

## Context and Assumptions

The static binding is `quire-rs` FR-062 and the declaration of the forms is
`spec-artifacts-process` FR-004. This package supplies only the run-time symbol,
so the written form compiles. `implements` is a reserved word in strict-mode
code, and an ES module is always strict, so no module can bind the name
`implements`; the construct is therefore named `implementing`.

## Dependencies

**Upstream**: `ix://agent-ix/quire-rs/FR-062`. **Downstream**:
[FR-002](../functional/FR-002-implementing-construct.md).
