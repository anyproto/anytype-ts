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
- [Localisation](#-localisation)
- [Contributing](#-contributing)
- [Community & Support](#-community--support)
- [License](#-license)


## 🚀 Quick Start

Just want to try it? Grab the latest installer from the [releases page](https://github.com/anyproto/anytype-ts/releases) or head to **[download.anytype.io](https://download.anytype.io)** and log in with your *Any‑ID*.


## 🛠 Prerequisites

| Platform          | System packages                            |
|-------------------|--------------------------------------------|
| **Debian/Ubuntu** | `sudo apt install libsecret-1-dev jq`      |
| **Fedora**        | `sudo dnf install libsecret jq`            |
| **Arch Linux**    | `sudo pacman -S libsecret jq`              |
| **Alpine**        | `apk add libsecret jq`                     |

Also install:

- **Node.js ≥ 20** & npm ≥ 10 *(or pnpm ≥ 9)*
- **Go ≥ 1.22** (to build [anytype‑heart](https://github.com/anyproto/anytype-heart))


## 🏗 Building from Source

```bash
# 1 – Clone & install JS deps
git clone https://github.com/anyproto/anytype-ts.git
cd anytype-ts
npm ci               # or: pnpm i --frozen-lockfile

# 2 – Fetch / build middleware & protobuf bindings
./update.sh <macos-latest|ubuntu-latest|windows-latest> <arm|amd>

# 3 – Build the core engine (outside this repo)
git clone https://github.com/anyproto/anytype-heart.git && cd anytype-heart
make install-dev-js && cd ../anytype-ts

# 4 – Build the Electron desktop app
npm run update:locale
npm run dist:mac      # or dist:win / dist:linux
```

### Environment flags

| Variable                 | Effect                                           |
|--------------------------|--------------------------------------------------|
| `ELECTRON_SKIP_NOTARIZE` | Skip macOS / Windows signing & notarizing         |
| `ELECTRON_SKIP_SENTRY`   | Don’t upload sourcemaps to Sentry                 |


## 🧑‍💻 Development Workflow

You can either run the helper (from *anytype‑heart*) separately or just launch the client with hot‑reload:

```bash
anytypeHelper &       # or ./bin/anytypeHelper
npm run start:dev     # Windows: npm run start:dev-win
```

Optional env vars:

| Name         | Purpose                                  |
|--------------|-------------------------------------------|
| `SERVER_PORT`| Local gRPC port of *anytype‑heart*        |
| `ANYPROF`    | Expose Go `pprof` on `localhost:<port>`   |

### Web Clipper extension Development

Switch manifest before testing/packaging the addon for different browsers using the following scripts:

```bash
npm run ext:manifest:firefox
npm run ext:manifest:chromium
```

## 🌍 Localisation

Translations live on [Crowdin](https://crowdin.com/project/anytype-desktop). Pull the latest locale files with:

```bash
npm run update:locale
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
