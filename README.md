# Anytype Desktop

> **Local‑first, peer‑to‑peer & end‑to‑end‑encrypted knowledge OS for macOS, Windows & Linux.**

[![Latest release](https://img.shields.io/github/v/release/anyproto/anytype-ts?label=Download)](https://github.com/anyproto/anytype-ts/releases)
[![Build Status](https://github.com/anyproto/anytype-ts/actions/workflows/build.yml/badge.svg?branch=main&event=release)](https://github.com/anyproto/anytype-ts/actions/workflows/build.yml)
[![Crowdin](https://badges.crowdin.net/anytype-desktop/localized.svg)](https://crowdin.com/project/anytype-desktop)
[![License](https://img.shields.io/badge/license-ASAL-1.0-blue.svg)](LICENSE.md)

Anytype is a **personal knowledge base**—your digital brain—that lets you gather, connect and remix all kinds of information. Create pages, tasks, wikis, journals—even entire apps—and *define your own data model* while your data stays **offline‑first, private and encrypted** across devices.


## ✨ Key Features

- **Offline‑first, local storage** with optional peer‑to‑peer sync.
- **Zero‑knowledge encryption** powered by *any‑sync*.
- **Composable blocks**: text, databases, kanban, calendar & custom Types.
- **Cross‑platform desktop client** built with Electron + TypeScript.
- **Extensible** through a gRPC API and AI "Agents" (see [`AGENTS.md`](./AGENTS.md)).
- **Open code** under the Any Source Available License 1.0.

## 📚 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Building from Source](#-building-from-source)
- [Development Workflow](#-development-workflow)
  - [Updating Middleware](#updating-middleware)
  - [Updating Protobuf Bindings](#updating-protobuf-bindings)
- [Localisation](#-localisation)
- [Contributing](#-contributing)
- [Community & Support](#-community--support)
- [License](#-license)


## 🚀 Quick Start

Just want to try it? Grab the latest installer from the [releases page](https://github.com/anyproto/anytype-ts/releases) or head to **[download.anytype.io](https://download.anytype.io)** and log in with your *Any‑ID*.

## 🏗 Building from Source

On ARM systems, node package `keytar` needs to be rebuilt during installation, so make sure that your system has a C++ compiler, Python3 and Python package `setuptools`. E.g. on Debian/Ubuntu: `sudo apt install python3-setuptools`. Alternatively, on any system, create a Python virtual environment (venv) and inside the venv: `pip install setuptools`. Then build from source inside the venv.

```bash
# 1 – Clone & open this repository
git clone https://github.com/anyproto/anytype-ts.git && cd anytype-ts

# 2 - Install JavaScript dependencies
bun install

# 3 – Fetch / build middleware & protobuf bindings
./update.sh <macos-latest|ubuntu-latest|windows-latest> <arm|amd>

# 4 – Build the core engine
cd .. && git clone https://github.com/anyproto/anytype-heart.git && cd anytype-heart
make install-dev-js CLIENT_DESKTOP_PATH=../anytype-ts && cd ../anytype-ts

# 5 - Update locale
bun run update:locale

# 6 – Build the Electron desktop app (see package.json for more options)
bun run dist:<linux|win|mac>
```

### Environment flags

| Variable                 | Effect                                           |
|--------------------------|--------------------------------------------------|
| `ELECTRON_SKIP_NOTARIZE` | Skip macOS / Windows signing & notarizing         |
| `ELECTRON_SKIP_SENTRY`   | Don’t upload sourcemaps to Sentry                 |


## 🧑‍💻 Development Workflow

You can use [nix](https://nix.dev/install-nix) to install all the required dependencies at once.

```shell
# open a shell with all the required dependencies
nix develop --command $SHELL
```

Start the dev server with hot‑reload (builds Electron bundle, starts Vite, then launches Electron):

```bash
bun run start:dev     # Windows: bun run start:dev-win
# add --user-data-dir=./my_dir to electron(-win) script in package.json if you want to use custom user data directory
```

When you close Electron, the Vite dev server is automatically stopped.

For browser-based development without Electron:

```bash
bun run start:web
```

See [Web Mode](./docs/src/ts/lib/web/README.md) for details.

### Useful commands

```bash
bun run build         # Production build (Vite)
bun run build:dev     # Development build (Vite)
bun run typecheck     # TypeScript type checking
bun run lint          # Run linters (Biome + ESLint)
```

### Environment variables

| Name         | Purpose                                           |
|--------------|---------------------------------------------------|
| `SERVER_PORT`| Vite dev server port (default: `8080`)             |
| `ANYPROF`    | Expose Go `pprof` on `localhost:<port>`            |

### Web Clipper Extension

Build and switch manifest for different browsers:

```bash
bun run build:ext
bun run ext:manifest:firefox
bun run ext:manifest:chromium
```

### Updating Middleware

The middleware version is pinned in `middleware.version`. To fetch a pre-built middleware binary and its protobuf/JSON assets:

```bash
./update.sh <macos-latest|ubuntu-latest|windows-latest> <arm|amd>
```

This downloads the `anytype-heart` release matching the version in `middleware.version`, extracts the `anytypeHelper` binary into `dist/`, and copies protobuf definitions and generated JSON into `dist/lib/`.

For CI environments (requires GitHub credentials):

```bash
./update-ci.sh --user=<GITHUB_USER> --token=<GITHUB_TOKEN> --os=<OS> --arch=<ARCH> --middleware-version=<VERSION>
```

### Updating Protobuf Bindings

To regenerate TypeScript protobuf bindings from a local [anytype-heart](https://github.com/anyproto/anytype-heart) checkout (expected at `../anytype-heart`):

```bash
bun run generate:protos
```

**Prerequisites:** `protoc` (protobuf compiler) must be installed, and `bun install` must have been run (for `ts-proto`).

This reads `.proto` files from `../anytype-heart`, generates TypeScript bindings into `middleware/`, and creates a service registry.

## 🌍 Localisation

Translations live on [Crowdin](https://crowdin.com/project/anytype-desktop). Pull the latest locale files with:

```bash
bun run update:locale
```


## 🤝 Contributing

We ♥ contributors! Please read our [Contributing Guide](https://github.com/anyproto/.github/blob/main/docs/CONTRIBUTING.md) and follow the [Code of Conduct](https://github.com/anyproto/.github/blob/main/docs/CODE_OF_CONDUCT.md).

> **Security issues?** Don’t open public issues—email **security@anytype.io** and see our [Security Guide](https://github.com/anyproto/anytype-ts?tab=security-ov-file).


## 💬 Community & Support

- **Forum** – <https://community.anytype.io>
- **Docs** – <https://doc.anytype.io>
- **Blog** – <https://blog.anytype.io>


## 📝 License

Made by **Any** — a Swiss association 🇨🇭

Licensed under the **Any Source Available License 1.0**.
