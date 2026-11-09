# ix-trace-ts

A vitest reporter and a `trace()` helper that emit requirement trace ids into
test results, so a requirement can be traced to the tests that verify it, and an
`implementing()` decorator and wrapper that production code uses to declare the
ids it implements. jest is unsupported.

Emission is enabled by setting `QUIRE_TRACE_EMIT=1`.

Status: pre-release. Published to public npm as `@agent-ix/ix-trace-ts` via Trusted Publishing.

## Usage

The package has two entries. `trace` and `TraceReporter` are imported from
`@agent-ix/ix-trace-ts/vitest`, the only entry that loads vitest. The package root
exports `implementing` only and has no runtime dependency, so production code that
imports it runs where no test runner is installed.

```ts
// vitest.config.ts
import { TraceReporter } from "@agent-ix/ix-trace-ts/vitest";
export default {
  test: { reporters: [new TraceReporter({ outputFile: "junit.xml" })] },
};
```

```ts
import { trace } from "@agent-ix/ix-trace-ts/vitest";
it("verifies the thing", () => {
  trace("FR-001-AC-1");
});
```

Run with `QUIRE_TRACE_EMIT=1` to add the `trace` property to the JUnit file.
Without it the reporter writes vitest's plain JUnit output.

### Declaring what production code implements

```ts
import * as ixTrace from "@agent-ix/ix-trace-ts";

@ixTrace.implementing("FR-007-AC-1")
export class Parser {
  @ixTrace.implementing("FR-007-AC-2")
  parse() {}
}

export const load = ixTrace.implementing("FR-007-AC-3")(() => 1);
```

A class, method, getter or setter takes it as a decorator, under standard
decorators or `experimentalDecorators`. A function is written as a `const`
arrow or function expression wrapped by `implementing(...)(fn)`, which returns the
function unchanged. Each id must be id-shaped (for example `FR-007-AC-1`) or a
`TypeError` is thrown when the call is evaluated. Write ids as double-quoted
literals; only those bind statically.

## Specification

- Emitter contract: quoin FR-120.
- This package: quire-rs FR-080.

## Development

```bash
pnpm install
make build
make test
make lint
```

## Contributing

See the [Agent IX contributing guide and CLA](https://github.com/agent-ix/.github) and `CONTENT_RIGHTS.md`.

## Licence

AGPL-3.0-or-later. See `LICENSE`.
