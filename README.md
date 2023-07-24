# Anytype
Official Anytype client for MacOS, Linux, and Windows.

## Building the source
### Installation

```shell
git clone git@github.com:anyproto/anytype-ts.git
cd anytype-ts
npm install -D
```

Also, [install `gitleaks`](https://github.com/zricethezav/gitleaks#installing) to ensure proper work of pre-commit hooks.

### Install middleware library and protobuf bindings
Fetch the latest binary from the [github releases](https://github.com/anytypeio/go-anytype-middleware/releases/latest)

```shell
./update.sh <macos-latest|ubuntu-latest|windows-latest> <arm|amd> # arm/amd only for macos/ubuntu
```
	
Or compile from the source code. Follow instructions at [`anytype-heart`](https://github.com/anyproto/anytype-heart#how-to-build).

After `./update.sh` downloaded the binary or after compiling it from source, you need to move `anytypeHelper` into the `dist` Folder.

| OS CPU Type        | move command                        |
|--------------------|-------------------------------------|
| Windows            | *already copied to the dist folder* |
| MacOS <arm \| amd> | `mv darwin-*/anytypeHelper dist/`   |
| Linux <arm \| amd> | `mv linux-*/anytypeHelper dist/`    |

### Building

Build [`anytype-heart`](https://github.com/anyproto/anytype-heart) first.

```shell
npm run dist:(mac|win|linux)
```

Options:
- `ELECTRON_SKIP_NOTARIZE=1` — skip MacOS notarization process

## Running

Before running Anytype locally, you need to build [`anytype-heart`](https://github.com/anyproto/anytype-heart).

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

## Contribution
Thank you for your desire to develop Anytype together!

❤️ This project and everyone involved in it is governed by the [Code of Conduct](docs/CODE_OF_CONDUCT.md).

🧑‍💻 Check out our [contributing guide](docs/CONTRIBUTING.md) to learn about asking questions, creating issues, or submitting pull requests.

🫢 For security findings, please email [security@anytype.io](mailto:security@anytype.io) and refer to our [security guide](docs/SECURITY.md) for more information.

🤝 Follow us on [Github](https://github.com/anyproto) and join the [Contributors Community](https://github.com/orgs/anyproto/discussions).

---
Made by Any — a Swiss association 🇨🇭

Licensed under [Any Source Available License 1.0](./LICENSE.md).
