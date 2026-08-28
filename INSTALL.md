# 🚀 Anytype-ts Installation & Build Guide

This guide provides step-by-step instructions for installing dependencies, compiling the UI, running development mode, deploying to existing Anytype desktop installations, and packaging standalone binaries across **macOS**, **Linux**, and **Windows**.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [macOS Installation & Build](#-macos)
3. [Linux Installation & Build](#-linux)
4. [Windows Installation & Build](#-windows)
5. [Development & Live Reload](#-development-mode)
6. [Standalone Packaging & Distributables](#-packaging--distributables)
7. [Troubleshooting & FAQ](#-troubleshooting)

---

## ⚙️ Prerequisites

Before building `anytype-ts`, ensure you have the following tools installed:

| Tool | Recommended Version | Required For |
| :--- | :--- | :--- |
| **Bun** | `1.1+` (or `1.2+`) | Package management, scripts, fast bundling |
| **Node.js** | `18.x` or `20.x` LTS | Tooling and Electron script execution |
| **Go** | `1.20+` | Native messaging host & hot-deploy script (`deploy.go`) |
| **Git** | `2.x+` | Version control & submodules |

---

## 🍏 macOS

### 1. Install Prerequisites

Install Homebrew (if not already installed) and install Bun + Go:

```bash
# Install Homebrew (optional, if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Bun and Go
brew install bun go
```

Alternatively, install Bun directly:
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clone the Repository & Install Dependencies

```bash
git clone https://github.com/anyproto/anytype-ts.git
cd anytype-ts

# Install dependencies via Bun
bun install
```

### 3. Build the UI

```bash
# Using Makefile
make build

# Or directly with Bun
bun run build
```

### 4. Deploy Directly to Installed Anytype (`/Applications/Anytype.app`)

If you already have Anytype installed on your Mac, you can hot-deploy your custom build directly into the app:

```bash
# Builds and deploys into /Applications/Anytype.app/Contents/Resources
make install

# Or using the Go deploy script
go run scripts/deploy.go
```

> **Note:** Completely restart Anytype (`Cmd + Q` and re-open) to see your changes.

---

## 🐧 Linux

*(Ubuntu, Debian, Fedora, Arch Linux, etc.)*

### 1. Install Prerequisites

#### Debian / Ubuntu / Mint:
```bash
# Update package list and install build essentials & Go
sudo apt update
sudo apt install -y curl git build-essential golang

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### Arch Linux / Manjaro:
```bash
sudo pacman -S git base-devel go bun
```

#### Fedora / RHEL:
```bash
sudo dnf install git make gcc gcc-c++ golang
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Clone & Install Dependencies

```bash
git clone https://github.com/anyproto/anytype-ts.git
cd anytype-ts

# Install dependencies
bun install
```

### 3. Build the UI

```bash
make build
# or
bun run build
```

### 4. Deploy to Installed Anytype on Linux

```bash
# Automatically finds installed Anytype in /opt/Anytype, /usr/share/anytype, or ~/.local/share
make install

# Or specify custom path manually if using a custom location:
go run scripts/deploy.go --app-path /opt/Anytype/resources
```

---

## 🪟 Windows

*(Windows 10 / 11 with PowerShell)*

### 1. Install Prerequisites

Open **PowerShell as Administrator**:

```powershell
# 1. Install Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# 2. Install Go (via winget or from https://go.dev/dl/)
winget install GoLang.Go

# 3. Install Git (via winget or from https://git-scm.com/)
winget install Git.Git
```

Close and reopen PowerShell to refresh your environment PATH.

### 2. Clone & Install Dependencies

```powershell
git clone https://github.com/anyproto/anytype-ts.git
cd anytype-ts

# Install dependencies
bun install
```

### 3. Build the UI

```powershell
bun run build
```

### 4. Deploy to Installed Windows Anytype

If Anytype Desktop is installed via the standard Windows installer (located at `%LOCALAPPDATA%\Programs\Anytype\resources`):

```powershell
go run scripts/deploy.go
```

If your Anytype is installed in a custom directory:
```powershell
go run scripts/deploy.go --app-path "C:\Path\To\Anytype\resources"
```

---

## ⚡ Development Mode

To run live UI development with Hot Module Replacement (HMR):

### macOS & Linux:
```bash
# Starts the Vite dev server and opens Electron automatically
bun run start:dev
```

### Windows:
```powershell
bun run start:dev-win
```

### Web Browser Mode (Without Electron):
```bash
bun run start:dev-web
```

---

## 📦 Packaging & Distributables

To build standalone, distributable installers (`.dmg`, `.AppImage`, `.deb`, `.exe`):

### macOS:
```bash
# Apple Silicon (M1/M2/M3/M4)
bun run dist:macarm

# Intel (x64)
bun run dist:macamd

# Universal (Both architectures)
bun run dist:mac
```
Output files will be generated in `dist/`.

### Linux:
```bash
# x64 AppImage
bun run dist:linuxamd-appimage

# x64 Deb / RPM / Tar
bun run dist:linuxamd

# ARM64 AppImage
bun run dist:linuxarm-appimage
```

### Windows:
```powershell
# Creates NSIS .exe installer in dist/
bun run dist:win
```

---

## 🛠 Troubleshooting

### 1. `Could not resolve "./service" from "src/ts/lib/api/dispatcher.ts"`
- Ensure `src/ts/lib/api/service.ts` is present in your repo.
- If missing, generate it automatically:
  ```bash
  node scripts/generate-service-registry.js --from-dist
  ```

### 2. `ASAR extraction failed: asar: command not found`
- The deploy script uses `npx --yes asar` by default. Ensure npm/node is available in your PATH.

### 3. Changes do not reflect after `make install`
- Fully close Anytype before testing:
  - **macOS**: `Cmd + Q` (or run `killall Anytype` in terminal).
  - **Windows**: Right-click Anytype tray icon -> Quit (or `Stop-Process -Name Anytype`).
  - **Linux**: `killall anytype` or close via taskbar.
