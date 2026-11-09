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
  - target: "ix://agent-ix/spec-artifacts-process/FR-004"
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
construct from the syntax tree, through the
`typescript_decorator` and `typescript_wrapper` forms that
[spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004) will
declare (planned there, not yet declared in the manifest). This requirement adds only the run-time object the written forms name, so
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
signature `implementing(first: string, ...rest: string[])`. At run time each
argument is also checked to be **id-shaped**, the shape rule of `ix-trace-rs`
FR-003: a KIND that begins with an ASCII letter, followed by any mix of ASCII
letters, digits and underscores, then one or more hyphen-separated segments that
are each non-empty and alphanumeric, at least one of which contains an ASCII digit.
The package checks shape and never membership: `ZZ-001` is accepted although no
module declares that kind, and the kind vocabulary stays in the module.

- If a call has no argument, then the package SHALL throw a `TypeError` whose
  message shows a well-formed call, `implementing("FR-007-AC-1")`.
- If an argument is not a `string`, then the package SHALL throw a `TypeError`
  naming the argument's type and position.
- If an argument is a `string` that is not id-shaped, including the empty string,
  `"FR 2"` and `"A-1, A-2"`, then the package SHALL throw a `TypeError` naming that
  argument.

Each error is thrown when `implementing(...)` is evaluated, so a call that bypassed
the type checker fails when its statement executes and not silently. The `trace`
helper of [FR-001](./FR-001-vitest-trace-helper-and-reporter.md) is unchanged and
checks type only; the shape check belongs to this construct, whose only effect is
the static relation, so an id that binds nothing is a defect worth failing on. All
three errors are `TypeError`, the JavaScript convention for an invalid argument.

### Import posture

Importing the package for `implementing` imports nothing beyond the language
runtime, and in particular not `vitest`, so production code that uses it runs where
no test runner is installed. The reporter of
[FR-001](./FR-001-vitest-trace-helper-and-reporter.md) is a separate entry that only
a vitest configuration loads.

### Statically bound spellings

The static side resolves no import. The package documents one namespace import,
`import * as ixTrace from "@agent-ix/ix-trace-ts"`, and the spellings it binds are
`implementing(...)` and `ixTrace.implementing(...)`, for both the decorator and the
wrapper form, as the module declaration pins them
([spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004)).
A renamed import (`import { implementing as impl }`, or another namespace name)
works at run time and is not bound statically and raises no finding, because the
shipped patterns are anchored at the start of the candidate.

Only **double-quoted** string literals bind statically, because the module's
patterns read double quotes. A single-quoted literal, a template literal, a
concatenation, and an id held in a variable, is a `string` at run time and is
accepted, but binds nothing statically. Write each id as a double-quoted literal
for a construct that is to be read.

### When it runs

The decorator or wrapper expression runs when its statement executes. For a
module-level class, method or binding that is once when the module loads. For a
declaration nested in a function body it is each call of that function, so the ids
are checked on every such call; the marked declaration is still the unchanged
declaration, and nothing is added per call of the marked function itself.

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
| FR-002-AC-5 | `implementing(...)` retains no reference to what it marks: a function, class and method marked inside a scope, then released, are collected under `--expose-gc` (a `WeakRef` to each dereferences to `undefined` after `gc()`), and the own keys of each and the package's exports are equal before and after marking, so a registry held in a module, a closure or an in-place container would fail it. | Test |
| FR-002-AC-6 | At run time a call with no argument throws a `TypeError` whose message shows a well-formed call; an argument that is not a `string` throws a `TypeError` naming its type and position; several ids and a repeated id are accepted. | Test |
| FR-002-AC-7 | Loading a module that uses `implementing` in a process in which `vitest` cannot be resolved succeeds, and `vitest` is not among the modules loaded afterwards. | Test |
| FR-002-AC-8 | `implementing(...)` used on a test registration or on a `describe` callback changes neither the test's registration nor its recorded `trace` ids under `QUIRE_TRACE_EMIT=1`. | Test |
| FR-002-AC-9 | The wrapped function is the unwrapped function: `wrapped === unwrapped` holds for an arrow function and for a function expression, so a call to it adds no work. | Test |
| FR-002-AC-10 | A fixture module whose production class, method and wrapped arrow-valued const carry `implementing(...)` yields, through `quire coverage --json` under the module of `spec-artifacts-process`, one `implements` relation per declared id on each marked symbol and no `verifies` relation, for both `implementing(...)` and `ixTrace.implementing(...)`, while a renamed import, and a single-quoted, template-literal or concatenated id, runs and binds nothing. | Test |
| FR-002-AC-11 | `implementing("")`, `implementing("FR 2")`, `implementing("A-1, A-2")`, `implementing("FR-XXX")` and `implementing("1-A")` each throw a `TypeError` naming the argument, while `implementing("ZZ-001")`, `implementing("MADEUP-042-AC-9")` and `implementing("interface_004-AC-1")` are accepted, since shape is checked and membership never is. | Test |
| FR-002-AC-12 | A marked declaration nested in a function body is evaluated, and its ids checked, on each call of that function, and a module-level one once when the module loads; in both the marked declaration is unchanged. | Test |

## Constraints

| ID | Constraint | Type | Validation |
| --- | --- | --- | --- |
| FR-002-CON-1 | `implementing` SHALL NOT be an argument or flag of `trace`. | Design | Inspection |
| FR-002-CON-2 | The package SHALL NOT export a production `trace` construct. | Design | Inspection |
| FR-002-CON-3 | The package SHALL NOT parse source or import the extractor to bind a marker; static binding is quire-rs. | Design | Inspection |
| FR-002-CON-4 | The package SHALL NOT encode which kinds exist; shape is checked and membership never is. | Design | Test (TC-024) |

## Dependencies

- **Upstream**: [quire-rs FR-062](ix://agent-ix/quire-rs/FR-062) (the `implements` relation and the `typescript_decorator` and `typescript_wrapper` syntax positions); [spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004) (the forms it will declare); `ix-trace-rs` FR-002 and FR-003 (the Rust counterpart and the shape rule).
- **Upstream**: [US-002](../usecase/US-002-declare-the-ids-a-production-symbol-implements.md), which traces to [StR-002](../stakeholder/StR-002-typescript-production-code-declares-the-ids-it-implements.md).
- **Sibling**: [FR-001](./FR-001-vitest-trace-helper-and-reporter.md), the evidence side; `ix-trace-py` FR-002, the Python construct.
