# model/ - Data Model Classes

MobX-observable model classes that represent the core data structures.

## Block Model

- `block.ts` — Main Block class with type-checking methods (`isText()`, `isLayout()`, `isFile()`, etc.) and capability methods (`canHaveChildren()`, `canTurn()`, `canHaveMarks()`)
- `block.test.ts` — Tests for Block model
- `blockStructure.ts` — Block tree structure

## Content Models (`content/`)

Type-specific block content classes, instantiated by Block constructor based on `block.type`:

| File | Content Type |
|------|-------------|
| `text.ts` | Text content: style, marks, text, checked state |
| `file.ts` | File content: targetObjectId, type, style, state |
| `dataview.ts` | Dataview content: sources, views, relations, groups |
| `link.ts` | Link content: targetBlockId, card style, icon size |
| `embed.ts` | Embed content: processor type, text |
| `layout.ts` | Layout content: style (row/column/div/header) |
| `relation.ts` | Relation content: key |
| `div.ts` | Divider content: style (line/dot) |
| `bookmark.ts` | Bookmark content: URL, title, description |
| `widget.ts` | Widget content: layout, limit, viewId, section |
| `table.ts` | Table row content: isHeader flag |

## Other Models

| File | Purpose |
|------|---------|
| `account.ts` | User account data |
| `view.ts` | Dataview view configuration |
| `view.test.ts` | Tests for View model |
| `viewRelation.ts` | View relation settings |
| `filter.ts` | Dataview filter |
| `filter.test.ts` | Tests for Filter model |
| `sort.ts` | Dataview sort |
| `sort.test.ts` | Tests for Sort model |
| `chatMessage.ts` | Chat message model |
| `commentMessage.ts` | Comment message model (text, style, marks, parts) |
| `notification.ts` | Notification model |
| `membershipData.ts` | Membership data |
| `membershipProduct.ts` | Membership product |

## Exported Models (via `index.ts`)

`Account`, `Block`, `BlockStructure`, `Notification`, `ChatMessage`, `CommentMessage`, `View`, `ViewRelation`, `Filter`, `Sort`, `MembershipData`, `MembershipProduct`.

All models use `makeObservable` for MobX reactivity.
