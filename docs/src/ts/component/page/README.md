# page/ - Page-Level Components

Full-page components mapped via URL routing. Contains **77 files** across 4 subdirectories.

## Routing

`index.tsx` is the master router. It maps URL paths to components via a static registry:
```
/auth/select  -> PageAuthSelect
/main/edit    -> PageMainEdit
/main/set     -> PageMainSet
...
```

Navigation uses `U.Router.go(path, options)`. Authentication guards redirect unauthenticated users.

## Auth Pages (`auth/`)

| Page | Purpose |
|------|---------|
| `select.tsx` | Login/signup selection screen |
| `login.tsx` | Seed phrase recovery form |
| `setup.tsx` | Account initialization after recovery |
| `pinCheck.tsx` | PIN verification |
| `onboard.tsx` | Post-registration onboarding |
| `deleted.tsx` | Deleted/pending account display |
| `migrate.tsx` | Account migration handler |

## Main Pages (`main/`)

| Page | Purpose |
|------|---------|
| `edit.tsx` | Standard document editor |
| `object.tsx` | Smart router by object layout type |
| `set.tsx` | Database/collection view with dataview |
| `media.tsx` | Image/video/audio file viewer |
| `graph.tsx` | Global knowledge graph (PixiJS WebGL) |
| `navigation.tsx` | Link navigation view with `navigation/item.tsx` |
| `chat.tsx` | Multi-chat interface |
| `oneToOne.tsx` | One-to-one chat interface |
| `date.tsx` | Date-filtered object view |
| `relation.tsx` | Relation property editor |
| `history.tsx` | Version history with `history/left.tsx`, `history/right.tsx` |
| `archive.tsx` | Trash/deleted objects |
| `archiveListTree.tsx` | Archive tree list view |
| `archiveSuggested.tsx` | Bin "Suggestions" tab, from `ObjectCleanupSuggestions`; orphans grouped by source object; `Delete permanently` + bulk `ObjectCleanupSuggestionIgnore`. Reports its count to `archive.tsx` for the tab badge |
| `invite.tsx` | Space invitation handler |
| `import.tsx` | Import handler |
| `membership.tsx` | Membership page |
| `aiConnect.tsx` | Fallback for `/ai/connect?app=<id>` reached as a route: replaces its own entry with the targeted AI apps page. Links themselves never become routes (`lib/aiConnect/link.ts`) |
| `blank.tsx` | Blank page |
| `void.tsx` | Void/empty page |

## Settings Pages (`main/settings/`)

Hierarchical settings with `index.tsx` dispatcher:
- **Account**: `account.tsx`, `delete.tsx`, `personal.tsx`, `phrase.tsx`, `language.tsx`, `api.tsx` (a key a connection uses gets `apiKeyAiAppsLink.tsx`, "Created by AI apps" → that connection's Manage; `apiAgentPrompt.tsx`: "Copy prompt" with the skill URL `J.Url.agentSkill` and the live port, disabled while the Local API is off)
- **AI apps**: `aiApps.tsx` (container: load, check, row actions) over the props-driven `aiAppsList.tsx`. `Action.openAiApps(target, route)` opens it with a one-shot `app` / `connection` / `route` in the route; a `GalleryVisit` (`lib/aiConnect/entry.ts`) takes it off the history entry on arrival (`U.Router.replaceCurrent`) and opens the popup once the list is loaded (a record after the opening check; an absent app shows its row)
- **PIN**: `pin/index.tsx` -> `pin/select.tsx` -> `pin/confirm.tsx`
- **Import**: `import/index.tsx` -> `import/notion.tsx` (with `notion/help.tsx`, `notion/warning.tsx`), `import/csv.tsx`, `import/obsidian.tsx`; `import/aiSettings.tsx` - AI structure enrichment settings section rendered on the index page: one merged provider dropdown (local providers shielded, cloud, custom), a model dropdown populated by `AIListModels` with recommended entries pinned on top, and the data disclosure
- **Export**: `export/index.tsx` -> `export/protobuf.tsx` (Any-Block v1), `export/markdown.tsx`, `export/anyBlockV2.tsx` (Any-Block v2, preview)
- **Space**: `space/index.tsx` -> `space/home.tsx`, `space/list.tsx`, `space/storage.tsx`, `space/notifications.tsx`, `space/share.tsx` (with `share/members.tsx`)
- **Data**: `data/index.tsx` -> `data/publish.tsx`
- **Membership**: `membership/index.tsx` -> `membership/loader.tsx`, `membership/intro.tsx`, `membership/purchased.tsx`

## Page Elements (`elements/`)

Reusable page sub-components:
- `children.tsx` - Renders child blocks of a page
- `tableOfContents.tsx` - In-page table of contents
- `head/editor.tsx` - Document header with icon, cover, title
- `head/simple.tsx` - Minimal header for specialized layouts
- `head/controls.tsx` - Editor toolbar controls
- `head/controlButtons.tsx` - Individual control buttons for editor toolbar
