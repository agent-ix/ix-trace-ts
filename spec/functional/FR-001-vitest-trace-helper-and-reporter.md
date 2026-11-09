---
id: FR-001
title: "vitest trace() helper and reporter emit the trace mark into JUnit output"
type: FR
relationships:
  - target: "ix://agent-ix/ix-trace-ts/StR-001"
    type: "implements"
    cardinality: "1:1"
  - target: "ix://agent-ix/quoin/FR-120"
    type: "implements"
    cardinality: "1:1"
  - target: "ix://agent-ix/quire-rs/FR-051"
    type: "consumes"
    cardinality: "1:1"
---

# FR-001: vitest trace() helper and reporter emit the trace mark into JUnit output

## Description

The TypeScript package SHALL provide a typed `trace(...ids)` helper.

While emission is enabled, the package's vitest reporter SHALL write the ids a test
declared into the JUnit XML as the mark of [Quoin FR-120](ix://agent-ix/quoin/FR-120),
under its Emitter contract (E-1..E-10). This requirement is the vitest binding of
that contract. jest is recorded as unsupported (see Limits).

The static side is unchanged: quire-rs [FR-051](ix://agent-ix/quire-rs/FR-051) binds
`trace("FR-001-AC-1")` from the syntax tree with no code executed.

### The helper

`trace(...ids: string[]): void` is a real exported, type-checked function, so the
canonical form is not an undefined symbol. Called inside a test body, it declares
the ids for the running test by writing them to that test's `meta`, which vitest
carries to the reporter; it does nothing else. While emission is not enabled it
returns immediately, records nothing and touches no runner state. No file is
involved.

### The reporter

While emission is enabled the reporter writes the JUnit file itself, one
`<testcase>` per test, with the runner's own outcome, and adds
`<property name="trace" value="…"/>` to each test that declared ids, holding each
distinct id once. The order of ids carries no meaning.

Emission is enabled by the environment variable `QUIRE_TRACE_EMIT=1` and by nothing
else. `QUIRE_TRACE_EMIT` is the enable name for the pytest and TypeScript emitters
only. The Rust emitter is enabled by a cargo feature, not by this variable.

### The symbol

For each case the reporter writes as `name` and again as `classname` the
`qualified_name` that `quire coverage --json` reports for the test, and as `file`
the repo-relative `/`-separated path. vitest and jest register tests only through
`it`/`test`, so there is no class-qualified form: the symbol is the title.

| Registration shape | `name` and `classname` |
| --- | --- |
| `it`/`test` | The registered title exactly as written in source. An enclosing `describe` does not qualify it. |
| `it.each`/`test.each` | The template title as written in source (for example `adds %s`), never the interpolated title; each case is its own `<testcase>`. |
| Modifier shapes (`it.skipIf(c)(…)`, `it.only`, `it.skip`) | The registered title, once, whatever the modifier. |

vitest registers each `each` case under its interpolated title and keeps no template.
The reporter therefore enables vitest's task location, reads the registration's
literal template from the source text at that location, and uses it as the symbol.
If the template cannot be recovered, the enabled run fails with an error naming the
test.

### Limits

These are known shortfalls, stated so that no conformance is claimed that the
package cannot meet.

- **Amended E-4 exception.** A test whose ids are supplied by a `trace(...)` call
  inside its body, and which never reaches that call (skipped by a modifier, or
  throwing before the call), is recorded with the runner's outcome and no `trace`
  property. This is the exception to E-4 and to FR-120-AC-5 as amended in
  [Quoin FR-120](ix://agent-ix/quoin/FR-120), and this package conforms to it. Such
  an entry has no ids known at record time and discharges nothing. A test that calls
  `trace` before it throws or skips is recorded with its ids. Declaring ids at
  registration is outside this requirement.
- **jest is unsupported.** jest runs test bodies in worker processes and hands its
  reporter an `AssertionResult` that has no user metadata field, so no channel
  carries a `trace()` call to the reporter. The requirement is revisited by
  amendment when a channel is identified.
- **Concurrent tests are unsupported.** `trace()` finds the running test through a
  module-level current-test slot that vitest sets before it awaits hooks and the
  concurrency limit, so with concurrent tests another test can overwrite the slot
  and the ids would land on the wrong test. While emission is enabled, `trace()`
  called in a test whose `concurrent` flag is true (`it.concurrent`, or a test in
  `describe.concurrent`) throws an error stating that the call was made in a
  concurrent test and naming the test the helper observed as running, which may be
  another concurrent test. No call in a concurrent test is attributed.

## Rationale

The JUnit reader exists and nothing writes the mark. A runtime reporter is the one
place that sees a test however it was declared. The runner's default JUnit naming
joins `describe` titles into a name the extractor does not use, so the reporter
renames every case.

## Acceptance Criteria

| ID | Criteria | Verification |
| --- | --- | --- |
| FR-001-AC-1 | `trace("FR-001-AC-1", "TC-041")` type-checks as an exported function accepting string ids, and a call with a non-string argument is a compile-time error. | Test (TC-001) |
| FR-001-AC-2 | While `QUIRE_TRACE_EMIT` is unset or not `1`, the helper records nothing, the reporter writes no `trace` property, the suite's runner results equal those of a run without the package, and the package has no runtime dependency beyond the runner. | Test (TC-002) |
| FR-001-AC-3 | While enabled, a test that calls `trace` with several ids, or calls it more than once, carries each distinct id once in its `trace` property; a test that did not call it carries none. | Test (TC-003) |
| FR-001-AC-4 | While enabled, every id written was an argument of a `trace` call in that test; an id is never inferred from a title or file name. | Test (TC-004) |
| FR-001-AC-5 | While enabled, an `it` inside two nested `describe` blocks reports its bare title, and an `it.each` with two cases yields two `<testcase>` elements both named by the template title; for each, `name` equals `classname`, `file` is the repo-relative path, and all three equal what `quire coverage --json` reports for the same fixture. | Test (TC-005) |
| FR-001-AC-6 | While enabled, `it.skipIf(true)(…)`, `it.only` and `it.skip` registrations each report their registered title once with the runner's outcome (`skip` for a skipped one), and a skipped test carries no ids and discharges nothing. | Test (TC-006) |
| FR-001-AC-7 | A test that calls `trace` and then throws or fails an assertion is recorded `fail` with its ids; the outcome written is always the runner's. | Test (TC-007) |
| FR-001-AC-8 | Under vitest's default parallel execution across files, each tagged test appears once with exactly its own ids, none mixed with another test's; while enabled, `trace()` called in an `it.concurrent` test throws an error stating the call was made in a concurrent test. | Test (TC-008) |
| FR-001-AC-9 | The result file is written by the reporter during the run; no sidecar file is merged and no step after vitest exits rewrites names or ids. | Test (TC-009) |
| FR-001-AC-10 | While enabled, a 500-test tagged suite adds under 5% to the median wall-clock time of the same suite with emission disabled, over at least five runs. | Test (TC-010) |
| FR-001-AC-11 | A real vitest suite run with emission enabled produces a result file that `quoin evidence record` accepts and whose obligation is bound; the same suite with its tagged test made to fail yields a failing entry and binds nothing. | Test (TC-011) |

## Constraints

| ID | Constraint | Type | Validation |
| --- | --- | --- | --- |
| FR-001-CON-1 | The package SHALL NOT merge, patch or rewrite a result file after vitest has written it (Quoin FR-120 E-8). | Design | Inspection |

## Dependencies

- **Upstream**: [Quoin FR-120](ix://agent-ix/quoin/FR-120) (the mark and the Emitter contract, including the amended E-4 exception); [quire-rs FR-051](ix://agent-ix/quire-rs/FR-051) (the marker form, and the `qualified_name` the reporter must equal, pinned by FR-051-AC-47; the end-to-end demonstration of the emitter chain is FR-051-AC-48).
- **Upstream**: [StR-001](../stakeholder/StR-001-typescript-tests-bind-ids-at-run-time.md) through [US-001](../usecase/US-001-run-a-tagged-suite-and-record-its-evidence.md).
- **Sibling**: `ix-trace-py` FR-001, the pytest binding of the same contract.
