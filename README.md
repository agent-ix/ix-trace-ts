# ix-trace-ts

A vitest reporter and a `trace()` helper that emit requirement trace ids into
test results, so a requirement can be traced to the tests that verify it. jest
is unsupported.

Emission is enabled by setting `QUIRE_TRACE_EMIT=1`.

Status: private, pre-release. The package is not published anywhere.

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
