# Anytype Desktop

> **Local‑first, peer‑to‑peer & end‑to‑end‑encrypted knowledge OS for macOS, Windows&nbsp;&amp;&nbsp;Linux.**

[![Latest release](https://img.shields.io/github/v/release/anyproto/anytype-ts?label=download)](https://github.com/anyproto/anytype-ts/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/anyproto/anytype-ts/ci.yml?label=CI)](https://github.com/anyproto/anytype-ts/actions)
[![Crowdin](https://badges.crowdin.net/e/1ecaaee720d0b123268584461f4cf6dc/localized.svg)](https://crowdin.com/project/anytype)
[![License](https://img.shields.io/badge/license-ASAL‑1.0‑blue.svg)](LICENSE.md)

<p align="center">
  <a href="https://anytype.io"><img src="./docs/logo.svg" alt="Anytype logo" width="240"></a>
</p>

Anytype is a **personal knowledge base**—your digital brain—that lets you gather, connect and remix any kind of information. Create pages, tasks, wikis, journaling systems, entire applications and *define your own data model* while your data stays **offline‑first, private and encrypted** on your devices.


## ✨ Key Features

- **Offline‑first, local‑first** storage with optional P2P sync across devices.
- **Zero‑knowledge end‑to‑end encryption** powered by *any‑sync*.
- **Composable building blocks**: mix & match text, databases, kanban, calendars & custom Types.
- **Cross‑platform desktop client** built with Electron + TypeScript.
- **Extensible** through a gRPC API and AI "Agents" (see [`AGENTS.md`](./AGENTS.md)).
- **Open code** under the Any Source Available License 1.0.

## 📚 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Building from Source](#-building-from-source)
- [Development Workflow](#-development-workflow)
- [Localisation](#-localisation)
- [Contributing](#-contributing)
- [Community & Support](#-community--support)
- [License](#-license)


## 🚀 Quick Start

Just want to use Anytype? Grab the latest binary from the [releases page](https://github.com/anyproto/anytype-ts/releases) or head to **[download.anytype.io](https://download.anytype.io)**, install it and log in with your *Any‑ID*.


## 🛠 Prerequisites

| Platform | System packages |
| -------- | -------------- |
| **Debian/Ubuntu** | `sudo apt install libsecret-1-dev jq` |
| **Fedora** | `sudo dnf install libsecret jq` |
| **Arch Linux** | `sudo pacman -S libsecret jq` |
| **Alpine** | `apk add libsecret jq` |

Additionally you need:

- **Node.js ≥ 20** & npm ≥ 10 *(or pnpm ≥ 9)*
- **Go ≥ 1.22** (to build [anytype‑heart](https://github.com/anyproto/anytype-heart))


## 🏗 Building from Source

```bash
# 1 – Clone repo & install JS dependencies
$ git clone https://github.com/anyproto/anytype-ts.git
$ cd anytype-ts
$ npm ci               # or: pnpm i --frozen-lockfile

# 2 – Fetch / build middleware & protobuf bindings
$ ./update.sh <macos-latest|ubuntu-latest|windows-latest> <arm|amd>
# …or build it from source if you need an exact match.

# 3 – Build the core engine once (outside this repo)
$ git clone https://github.com/anyproto/anytype-heart.git && cd anytype-heart
$ make build && cd ..

# 4 – Build the Electron desktop app
$ npm run update:locale
$ npm run dist:mac      # dist:win or dist:linux
```

### Environment Flags

| Variable | Effect |
| -------- | ------ |
| `ELECTRON_SKIP_NOTARIZE` | Skip macOS / Windows signing & notarization |
| `ELECTRON_SKIP_SENTRY`   | Do **not** upload sourcemaps to Sentry |


## 🧑‍💻 Development Workflow

Run the helper (from *anytype‑heart*) and start the Electron client with hot‑reload:

```bash
$ anytypeHelper &              # or ./bin/anytypeHelper

# macOS / Linux
$ npm run start:dev            # Windows: npm run start:dev-win
```

Optional environment variables:

| Name | Purpose |
| ---- | ------- |
| `SERVER_PORT` | Local gRPC port of *anytype‑heart* |
| `ANYPROF` | Expose Go `pprof` on `http://localhost:<port>/debug/pprof` |


## 🌍 Localisation

Translations are managed on [Crowdin](https://crowdin.com/project/anytype). To pull the latest locale files run:

```bash
npm run update:locale
```


## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) and abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

For security issues **do not open public issues** – email **security@anytype.io** instead and see our [Security Guide](SECURITY.md).


## 💬 Community & Support

- **Forum** – <https://community.anytype.io>
- **Discord** – join the *Anytype Contributors* server
- **Docs** – <https://doc.anytype.io>
- **Blog** – <https://blog.anytype.io>

---

## 📝 License

Made by Any — a Swiss association 🇨🇭

Licensed under [Any Source Available License 1.0](./LICENSE.md).
