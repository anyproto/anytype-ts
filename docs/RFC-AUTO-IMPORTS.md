# RFC: Replace Barrel Imports with Auto-Imports

## Problem

The project uses barrel files (`index.ts`) to re-export modules through a central hub. Nearly every file imports from `'Lib'`:

```typescript
import { I, S, U, C, J, M, keyboard, translate, Relation, Dataview, ... } from 'Lib';
```

This creates **circular dependency chains**:

```
lib/index.ts  →  exports S (from Store)
store/record.ts  →  imports { Dataview, Relation } from 'Lib'
lib/dataview.ts  →  imports { S } from 'Lib'
```

`Lib → Store → Lib` is the tightest cycle, but similar cycles exist between `Lib`, `Store`, `Model`, and `Interface`.

### Why it matters

| Issue | Impact |
|---|---|
| **Circular dependencies** | Runtime `undefined` bugs when any module reads an import at the top level instead of inside a function |
| **No tree-shaking** | Vite/Rollup cannot determine what's unused — importing `translate` pulls in the entire Store, all Models, all Interfaces |
| **Slower dev startup** | The bundler must resolve the entire dependency graph before serving the first module |
| **Hidden coupling** | Every file depends on everything — changing one store can trigger reloads across the whole app |

### Current scale

- **~250 files** import from `'Lib'` barrel
- **~250 files** import from `'Component'` barrel
- **5 barrel files** form the core: `Lib`, `Store`, `Interface`, `Model`, `Component`
- **~35 symbols** re-exported through `Lib` alone
- **~80 symbols** re-exported through `Component`

---

## Solution: `unplugin-auto-import`

[unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import) is a Vite/Rollup/Webpack plugin that **automatically injects import statements** at build time when it detects known identifiers in source code.

### How it works

1. You define a mapping: identifier → module path
2. When Vite processes a file and sees e.g. `S.Common.space`, it checks if `S` is in the mapping
3. If yes, it prepends `import * as S from 'Store'` to the file automatically
4. A generated `auto-imports.d.ts` file tells TypeScript about the globals

**Before (current):**
```typescript
import { I, S, U, C, J, keyboard, translate, Action } from 'Lib';

const MyComponent = observer(() => {
    const space = S.Common.space;
    const name = translate('commonName');
    // ...
});
```

**After (with auto-imports):**
```typescript
// No import line — the plugin injects it at build time

const MyComponent = observer(() => {
    const space = S.Common.space;
    const name = translate('commonName');
    // ...
});
```

The source file is cleaner. The build output is identical (or better, since only used imports are injected).

---

## Configuration

### 1. Install

```bash
bun add -d unplugin-auto-import
```

### 2. Vite plugin setup

In `vite.config.ts`:

```typescript
import AutoImport from 'unplugin-auto-import/vite';

// Inside plugins array:
AutoImport({
    imports: [
        // Namespace imports (import * as X from '...')
        {
            'Store':        [['*', 'S']],
            'Interface':    [['*', 'I']],
            'Model':        [['*', 'M']],
            'Hook':         [['*', 'H']],
            'json':         [['*', 'J']],
        },

        // Named imports from Lib submodules (direct paths, no barrel)
        {
            'Lib/api/command':              [['*', 'C']],
            'Lib/util':                     [['*', 'U']],
            'Lib/keyboard':                 [['keyboard', 'keyboard'], ['Key', 'Key']],
            'Lib/sidebar':                  [['sidebar', 'sidebar']],
            'Lib/storage':                  [['default', 'Storage']],
            'Lib/mark':                     [['default', 'Mark']],
            'Lib/relation':                 [['default', 'Relation']],
            'Lib/dataview':                 [['default', 'Dataview']],
            'Lib/focus':                    [['focus', 'focus']],
            'Lib/scrollOnMove':             [['scrollOnMove', 'scrollOnMove']],
            'Lib/analytics':                [['analytics', 'analytics']],
            'Lib/history':                  [['history', 'history']],
            'Lib/action':                   [['default', 'Action']],
            'Lib/onboarding':               [['default', 'Onboarding']],
            'Lib/survey':                   [['default', 'Survey']],
            'Lib/preview':                  [['default', 'Preview']],
            'Lib/highlight':                [['default', 'Highlight']],
            'Lib/animation':                [['default', 'Animation']],
            'Lib/translate':                [['translate', 'translate']],
            'Lib/sound':                    [['default', 'Sound'], ['SYSTEM_SOUND_ID', 'SYSTEM_SOUND_ID']],
            'Lib/renderer':                 [['default', 'Renderer']],
            'Lib/api/dispatcher':           [['dispatcher', 'dispatcher']],
            'Lib/api/mapper':               [['Mapper', 'Mapper']],
            'Lib/api/struct':               [['Encode', 'Encode'], ['Decode', 'Decode']],
            'Lib/service/sparkOnboarding':  [['getSparkOnboardingService', 'getSparkOnboardingService']],
        },
    ],

    // Generate TypeScript declarations so the editor understands the globals
    dts: './src/ts/auto-imports.d.ts',

    // Only process project source files
    include: [
        /\.tsx?$/,
    ],

    // Don't inject into these files (they define the exports themselves)
    exclude: [
        /src\/ts\/lib\/index\.ts$/,
        /src\/ts\/store\/index\.ts$/,
        /src\/ts\/interface\/index\.ts$/,
        /src\/ts\/model\/index\.ts$/,
        /src\/ts\/component\/index\.ts$/,
    ],

    // ESLint integration (optional — prevents "no-undef" errors)
    eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
    },
}),
```

### 3. TypeScript config

Add the generated declaration file to `tsconfig.json`:

```jsonc
{
    "include": [
        "src/**/*",
        "src/ts/auto-imports.d.ts"  // ← add this
    ]
}
```

### 4. ESLint config (if needed)

If ESLint reports `no-undef` for auto-imported identifiers, extend the generated config:

```jsonc
{
    "extends": ["./.eslintrc-auto-import.json"]
}
```

---

## Migration Plan

### Phase 0: Setup & validate (1 PR)

1. Install `unplugin-auto-import`
2. Add the plugin config to `vite.config.ts` (as above)
3. Run `bun run start:dev` — verify the generated `auto-imports.d.ts` is correct
4. Run `bun run typecheck` and `bun run lint` — everything should still pass with **zero file changes** (the plugin coexists with explicit imports)

This is the safety net — nothing breaks because explicit imports still work alongside auto-imports.

### Phase 1: Migrate Lib barrel consumers (~250 files)

Remove the `import { ... } from 'Lib'` line from each file. The auto-import plugin will inject only what's actually used.

**Approach:** A codemod script or find-and-replace:

```bash
# Dry run: find all files with the Lib barrel import
grep -rl "from 'Lib'" src/ts/ --include='*.ts' --include='*.tsx'
```

For each file:
1. Delete the `import { ... } from 'Lib'` line
2. Run `bun run typecheck` to verify nothing broke

This can be done in batches by directory:
- `src/ts/store/` (14 files)
- `src/ts/model/` (~20 files)
- `src/ts/lib/` (~30 files) — skip `lib/index.ts` itself
- `src/ts/interface/` (~15 files)
- `src/ts/component/` (~170 files) — can split by subdirectory

### Phase 2: Migrate Component barrel consumers (~250 files)

Same approach for `import { ... } from 'Component'`. Add Component mappings to the auto-import config:

```typescript
{
    'Component/form/button':    [['default', 'Button']],
    'Component/form/input':     [['default', 'Input']],
    'Component/form/select':    [['default', 'Select']],
    'Component/util/icon':      [['default', 'Icon']],
    'Component/util/iconObject':[['default', 'IconObject']],
    'Component/util/loader':    [['default', 'Loader']],
    // ... etc for all ~80 component exports
}
```

> **Note:** The Component barrel is large (80+ symbols). Consider whether all of them need auto-import, or whether some rarely-used components are better left as explicit imports. A good rule: auto-import symbols used in 5+ files, keep explicit imports for the rest.

### Phase 3: Delete barrel files

Once no file imports from the barrel paths:

1. Delete `src/ts/lib/index.ts`
2. Delete `src/ts/component/index.ts`
3. Keep `src/ts/store/index.ts`, `src/ts/interface/index.ts`, `src/ts/model/index.ts` — these are consumed as `import * as S` namespace imports by the auto-import plugin, and they don't cause circular deps on their own
4. Update `vite.config.ts` aliases: remove `Lib` → `src/ts/lib` barrel alias if no longer needed (keep `Lib/*` for direct path imports)

### Phase 4: Verify & clean up

1. Run `bun run typecheck` — must pass
2. Run `bun run lint` — must pass
3. Run `bun run build` — must produce a working production build
4. Compare bundle size before/after — expect improvement from tree-shaking
5. Compare dev startup time — expect improvement from smaller dependency graph
6. Run `npx madge --circular src/ts/` to confirm no remaining circular dependencies

---

## What changes for developers

| Before | After |
|---|---|
| Add `translate` to the Lib import line | Just use `translate()` — it's auto-injected |
| Every new lib utility must be added to `lib/index.ts` barrel | Just export from the file — auto-import config maps it |
| IDE shows import from `'Lib'` on go-to-definition | IDE shows the actual source file (`Lib/translate`) |
| Moving a function between lib files requires updating the barrel | Just move it — update the auto-import mapping if the path changed |

### Things to watch out for

1. **Identifier collisions** — If a local variable shadows an auto-imported name (e.g., a local `translate` variable), the plugin won't inject the import. This is correct behavior but can be confusing. ESLint's `no-shadow` rule catches these.

2. **New symbols** — When adding a new utility to `Lib/`, add a mapping in the auto-import config. Otherwise developers will need an explicit import (which still works fine).

3. **IDE support** — VS Code with Volar/TypeScript will use the generated `auto-imports.d.ts` for autocomplete. JetBrains IDEs may need the [unplugin-auto-import IDE helper](https://github.com/unplugin/unplugin-auto-import#ide-support).

4. **Tests** — If tests run outside Vite (e.g., Jest/Vitest directly), they won't have auto-imports. Options:
   - Use Vitest with the same Vite config (recommended)
   - Keep explicit imports in test files
   - Add a Jest transform that handles auto-imports

---

## Alternative approaches considered

### Global `window.*` assignments
Attach `S`, `U`, etc. to `window` at startup and use TypeScript's `declare global`.
**Rejected:** No tree-shaking, no type safety per-file, runtime cost, breaks SSR/web worker contexts.

### TypeScript `declare global` with side-effect imports
Import everything once in `entry.tsx` and declare types globally.
**Rejected:** Same tree-shaking problem as barrels. Still loads everything upfront.

### Keep barrels, break cycles manually
Restructure which modules live where to avoid circular chains.
**Rejected:** High effort for partial benefit. Doesn't solve the tree-shaking or DX problems.

### Direct imports everywhere (no auto-import plugin)
Replace `from 'Lib'` with `from 'Lib/translate'` etc. in every file.
**Rejected:** Achieves the same technical goals but adds 3-8 import lines per file instead of removing them. Worse DX.

---

## Rollback plan

The plugin is purely a build-time transform. To roll back:

1. Remove the plugin from `vite.config.ts`
2. Re-add explicit imports to any files that were migrated
3. Restore barrel files if deleted

Since Phase 0 verifies everything works **before** any file changes, the risk window only opens in Phase 1+.

---

## Estimated scope

| Phase | Files changed | Risk |
|---|---|---|
| Phase 0: Setup | 2 (`vite.config.ts`, `tsconfig.json`) | None — additive only |
| Phase 1: Lib barrel | ~250 (remove import line) | Low — mechanical removal |
| Phase 2: Component barrel | ~250 (remove import line) | Low — mechanical removal |
| Phase 3: Delete barrels | 2 barrel files deleted | Low — only after verification |
| Phase 4: Verify | 0 | None |

Total: ~500 files touched, but each change is a single line deletion. Ideal for a codemod.

---

## Open questions

1. **Component barrel scope** — Should all 80+ Component exports be auto-imported, or only the most common ones (Button, Icon, Input, Loader, etc.)?

2. **Extension files** — The `extension/` directory also imports from `'Lib'` and `'Component'`. Should it use the same auto-import config, or does it have its own Vite config?

3. **Storybook** — Does the Storybook config need the same auto-import plugin? (Likely yes, if stories use `S`, `I`, etc.)

4. **Test runner** — Which test runner is used? If Vitest with the shared Vite config, auto-imports work automatically. If Jest, additional setup is needed.
