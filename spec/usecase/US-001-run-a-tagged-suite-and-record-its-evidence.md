---
id: US-001
title: "Run a tagged suite and record its evidence"
type: US
relationships:
  - target: "ix://agent-ix/ix-trace-ts/StR-001"
    type: "traces_to"
---

# US-001: Run a tagged suite and record its evidence

## Story

**As a** developer with a vitest suite whose tests call `trace(...)`
**I want** one run of the suite to produce a result file naming the ids each test
verifies
**So that** `quoin evidence record` binds those ids to the outcome the run
actually produced.

## Context

The developer already tags tests with the helper and wants the ids to travel with
the result by adding the reporter and an environment variable.

## Acceptance Examples (Illustrative)

```ts
it("adds", () => {
  trace("FR-001-AC-1", "TC-041");
  expect(1 + 1).toBe(2);
});
```

```text
QUIRE_TRACE_EMIT=1 vitest run
```

The `<testcase>` for `adds` carries `<property name="trace" value="FR-001-AC-1,TC-041"/>`
and reports the same name the extractor reports for it.

## Constraints (Contextual)

The call goes inside the test body. A test that never reaches it (skipped, or
throwing first) is recorded with the runner's outcome and no ids.

## Dependencies (Contextual)

vitest, and `quoin evidence record` to consume the file.

## Notes (Informative)

Tests declared concurrent are unsupported: the call throws while emission is
enabled.
