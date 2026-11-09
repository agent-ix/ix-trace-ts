# ix-trace-ts

vitest reporter and `trace()` helper that emit requirement trace ids into results. jest is unsupported.

Private, pre-release. No implementation yet; this is the scaffold.

- Emitter contract: quoin FR-120.
- Specification: quire-rs FR-080, to be relocated into this repo's `spec/`.
- Ticket: PLAT-334.

Licensed AGPL-3.0-or-later. See `LICENSE`, `CLA.md` and `CONTENT_RIGHTS.md`.

---

Template tooling:


- ✅ CI via [`agent-ix/nodejs-actions`](https://github.com/agent-ix/nodejs-actions)
- 📦 **Local Development** via [PNPM](https://pnpm.io/) + Corepack
- 🧪 Vitest for unit testing (supports coverage, JSON output)
- 💃 Prettier and ESLint for code quality
- 🏷 Tag-triggered release workflow with registry support
- 🔖 Automatic versioning based on Git tags

---

## 🚀 Getting Started

This project uses **pnpm** with **Corepack** for local development.

### Prerequisites

- Node.js 20+
- Corepack enabled (`corepack enable`)

### Setup

```bash
# Install dependencies (uses pnpm version from package.json)
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test
```

---

## 📜 Scripts

All development commands are defined in `package.json` scripts.
Run `pnpm run help` or `pnpm run` to see the full list.

### Core Development

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `pnpm run build`  | Compile TypeScript                      |
| `pnpm test`       | Run tests                               |
| `pnpm run lint`   | Run ESLint                              |
| `pnpm run format` | Run Prettier                            |
| `pnpm run clean`  | Remove build artifacts and node_modules |

### Package Management

| Command                        | Description                              |
| ------------------------------ | ---------------------------------------- |
| `pnpm run pkg:add <pkg>`       | Add dependency                           |
| `pnpm run pkg:add-dev <pkg>`   | Add dev dependency                       |
| `pnpm run pkg:update`          | Update dependencies                      |
| `pnpm run pkg:use-local <pkg>` | Link local package via @agent-ix/js-deps |

### Publishing & Docker

| Command                  | Description                                   |
| ------------------------ | --------------------------------------------- |
| `pnpm run publish`       | Publish to GitHub Packages (upstream)         |
| `pnpm run publish:local` | Publish to local npm.ix registry (via Docker) |
| `pnpm run docker:build`  | Build release Docker image                    |

---

## 🛠 Makefile

A `Makefile` is provided for backwards compatibility. It delegates all commands to the equivalent `pnpm run` scripts.

```bash
make build          # -> pnpm run build
make test           # -> pnpm run test
make local-publish  # -> pnpm run publish:local
```

## Contributing and licence

Licensed AGPL-3.0-or-later (see `LICENSE`). Contributions require a signed CLA: see `CONTRIBUTING.md` and `CLA.md`. External-content policy: `CONTENT_RIGHTS.md`.
