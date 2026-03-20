# model/ - Data Model Classes

MobX-observable model classes that represent the core data structures.

## Block Model

- `block.ts` - Main Block class with type-checking methods (`isText()`, `isLayout()`, `isFile()`, etc.) and capability methods (`canHaveChildren()`, `canTurn()`, `canHaveMarks()`)
- `blockStructure.ts` - Block tree structure

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

- `account.ts` - User account data
- `view.ts` - Dataview view configuration
- `viewRelation.ts` - View relation settings
- `filter.ts` - Dataview filter
- `sort.ts` - Dataview sort
- `chatMessage.ts` - Chat message model
- `notification.ts` - Notification model
- `membershipData.ts`, `membershipProduct.ts` - Membership data

All models use `makeObservable` for MobX reactivity.
