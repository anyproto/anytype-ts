![Anytype Logo](https://github.com/anyproto/anytype-ts/raw/main/electron/img/icons/64x64.png)](https://anytype.io)

# Anytype

Official **Anytype** client for **macOS, Linux and Windows**.

## Building the source

### Dependencies

| Distro | Commands |
|:--|:--|
| Debian / Ubuntu | `apt install libsecret-1-dev jq` |
| Fedora | `dnf install libsecret jq` |
| Arch | `pacman -S libsecret jq` |
| Alpine | `apk add libsecret jq` |

You also need **Node JS ≥ 18** (npm ≥ 8) and **Go ≥ 1.20** if you want to build the core engine.

### Installation

```bash
git clone https://github.com/anyproto/anytype-ts
cd anytype-ts
npm install -D          # or: pnpm i --frozen-lockfile
```

*(Install **gitleaks** so the pre-commit hooks work.)*

---

## Building binaries

Run the helper that fetches middleware & protobufs, then build a desktop package:

```bash
./update.sh <macos|ubuntu|windows> <x64|arm64>
npm run dist:<mac|linux|win>        # produces *.dmg / .AppImage / .exe
```

### Options  
These CLI flags override CI presets:

| Flag | Values | Purpose |
|------|--------|---------|
| `--platform` | `win` `mac` `linux` | target OS |
| `--arch`     | `x64` `arm64`       | target CPU |
| `--config`   | `debug` `beta` `alpha` `prod` | build flavour |

---

## Running

Before launching the UI you must compile [`anytype-heart`](https://github.com/anyproto/anytype-heart):

```bash
git clone https://github.com/anyproto/anytype-heart
cd anytype-heart && make build && cd ..
```

Then, from the **anytype-ts** directory:

### macOS / Linux

```bash
anytypeHelper &       # starts the Go backend
npm run start         # launches Electron in dev-mode
```

### Windows

```powershell
Start-Process .\anytypeHelper.exe
npm run start-win
```

> **Tip:** Want to store user data elsewhere?  
> Add `--user-data-dir="D:\Anytype"` (or any path) to the launch command.

---

## Translations

Pull the latest Crowdin locale files whenever you need them:

```bash
npm run update:locale
```

---

© **Any** Association — released under the **Any Source Available License 1.0**.
