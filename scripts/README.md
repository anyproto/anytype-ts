# Scripts

## start-dev.js

Development process manager for `bun run start:dev`. Starts Vite dev server and Electron, with proper cleanup on exit — when Electron closes, Vite is killed automatically. Replaces the previous `npm-run-all --parallel` approach which left orphaned Vite/esbuild processes.

Respects `SERVER_PORT` env var (default: 8080).

## wait-for-localhost.js

Polls a localhost port until it responds. Used internally by the dev scripts to wait for Vite before launching Electron.

## start-web.js

Starts anytypeHelper + Vite for browser-only development (no Electron). See `bun run start:web`.

---

# Protobuf Generation

## generate-protos.sh

Generates the TypeScript protobuf bindings (into `middleware/`) and the gRPC service registry (`src/ts/lib/api/service.ts`) from the `.proto` definitions.

**Both outputs are git-ignored and must be generated before the first build.** A fresh checkout has neither, so Vite fails with `Failed to resolve import "./service" from src/ts/lib/api/dispatcher.ts` until you run this.

Two modes:

| Command | Source of `.proto` files | Requires |
|---------|--------------------------|----------|
| `bash scripts/generate-protos.sh` (or `bun run generate:protos`) | local `../anytype-heart` checkout (runs `make install-dev-js`) | Go toolchain **and** the `anytype-heart` repo at `../anytype-heart` |
| `bash scripts/generate-protos.sh --from-dist` | `dist/lib/protos/` (populated by `./update.sh`) | just `protoc` — **use this if you don't develop the middleware** |

### Linux first-time setup (Fedora / Ubuntu)

From a clean clone, the `--from-dist` path needs no Go toolchain or `anytype-heart` checkout:

```bash
# 1. JS deps (provides ts-proto, used by the generator)
bun install

# 2. protoc + the well-known google/protobuf/*.proto files + jq (used by update.sh)
#    Fedora:
sudo dnf install protobuf-compiler protobuf-devel jq
#    Debian / Ubuntu:
sudo apt install protobuf-compiler libprotobuf-dev jq

# 3. Download the middleware binary + proto/JSON assets into dist/
#    (use `arm` instead of `amd` on ARM machines)
./update.sh ubuntu-latest amd

# 4. Generate middleware/ bindings + src/ts/lib/api/service.ts
bash scripts/generate-protos.sh --from-dist

# 5. Run
bun run start:dev
```

> **Why `protobuf-devel` / `libprotobuf-dev`?** The `.proto` files import well-known types such as `google/protobuf/struct.proto`. The `protobuf-compiler` package ships only the `protoc` binary — the well-known `.proto` definitions live in the `-devel` / `-dev` package. Without it you get `google/protobuf/struct.proto: File not found`. `protoc` auto-searches `/usr/include`, where these packages install the files, so no extra `--proto_path` is needed. (On macOS, Homebrew's `protobuf` bundles both, which is why this step is invisible there.)

### Troubleshooting

| Error | Fix |
|-------|-----|
| `Failed to resolve import "./service" from src/ts/lib/api/dispatcher.ts` | `service.ts` was never generated — run the generate step above |
| `google/protobuf/struct.proto: File not found` | Install `protobuf-devel` (Fedora) / `libprotobuf-dev` (Debian/Ubuntu) |
| `protoc not found` | Install `protobuf-compiler` |
| `ts-proto not found at .../protoc-gen-ts_proto` | Run `bun install` first |
| `dist/lib/protos not found` (with `--from-dist`) | Run `./update.sh <platform> <arch>` first |
| `anytype-heart repo not found at ../anytype-heart` (local mode) | Clone it to `../anytype-heart`, or use `--from-dist` instead |

## generate-service-registry.js

Invoked by `generate-protos.sh` — never run directly. Generates `src/ts/lib/api/service.ts`, a registry mapping every gRPC method name to its ts-proto request/response `MessageFns`. Pass `--from-dist` to read protos from `dist/lib/protos/` instead of `../anytype-heart`.

---

# Release Notes Generator

This script automatically generates release notes by extracting Linear task IDs from Git commit messages and fetching their details from the Linear API.

## Features

- 📝 Extracts Linear task IDs (e.g., `JS-1234`) from commit messages
- 🔗 Fetches task titles, descriptions, and metadata from Linear API
- 📊 Groups tasks by priority (Urgent, High, Medium, Low)
- 📋 Includes commits without Linear task IDs
- 📄 Supports both Markdown and JSON output formats
- 🏷️ Works with tags or commit ranges

## Prerequisites

1. **Linear API Key**: Get your API key from [Linear Settings](https://linear.app/settings/api)
2. **Node.js**: The script uses Node.js built-in modules (no additional dependencies required)

## Setup

### 1. Set up your Linear API key

You can set the API key in multiple ways:

**Option A: Environment variable (temporary)**
```bash
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
```

**Option B: `.env` file (recommended for development)**
```bash
echo "LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx" >> .env
# Then source it before running the script
source .env
```

**Option C: In your shell profile (permanent)**
Add to `~/.bashrc`, `~/.zshrc`, or equivalent:
```bash
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
```

### 2. Verify setup

Test that everything works:
```bash
LINEAR_API_KEY=your_key npm run release:notes -- --help
```

## Usage

### Basic Usage

Generate release notes from the last tag to HEAD:
```bash
LINEAR_API_KEY=your_key npm run release:notes
```

Or if you've set the environment variable:
```bash
npm run release:notes
```

### Advanced Usage

**Generate notes between two specific tags:**
```bash
npm run release:notes -- --from v0.51.17-alpha --to v0.51.18-alpha
```

**Save to a file:**
```bash
npm run release:notes -- --output RELEASE_NOTES.md
```

**Generate JSON output:**
```bash
npm run release:notes -- --format json --output release-notes.json
```

**Use with specific commit range:**
```bash
npm run release:notes -- --from abc123 --to def456
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from <tag>` | Start tag/commit | Latest tag |
| `--to <tag>` | End tag/commit | `HEAD` |
| `--output <file>` | Output file path | stdout |
| `--format <type>` | Output format (`markdown` or `json`) | `markdown` |
| `--help` | Show help message | - |

## Output Format

### Markdown Format

The script generates release notes with the following structure:

```markdown
# Release Notes: v0.51.18-alpha

Changes from v0.51.17-alpha to v0.51.18-alpha

Generated: 2025-12-02T10:00:00.000Z

## 🔴 Urgent

### JS-8441: Fix critical authentication bug
Brief description of the task from Linear...

**Details:** Status: Done | Assignee: John Doe | Labels: bug, security

**Commits:**
- `de7281a` JS-8441: fix

## 🟠 High Priority

### JS-7802: Improve performance
...

## 📝 Other Commits

- `153c1a9` fix crash
- `7956004` add analyticsSpaceId
```

### JSON Format

```json
{
  "version": "v0.51.18-alpha",
  "from": "v0.51.17-alpha",
  "generatedAt": "2025-12-02T10:00:00.000Z",
  "tasks": [
    {
      "id": "JS-8441",
      "title": "Fix critical authentication bug",
      "description": "Full description...",
      "state": "Done",
      "priority": 1,
      "team": "JavaScript",
      "assignee": "John Doe",
      "labels": ["bug", "security"],
      "commits": [
        {
          "hash": "de7281ad42...",
          "subject": "JS-8441: fix",
          "author": "Developer Name",
          "date": "2025-12-02 10:00:00 +0000"
        }
      ]
    }
  ],
  "otherCommits": [...]
}
```

## Integration with CI/CD

### GitHub Actions

Add to your `.github/workflows/release.yml`:

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Fetch all history for tags

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Generate Release Notes
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
        run: |
          npm run release:notes -- --output RELEASE_NOTES.md

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body_path: RELEASE_NOTES.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Electron Builder Integration

You can integrate this with electron-builder's release process. Add to your build hooks:

**electron/hook/afterpack.js** (or create a new hook):
```javascript
const { execSync } = require('child_process');
const fs = require('fs');

exports.default = async function(context) {
  // Generate release notes after packaging
  try {
    console.log('Generating release notes...');
    execSync('npm run release:notes -- --output dist/RELEASE_NOTES.md', {
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn('Failed to generate release notes:', error.message);
  }
};
```

## Commit Message Format

For the script to work effectively, use this commit message format:

### ✅ Good Examples

```
JS-1234: Add new feature
JS-5678: Fix bug in editor
JS-9012: Update dependencies (JS-9013)
```

### ❌ Bad Examples

```
fix bug                    # No Linear ID
WIP                        # No Linear ID
JS1234: fix               # Missing hyphen
```

### Best Practices

1. **Start with the Linear ID**: Begin your commit message with the task ID
2. **Use descriptive messages**: Even though the script fetches details from Linear, the commit message should be meaningful
3. **One task per commit**: Keep commits focused on a single task when possible
4. **Multiple tasks**: If a commit relates to multiple tasks, list them: `JS-1234: Main task (also relates to JS-5678)`

## Troubleshooting

### "LINEAR_API_KEY environment variable is required"

Make sure you've set the `LINEAR_API_KEY` environment variable. Get your key from https://linear.app/settings/api

### "Could not find any tags"

If you don't have any Git tags yet, the script will include all commits. Create a tag first:
```bash
git tag v0.1.0
```

### "Linear API error: 401"

Your API key is invalid or expired. Generate a new one from Linear settings.

### "No changes in this release"

This means there are no commits between the specified range. Check your tag names:
```bash
git tag --list
git log --oneline v0.51.17-alpha..v0.51.18-alpha
```

### Script doesn't find Linear IDs

Make sure your commit messages follow the correct format: `TEAM-NUMBER` (e.g., `JS-1234`). The pattern is case-sensitive and requires a hyphen.

## Development

### Testing the script

Test with a small commit range:
```bash
LINEAR_API_KEY=your_key node scripts/generate-release-notes.js --from HEAD~5 --to HEAD
```

### Debugging

Add debug output by uncommenting console.log statements in the script, or use:
```bash
node --inspect scripts/generate-release-notes.js
```

## License

This script is part of the Anytype project. See the main LICENSE.md for details.
