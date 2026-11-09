---
id: StR-001
title: "TypeScript test authors need the ids a test verifies recorded with its result"
type: StR
relationships:
  - target: "ix://agent-ix/ix-trace-ts/FR-001"
    type: "satisfied_by"
---

# StR-001: TypeScript test authors need the ids a test verifies recorded with its result

## Stakeholder Need

Authors of traced TypeScript repositories shall have each test result of a tagged
vitest suite recorded against the specification ids the test names, so that an
obligation is bound by a test that ran and passed rather than only by a test that
is annotated.

## Rationale

A static scan proves a test is annotated, never that it ran. The evidence side
reads a JUnit `trace` property to bind ids to a result, but vitest writes none;
the canonical `trace(...)` form was an undefined symbol; and vitest's default
JUnit naming joins `describe` titles into a name the extractor does not use, so
the static and execution views never join.

## Validation Criteria

| ID | Criteria | Validation |
|----|----------|------------|
| StR-001-VC-1 | A real vitest suite run with emission enabled produces a result file `quoin evidence record` accepts, and the obligation it names is bound | Demonstration |
| StR-001-VC-2 | The same suite with its tagged test made to fail records a failing entry and binds nothing | Demonstration |
| StR-001-VC-3 | A `trace()` call in a concurrent test fails loudly rather than attributing ids to the wrong test | Demonstration |

## Stakeholders

Authors and reviewers of traced TypeScript repositories, and consumers of
coverage and evidence reports who decide whether a requirement is verified.

## Context and Assumptions

The suite runs under vitest. jest is unsupported (see FR-001 Limits). Emission is
opt-in: installing the package or calling `trace` never changes a result file.

## Dependencies

**Upstream**: [Quoin FR-120](ix://agent-ix/quoin/FR-120) and
`ix://agent-ix/quire-rs/FR-051`. **Downstream**:
[FR-001](../functional/FR-001-vitest-trace-helper-and-reporter.md).
