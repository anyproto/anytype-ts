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

### Install node addon library and protobuf bindings
Fetch the latest binary from the [github releases](https://github.com/anytypeio/go-anytype-middleware/releases/latest)

```shell
./update.sh <GITHUB_USER> <GITHUB_TOKEN> <macos-latest|ubuntu-latest|windows-latest>
```
	
Or compile from the source code. Follow instructions at [`go-anytype-middleware`.](https://github.com/anytypeio/go-anytype-middleware#how-to-build)

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
Thank you for your desire to develop Anytype together. 

Currently, we're not ready to accept PRs, but we will in the nearest future.

Follow us on [Github](https://github.com/anyproto) and join the [Contributors Community](https://github.com/orgs/anyproto/discussions).

---
Made by Any — a Swiss association 🇨🇭

Licensed under [Any Source Available License 1.0](./LICENSE.md).