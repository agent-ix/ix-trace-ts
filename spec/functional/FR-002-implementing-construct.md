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

The returned function SHALL change nothing it is given.

- When it is called with one argument, as the wrapper form calls it and as a legacy
  class decorator is called, it SHALL return that argument.
- When it is called with two or more arguments, as a standard decorator
  `(value, context)` and a legacy member decorator `(target, key, descriptor)` are
  called, it SHALL return `undefined`, which both conventions read as "leave the
  declaration as it is". A legacy member decorator that returned its first argument
  would be read as a replacement descriptor.
- When it is called with no argument, it SHALL throw a `TypeError` showing the
  accepted call shapes.
- It SHALL NOT wrap, replace or mutate the declaration, record it in a registry, or
  read the environment, so a marked declaration is identical to the unmarked one.

**Stated limit.** The result is chosen by argument count alone. That is a
deliberate simplification and not an impossibility: a standard decorator receives a
context object with a `kind` and a legacy decorator receives a key and a descriptor,
which a callback's `(fn, index, array)` does not, so the conventions could be told
apart by inspecting the arguments, and this construct does not.
Used as a callback (`ids.map(implementing("A-1"))`) or given a stray second
argument, the returned function returns `undefined` or its first argument as the
count dictates and raises no error. Such a use is outside the construct.

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

### Package entries

The package SHALL have two entries, declared in the `exports` map of its
`package.json`.

- The package root, `@agent-ix/ix-trace-ts`, SHALL export `implementing` and nothing
  else, SHALL have no runtime dependency, and SHALL NOT import `vitest` anywhere in
  its module graph, so production code that imports `implementing` runs where no test
  runner is installed. The root is the namespace-import target that
  [spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004) and
  quire-rs FR-062 pin (`import * as ixTrace from "@agent-ix/ix-trace-ts"`).
- The subpath `@agent-ix/ix-trace-ts/vitest` SHALL export `trace` and the reporter
  `TraceReporter` of [FR-001](./FR-001-vitest-trace-helper-and-reporter.md), and
  SHALL be the only entry that loads `vitest`.

The package is pre-release, so moving `trace` and the reporter from the root to the
subpath replaces the old import path and carries no compatibility export at the root.
FR-001's documented imports, the README and spec.md name the subpath.

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

### Accepted positions and typing

The accepted positions are a class declaration, a method and a `get` or `set`
accessor, the same constructs quire-rs FR-062 binds (it parses an accessor as a
method definition). The returned function SHALL be typed so that each accepted
position compiles and so that a field or a parameter position is a compile-time
error:

- under standard (TC39) decorators it accepts a class, method, getter and setter
  context and not a field context;
- under `experimentalDecorators` it accepts a class constructor and a
  `(target, key, descriptor)` member call whose descriptor is required, so a
  property call (no descriptor) and a parameter call (a numeric index) do not
  type-check;
- as a one-argument wrapper it returns the type of its argument, so a wrapped arrow
  function keeps its own type.

A decorator on a class expression type-checks, because the compiler gives it the
same context as a class declaration; it binds nothing statically (quire-rs FR-062).

## Rationale

Production scope in TypeScript is declared today by an `Implements:` comment
matched as text. A comment is not a construct the compiler checks, so a changed
separator, a wrapped line or an example in prose binds the wrong thing or nothing.
A decorator or a call is a node the parser hands over with name and arguments
already separated. Returning every declaration unchanged keeps the construct free at
run time, which matters because a decorator and a wrapper both execute when the
module loads, where the Rust attribute is compile-time.

## Acceptance Criteria

| ID           | Criteria                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Verification |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| FR-002-AC-1  | `implementing("FR-002-AC-1", "FR-002-AC-2")` type-checks as an exported function accepting string ids, and a call with a non-string argument or with no argument is a compile-time error.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Test         |
| FR-002-AC-2  | As a decorator under standard decorators, `@implementing(...)` on a class, a method and a getter or setter leaves each unchanged: the class is the identical constructor, and for each member `Object.getOwnPropertyDescriptor(Class.prototype, name)` has the same `value`, `get`, `set`, `writable`, `enumerable` and `configurable` as for the unmarked member.                                                                                                                                                                                                                                                                                                                                             | Test         |
| FR-002-AC-3  | As a decorator under `experimentalDecorators`, `@implementing(...)` on a class, a method and an accessor leaves each unchanged, with `Object.getOwnPropertyDescriptor(Class.prototype, name)` equal to the unmarked member's on every attribute.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Test         |
| FR-002-AC-4  | As a wrapper, `implementing("FR-002-AC-3")(fn)` returns the identical function object for an arrow function and for a function expression, and the wrapped value keeps its parameter and return types at compile time.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Test         |
| FR-002-AC-5  | `implementing(...)` retains no reference to what it marks. The test runs in a process started with `--expose-gc`, either a dedicated `node --expose-gc` subprocess or the runner's documented worker `execArgv` option, and FAILS, never skips, when `gc` is not a function. It marks a function, a class and a method inside a scope, releases them, yields to the event loop, calls `gc()`, yields again, and requires each `WeakRef` to dereference to `undefined`; the own property names and symbols of each marked object and of `implementing` itself are equal before and after marking. A fixture implementation that pushes to a module-level array, a closure array or a `Map` fails the same test. | Test         |
| FR-002-AC-6  | At run time a call with no argument throws a `TypeError` whose message shows a well-formed call; an argument that is not a `string` throws a `TypeError` naming its type and position; several ids and a repeated id are accepted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Test         |
| FR-002-AC-7  | Loading the package root in a process in which `vitest` cannot be resolved succeeds and `implementing` works, and `vitest` is not among the modules loaded afterwards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Test         |
| FR-002-AC-8  | `implementing(...)` used on a test registration or on a `describe` callback changes neither the test's registration nor its recorded `trace` ids under `QUIRE_TRACE_EMIT=1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Test         |
| FR-002-AC-9  | The returned function called with no argument throws a `TypeError` that shows the accepted call shapes, and called with two arguments returns `undefined`, and with one argument returns that argument, as the Two written forms section states.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Test         |
| FR-002-AC-10 | A fixture module whose production class, method and wrapped arrow-valued const carry `implementing(...)` yields, through `quire coverage --json` under the module of `spec-artifacts-process`, one `implements` relation per declared id on each marked symbol and no `verifies` relation, for both `implementing(...)` and `ixTrace.implementing(...)`, while a renamed import, and a single-quoted, template-literal or concatenated id, runs and binds nothing.                                                                                                                                                                                                                                             | Test         |
| FR-002-AC-11 | `implementing("")`, `implementing("FR 2")`, `implementing("A-1, A-2")`, `implementing("FR-XXX")` and `implementing("1-A")` each throw a `TypeError` naming the argument, while `implementing("ZZ-001")`, `implementing("MADEUP-042-AC-9")` and `implementing("interface_004-AC-1")` are accepted, since shape is checked and membership never is.                                                                                                                                                                                                                                                                                                                                                              | Test         |
| FR-002-AC-12 | A marked declaration nested in a function body is evaluated, and its ids checked, on each call of that function, and a module-level one once when the module loads; in both the marked declaration is unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Test         |
| FR-002-AC-13 | Under standard decorators a class, method, getter and setter position type-checks and a field position is a compile-time error; under `experimentalDecorators` a class and a `(target, key, descriptor)` member call type-check and a property call and a parameter call are compile-time errors; a class-expression position type-checks.                                                                                                                                                                                                                                                                                                                                                                     | Test         |
| FR-002-AC-14 | The package root exports exactly `implementing`: the keys of the module namespace of `@agent-ix/ix-trace-ts` equal `["implementing"]`, and `trace` and `TraceReporter` are not among them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Test         |
| FR-002-AC-15 | The module graph reachable from the package root contains no `vitest` specifier and the package declares no runtime dependency, checked over the built root entry and its imports.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Test         |
| FR-002-AC-16 | The `exports` map of `package.json` declares `.` and `./vitest`, and `@agent-ix/ix-trace-ts/vitest` exports `trace` and `TraceReporter` (FR-001-AC-14).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Test         |

## Constraints

| ID           | Constraint                                                                                               | Type   | Validation    |
| ------------ | -------------------------------------------------------------------------------------------------------- | ------ | ------------- |
| FR-002-CON-1 | `implementing` SHALL NOT be an argument or flag of `trace`.                                              | Design | Inspection    |
| FR-002-CON-2 | The package SHALL NOT export a production `trace` construct.                                             | Design | Inspection    |
| FR-002-CON-3 | The package SHALL NOT parse source or import the extractor to bind a marker; static binding is quire-rs. | Design | Inspection    |
| FR-002-CON-4 | The package SHALL NOT encode which kinds exist; shape is checked and membership never is.                | Design | Test (TC-024) |
| FR-002-CON-5 | The package root SHALL NOT re-export `trace` or `TraceReporter` for compatibility.                       | Design | Inspection    |

## Dependencies

- **Upstream**: [quire-rs FR-062](ix://agent-ix/quire-rs/FR-062) (the `implements` relation and the `typescript_decorator` and `typescript_wrapper` syntax positions); [spec-artifacts-process FR-004](ix://agent-ix/spec-artifacts-process/FR-004) (the forms it will declare); `ix-trace-rs` FR-002 and FR-003 (the Rust counterpart and the shape rule).
- **Upstream**: [US-002](../usecase/US-002-declare-the-ids-a-production-symbol-implements.md), which traces to [StR-002](../stakeholder/StR-002-typescript-production-code-declares-the-ids-it-implements.md).
- **Sibling**: [FR-001](./FR-001-vitest-trace-helper-and-reporter.md), the evidence side; `ix-trace-py` FR-002, the Python construct.
