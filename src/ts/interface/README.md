# interface/ - TypeScript Interfaces and Enums

Type definitions for the entire application. Accessed via `I.*` import alias.

## Files

| File | Defines |
|------|---------|
| `common.ts` | Core enums: BlockType, ObjectLayout, SortType, FilterCondition, TextStyle, etc. |
| `menu.ts` | MenuParam, Menu, MenuRef, MenuItem interfaces |
| `popup.ts` | Popup, PopupParam interfaces |
| `object.ts` | Object-related interfaces |
| `account.ts` | Account interfaces |
| `space.ts` | SpaceStatus, SpaceType, ParticipantPermissions, WidgetSection enums |
| `membership.ts` | Membership tier definitions |
| `notification.ts` | NotificationType enum and interfaces |
| `restriction.ts` | Restriction interfaces |
| `sidebar.ts` | Sidebar state interfaces |
| `preview.ts` | Preview component interfaces |
| `history.ts` | Version history interfaces |
| `progress.ts` | Progress tracking interfaces |
| `publish.ts` | Publishing interfaces |
| `syncStatus.ts` | Sync status interfaces |
| `animation.ts` | Animation interfaces |
| `sparkOnboarding.ts` | Onboarding flow interfaces |

## Block Interfaces (`block/`)

Per-block-type interfaces with content types and enums:
- `index.ts` - Block, BlockComponent, BlockRef base interfaces
- `text.ts` - TextStyle, MarkType, ContentText
- `file.ts` - FileType, FileState, FileStyle, ContentFile
- `link.ts` - LinkCardStyle, LinkIconSize, ContentLink
- `embed.ts` - EmbedProcessor enum
- `dataview.ts` - ViewType, FilterCondition, ContentDataview
- `widget.ts` - WidgetLayout, WidgetSection, WidgetComponent
- And more (div, layout, relation, bookmark, table)
