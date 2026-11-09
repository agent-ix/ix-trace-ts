# ix-trace-ts

A vitest reporter and a `trace()` helper that emit requirement trace ids into
test results, so a requirement can be traced to the tests that verify it. jest
is unsupported.

Emission is enabled by setting `QUIRE_TRACE_EMIT=1`.

Status: private, pre-release. The package is not published anywhere.

## Usage

Planned: the `@agent-ix/ix-trace-ts/vitest` import path below takes effect with the
implementation of the package-entry layout (spec FR-002-AC-16); the `exports` map
does not declare it yet.

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

See `CONTRIBUTING.md`, `CLA.md` and `CONTENT_RIGHTS.md`.

## Licence

AGPL-3.0-or-later. See `LICENSE`.
