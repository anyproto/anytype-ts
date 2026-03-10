# page/ - Page-Level Components

Full-page components mapped via URL routing. Contains **65 files** across 4 subdirectories.

## Routing

`index.tsx` is the master router. It maps URL paths to components via a static registry:
```
/auth/select  → PageAuthSelect
/main/edit    → PageMainEdit
/main/set     → PageMainSet
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
| `navigation.tsx` | 3-panel link navigation view |
| `chat.tsx` | Multi-chat interface |
| `date.tsx` | Date-filtered object view |
| `relation.tsx` | Relation property editor |
| `history/` | Version history with diff |
| `archive.tsx` | Trash/deleted objects |
| `invite.tsx` | Space invitation handler |

## Settings Pages (`main/settings/`)

Hierarchical settings with `index.tsx` dispatcher:
- **Account**: account, delete, personal, phrase, language, api
- **PIN**: pinIndex → pinSelect → pinConfirm
- **Import**: importIndex → importNotion, importCsv, importObsidian
- **Export**: exportIndex → exportProtobuf, exportMarkdown
- **Space**: spaceIndex → spaceList, spaceStorage, spaceShare (members)
- **Data**: dataIndex → dataPublish
- **Membership**: membershipIndex → membershipLoader, membershipIntro

## Page Elements (`elements/`)

Reusable page header components:
- `head/editor.tsx` - Document header with icon, cover, title
- `head/simple.tsx` - Minimal header for specialized layouts
- `head/controls.tsx` - Editor toolbar controls
