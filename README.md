[![Anytype Logo](https://github.com/anyproto/anytype-ts/blob/main/electron/img/icons/64x64.png)](https://anytype.io)
# Anytype
Official Anytype client for MacOS, Linux, and Windows.

Anytype is a personal knowledge base, a digital brain that allows you to quickly capture, describe, and connect information. You can use Anytype to create books, tasks, notes, ideas, documents, tools and organize them any way you want.

## Links

* 🌐 [Website](https://anytype.io)
* 📝 [Blog](https://blog.anytype.io)
* 📑 [Documentation](https://doc.anytype.io)
* 💼 [Technical information](https://tech.anytype.io)
* 👋 [Community forum](https://community.anytype.io)
* 💾 [Downloads](https://download.anytype.io)
* ▶️ [Google Play](https://play.google.com/store/apps/details?id=io.anytype.app)
* 🍏 [App Store](https://apps.apple.com/us/app/anytype-private-notes/id6449487029)

## Building the source

### Dependencies

[Debian-based](https://packages.debian.org/bookworm/libsecret-1-dev) (Ubuntu / Pop! OS / Mint / ... ):

```
apt install libsecret-1-dev
apt install jq
```

[Fedora](https://packages.fedoraproject.org/pkgs/libsecret/libsecret):

```
dnf install libsecret
dnf install jq
```

[Arch-based](https://archlinux.org/packages/core/x86_64/libsecret) (Manjaro / EndeavourOS / ... ):

```
pacman -S libsecret
pacman -S jq
```

[Alpine](https://pkgs.alpinelinux.org/packages?name=libsecret) (usually for docker-related stuff):

```
apk add libsecret
apk add jq
```

### Installation

```shell
git clone https://github.com/anyproto/anytype-ts
cd anytype-ts
npm install -D
```

Also, [install `gitleaks`](https://github.com/zricethezav/gitleaks#installing) to ensure proper work of pre-commit hooks.

### Install middleware library and protobuf bindings
Fetch the latest binary from the [github releases](https://github.com/anyproto/anytype-heart/releases).

**Warning** When building client from source be aware that middleware version in latest release may diverge from current client version, so it is highly recommended to [build middleware from source](https://github.com/anyproto/anytype-heart/blob/main/docs/Build.md) as well.

```shell
./update.sh <macos-latest|ubuntu-latest|windows-latest> <arm|amd> # arm/amd only for macos/ubuntu
```

After `./update.sh` downloaded the binary or after compiling it from source, you need to move `anytypeHelper` into the `dist` Folder.

| OS CPU Type        | move command                        |
|--------------------|-------------------------------------|
| Windows            | *already copied to the dist folder* |
| MacOS <arm \| amd> | `mv darwin-*/anytypeHelper dist/`   |
| Linux <arm \| amd> | `mv linux-*/anytypeHelper dist/`    |

### Building

Build [`anytype-heart`](https://github.com/anyproto/anytype-heart) first.

```shell
npm run update:locale
npm run dist:(mac|win|linux)
```

Options (these options allow building locally and bypass CI-only hooks):
- `ELECTRON_SKIP_NOTARIZE=1` — skip MacOS|Windows notarization and signature process
- `ELECTRON_SKIP_SENTRY=1` - skip source map upload to Sentry

## Running

Before running Anytype locally, you need to build [`anytype-heart`](https://github.com/anyproto/anytype-heart).

**Info**: If you want to switch directory where Anytype stores data for now it is available by adding --user-data-dir="<path>" flag to launch command (i.e. --user-data-dir="D:\Anytype").

### MacOS, Linux
```shell
SERVER_PORT=<PORT> ANYPROF=:<PROFILER_PORT> npm run start:dev
```

### Windows
```shell
SERVER_PORT=<PORT> ANYPROF=:<PROFILER_PORT> npm run start:dev-win
```

Options:
- `SERVER_PORT` — NPM variable, local server port
- `ANYPROF` — Go variable, profiler port, access `http://localhost:<PORT>/debug/pprof/profile?seconds=30` for profiling

## Localisation

Project localisation is managed via [Crowdin](https://crowdin.com/project/anytype-desktop)

`npm run update:locale` - Update localisation files

## Contribution
Thank you for your desire to develop Anytype together!

❤️ This project and everyone involved in it is governed by the [Code of Conduct](https://github.com/anyproto/.github/blob/main/docs/CODE_OF_CONDUCT.md).

🧑‍💻 Check out our [contributing guide](https://github.com/anyproto/.github/blob/main/docs/CONTRIBUTING.md) to learn about asking questions, creating issues, or submitting pull requests.

🫢 For security findings, please email [security@anytype.io](mailto:security@anytype.io) and refer to our [security guide](https://github.com/anyproto/.github/blob/main/docs/SECURITY.md) for more information.

🤝 Follow us on [Github](https://github.com/anyproto) and join the [Contributors Community](https://github.com/orgs/anyproto/discussions).

---
Made by Any — a Swiss association 🇨🇭

Licensed under [Any Source Available License 1.0](./LICENSE.md).
