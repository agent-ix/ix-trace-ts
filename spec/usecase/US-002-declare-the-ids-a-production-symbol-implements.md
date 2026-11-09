---
id: US-002
title: "Declare the ids a production symbol implements"
type: US
relationships:
  - target: "ix://agent-ix/ix-trace-ts/StR-002"
    type: "traces_to"
---

# US-002: Declare the ids a production symbol implements

## Story

**As a** developer whose production TypeScript code realises specified requirements
**I want** to write the ids a class, method or function implements on it as a
decorator, or around the function that is its value
**So that** the requirement-to-code link is read from the syntax tree and survives
reformatting, rather than depending on the wording of a comment.

## Context

The developer already marks tests with `trace(...)`. They want the production side
to be a construct too, they do not want production code to import vitest, and they
write many functions as arrow-valued constants, where a decorator does not apply.

## Acceptance Examples (Illustrative)

```ts
import { implementing } from "@agent-ix/ix-trace-ts";

@implementing("FR-007-AC-1")
export class HeadingLookup {
  @implementing("FR-007-AC-2")
  first(document: string): string { return document; }
}

export const parse = implementing("FR-007-AC-3")((text: string) => text.trim());
```

`quire coverage` reports an `implements` relation from `HeadingLookup`,
`HeadingLookup.first` and `parse` to their ids, and no coverage number moves.

## Constraints (Contextual)

The construct marks scope, never evidence. A test is marked with `trace(...)`;
`implementing(...)` on a test registration binds nothing. A `function` declaration
takes no decorator; write it as an arrow-valued constant to wrap it.

## Dependencies (Contextual)

`quire-rs` FR-062 for the static reading.

## Notes (Informative)

An id held in a variable is accepted at run time, but the static side binds only
double-quoted string literals.
