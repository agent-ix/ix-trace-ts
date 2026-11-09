---
id: FR-002
title: "implementing decorator and wrapper declare the ids a production symbol implements"
type: FR
relationships:
  - target: "ix://agent-ix/ix-trace-ts/StR-002"
    type: "implements"
    cardinality: "1:1"
  - target: "ix://agent-ix/ix-trace-ts/US-002"
    type: "implements"
    cardinality: "1:1"
  - target: "ix://agent-ix/quire-rs/FR-062"
    type: "consumes"
    cardinality: "1:1"
---

# FR-002: implementing decorator and wrapper declare the ids a production symbol implements

## Description

The package SHALL export a function `implementing(...ids: string[])` that a
production class, method or function carries to declare the specification ids it
**implements** — its scope. It is the TypeScript counterpart of the `#[implements]`
attribute of `ix-trace-rs` (`ix-trace-rs` FR-002) and of the `implements` decorator
of `ix-trace-py` (`ix-trace-py` FR-002).

The static side is [quire-rs FR-062](ix://agent-ix/quire-rs/FR-062): it binds the
construct from the syntax tree with no code executed, through the
`typescript_decorator` and `typescript_wrapper` forms that
[spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004)
declares. This requirement adds only the run-time object the written forms name, so
that they type-check.

### The name

The construct is named `implementing`. `implements` is a reserved word in
strict-mode code and an ES module is always strict, so a module can neither declare
nor import a binding named `implements`.

### Two written forms, one function

`implementing(...ids)` returns a function that serves both written forms.

- **Decorator**: `@implementing("FR-007-AC-1")` on a class declaration or a method.
  A decorator is the form for a class or a method.
- **Wrapper**: `implementing("FR-007-AC-1")(declaration)` as the initializer of a
  `const`, `let` or `var`, for an arrow function or function expression held in a
  binding. The wrapper is the form where a decorator does not apply: a TypeScript
  `function` declaration admits no decorator, so a function is written as such a
  binding to carry the construct.

The returned function changes nothing it is given. Called with one argument, as the
wrapper form calls it and as a legacy class decorator is called, it returns that
argument. Called with two or more, as a standard decorator `(value, context)` and a
legacy member decorator `(target, key, descriptor)` are called, it returns
`undefined`, which both conventions read as "leave the declaration as it is"; a
legacy member decorator that returned its first argument would be read as a
replacement descriptor. It does not wrap, replace or mutate the declaration, does
not record it in a registry and does not read the environment, so a marked
declaration is identical to the unmarked one.

`implementing` is a separate name from `trace` and not an option of it. `trace`
declares evidence and may back an acceptance criterion; `implementing` declares
scope and never may, and the module contract keeps them apart so that a
mis-declared form binds nothing rather than the wrong thing (quire-rs
FR-062-CON-3). The package adds no production `trace` construct: a test names its
evidence with `trace(...)`, which quire-rs FR-051 already binds.

### Arguments

Each argument is typed `string`, so a non-string argument is a compile-time error
(as FR-001-AC-1 holds for `trace`). At least one is required, enforced by the
signature `implementing(first: string, ...rest: string[])`. At run time an argument
that is not a `string` and a call with no argument throw a `TypeError` that names
the argument, so a call that bypassed the type checker fails when the module is
loaded. The package checks the type of an id and not its shape or membership. The
static side binds only quoted string literals.

### Import posture

Importing the package for `implementing` imports nothing beyond the language
runtime, and in particular not `vitest`, so production code that uses it runs where
no test runner is installed. The reporter of
[FR-001](./FR-001-vitest-trace-helper-and-reporter.md) is a separate entry that only
a vitest configuration loads.

### Typing across decorator conventions

The returned function is typed to be accepted by a standard (TC39) decorator
position on a class and on a method, by the legacy `experimentalDecorators` class
and method positions, and as a one-argument wrapper that returns the type of its
argument, so the same call compiles under either compiler setting and a wrapped
arrow function keeps its own type.

## Rationale

Production scope in TypeScript is declared today by an `Implements:` comment
matched as text. A comment is not a construct the compiler checks, so a changed
separator, a wrapped line or an example in prose binds the wrong thing or nothing.
A decorator or a call is a node the parser hands over with name and arguments
already separated. Returning every declaration unchanged keeps the construct free at
run time, which matters because a decorator and a wrapper both execute when the
module loads, where the Rust attribute is compile-time.

## Acceptance Criteria

| ID | Criteria | Verification |
| --- | --- | --- |
| FR-002-AC-1 | `implementing("FR-002-AC-1", "FR-002-AC-2")` type-checks as an exported function accepting string ids, and a call with a non-string argument or with no argument is a compile-time error. | Test |
| FR-002-AC-2 | As a decorator under standard decorators, `@implementing(...)` on a class and on a method leaves each unchanged: the class is the identical constructor, and the method's behaviour and `prototype` property descriptor equal those of the unmarked method. | Test |
| FR-002-AC-3 | As a decorator under `experimentalDecorators`, `@implementing(...)` on a class and on a method leaves each unchanged, and the method's property descriptor is not replaced. | Test |
| FR-002-AC-4 | As a wrapper, `implementing("FR-002-AC-3")(fn)` returns the identical function object for an arrow function and for a function expression, and the wrapped value keeps its parameter and return types at compile time. | Test |
| FR-002-AC-5 | `implementing(...)` adds no property to what it is given and no entry to any module-level registry: the own keys of a marked class, method and function, and the package's exports, are equal before and after marking. | Test |
| FR-002-AC-6 | At run time a call with no argument, and an argument that is not a `string`, each throw a `TypeError` that names the offending argument; several ids and a repeated id are accepted. | Test |
| FR-002-AC-7 | Loading a module that uses `implementing` in a process in which `vitest` cannot be resolved succeeds, and `vitest` is not among the modules loaded afterwards. | Test |
| FR-002-AC-8 | `implementing(...)` used on a test registration or on a `describe` callback changes neither the test's registration nor its recorded `trace` ids under `QUIRE_TRACE_EMIT=1`. | Test |
| FR-002-AC-9 | A marked function and an unmarked function are the same object, so a call to the marked one adds no time: the median call time of 100,000 calls differs under 5% over at least five runs. | Test |
| FR-002-AC-10 | A fixture module whose production class, method and wrapped arrow-valued const carry `implementing(...)` yields, through `quire coverage --json` under the module of `spec-artifacts-process`, one `implements` relation per declared id on each marked symbol and no `verifies` relation. | Test |

## Constraints

| ID | Constraint | Type | Validation |
| --- | --- | --- | --- |
| FR-002-CON-1 | `implementing` SHALL NOT be an argument or flag of `trace`. | Design | Inspection |
| FR-002-CON-2 | The package SHALL NOT export a production `trace` construct. | Design | Inspection |
| FR-002-CON-3 | The package SHALL NOT parse source or import the extractor to bind a marker; static binding is quire-rs. | Design | Inspection |

## Dependencies

- **Upstream**: [quire-rs FR-062](ix://agent-ix/quire-rs/FR-062) (the `implements` relation and the `typescript_decorator` and `typescript_wrapper` syntax positions); [spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004) (the declared forms); `ix-trace-rs` FR-002 (the Rust counterpart).
- **Upstream**: [US-002](../usecase/US-002-declare-the-ids-a-production-symbol-implements.md), which traces to [StR-002](../stakeholder/StR-002-typescript-production-code-declares-the-ids-it-implements.md).
- **Sibling**: [FR-001](./FR-001-vitest-trace-helper-and-reporter.md), the evidence side; `ix-trace-py` FR-002, the Python construct.
