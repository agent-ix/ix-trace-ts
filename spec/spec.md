---
type: master-requirements
name: ix-trace-ts
org: agent-ix
component_type: typescript-vitest-reporter
implementation_language: typescript
tags:
  - traceability
  - vitest
  - evidence
depends_on: []
standards_alignment:
  - iso-iec-ieee-29148
relationships:
  - target: "ix://agent-ix/quoin/FR-120"
    type: "depends_on"
    cardinality: "1:1"
  - target: "ix://agent-ix/quire-rs/FR-051"
    type: "depends_on"
    cardinality: "1:1"
  - target: "ix://agent-ix/quire-rs/FR-062"
    type: "depends_on"
    cardinality: "1:1"
security_critical: false
---

# Master Requirements Specification

## Purpose

This document specifies `ix-trace-ts`, a TypeScript package providing a typed
`trace(...ids)` helper and a vitest reporter. A test names the specification ids
it verifies by calling `trace`, and, when asked, the reporter writes those ids
into JUnit XML so that `quoin evidence record` can bind them to a result.

The static side already exists: `quire-rs` FR-051 binds `trace("FR-001-AC-1")`
from the syntax tree with no code executed, but the helper was an undefined
symbol, so the canonical form did not compile. The JUnit reader in the evidence
adapter reads a `trace` property and nothing in the TypeScript ecosystem writes
one. The contract a writer must meet is the Emitter contract (E-1..E-10) of
[Quoin FR-120](ix://agent-ix/quoin/FR-120); this package is its vitest binding.

## Scope

### In Scope

- A real exported, type-checked `trace(...ids: string[]): void` helper.
- A vitest reporter that, while `QUIRE_TRACE_EMIT=1`, writes the JUnit file with
  a `trace` property on each test that declared ids.
- The symbol the reporter writes for each case (`name`, `classname`, `file`), so
  the execution view joins the static view.
- `implementing(...ids)`, the decorator and wrapper a production class, method or
  function carries to declare the ids it implements, returning every declaration
  unchanged and importing no test runner.
- The package's stated limits: jest unsupported, concurrent tests unsupported,
  and the amended E-4 exception.

### Out of Scope

- **jest.** jest runs test bodies in worker processes and gives its reporter an
  `AssertionResult` with no user metadata field, so no channel carries a
  `trace()` call to the reporter. Revisited by amendment when a channel is found.
- **Concurrent tests.** `trace()` throws in a concurrent test while emission is
  enabled; no call in one is attributed.
- **Declaring ids at registration.** Only a call inside the test body is
  supported.
- **Which ids exist.** The kind vocabulary is declared by the module.
- **Static binding.** Reading `trace(...)` from the syntax tree is `quire-rs`
  FR-051, and reading `implementing(...)` is `quire-rs` FR-062, whose declared
  forms are `spec-artifacts-process` FR-004.
- **A production `trace` construct.** Evidence is declared by `trace(...)` only;
  scope and evidence stay separate constructs.
- **Structural scope on a `function` declaration.** The language admits no
  decorator there; the wrapper form on an arrow-valued binding is the construct.
- **Other languages.** The Rust and Python emitters are `ix-trace-rs` and
  `ix-trace-py`. `QUIRE_TRACE_EMIT` is the enable name for the pytest and
  TypeScript emitters only; the Rust emitter is enabled by a cargo feature.

## System Overview

### System Description

`trace` finds the running test through a module-level current-test slot and
writes the ids to that test's `meta`, which vitest carries to the reporter. The
reporter, while enabled, enables vitest's task location, writes the JUnit file
itself with the runner's own outcome per test, and renames each case to the
extractor's `qualified_name`. While not enabled both are inert and the package
has no runtime dependency beyond the runner.

### Interfaces

The public surface is the `trace` helper, the `implementing` function, the
reporter, and the environment variable `QUIRE_TRACE_EMIT`.

## Requirements Architecture

### Requirement Groups

- **Functional** — the helper and reporter
  ([FR-001](./functional/FR-001-vitest-trace-helper-and-reporter.md)).
- **Functional (scope)** — the production `implementing` construct
  ([FR-002](./functional/FR-002-implementing-construct.md)).
- **Stakeholder** — the need the package answers
  ([StR-001](./stakeholder/StR-001-typescript-tests-bind-ids-at-run-time.md)),
  reached through
  [US-001](./usecase/US-001-run-a-tagged-suite-and-record-its-evidence.md); and
  [StR-002](./stakeholder/StR-002-typescript-production-code-declares-the-ids-it-implements.md),
  reached through
  [US-002](./usecase/US-002-declare-the-ids-a-production-symbol-implements.md).

### Traceability Approach

Every acceptance criterion is traced from the Test Matrix (`spec/tests.md`) to a
test carrying the id. The package marks its own tests with its own helper.

## References

- [Quoin FR-120](ix://agent-ix/quoin/FR-120) — the `trace` mark and the Emitter
  contract (E-1..E-10) this package binds for vitest, including the amended E-4
  exception.
- [quire-rs FR-051](ix://agent-ix/quire-rs/FR-051) — the marker form and the
  `qualified_name` the reporter must equal (FR-051-AC-47), and the end-to-end
  demonstration of the emitter chain (FR-051-AC-48).
- [quire-rs FR-062](ix://agent-ix/quire-rs/FR-062) — the `implements` relation and
  the `typescript_decorator` and `typescript_wrapper` syntax positions that bind
  the construct.
- ISO/IEC/IEEE 29148:2018 — requirements engineering, the shape these artifacts
  follow.
