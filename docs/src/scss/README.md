# scss/ - Stylesheets

SCSS stylesheets organized to mirror the component structure. Uses native CSS nesting.

## Top-Level Files

| File | Purpose |
|------|---------|
| `_mixins.scss` | Shared SCSS mixins |
| `_vars.scss` | CSS custom properties and theme variables |
| `color.scss` | Color palette definitions |
| `common.scss` | Global styles (typography, layout, animations) |
| `debug.scss` | Debug/dev overlay styles |
| `font.scss` | Font-face declarations |

## Component Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `block/` | `common.scss`, `text.scss`, `media.scss`, `file.scss`, `bookmark.scss`, `cover.scss`, `dataview.scss`, `dataview/` (filters, view), `chat.scss`, `chat/` (message, form, attachment), `div.scss`, `embed.scss`, `featured.scss`, `iconPage.scss`, `iconUser.scss`, `latex.scss`, `layout.scss`, `link.scss`, `markup.scss`, `relation.scss`, `table.scss`, `tableOfContents.scss` | Block type styles |
| `component/` | `common.scss`, `header.scss`, `footer.scss`, `icon.scss`, `iconObject.scss`, `editor/` (bookmark, controls, help), `sidebar/` (common, page, preview, progress), `preview/` (common, link, object, tab), `media/` (audio, common, video), `cell.scss`, `comment.scss`, `cover.scss`, `selection.scss`, `toast.scss`, `tooltip.scss`, `loader.scss`, `pager.scss`, `tag.scss`, `title.scss`, `sync.scss`, `share.scss`, `qr.scss`, `banner.scss`, `chatCounter.scss`, `calendarSelect.scss`, `deleted.scss`, `dotIndicator.scss`, `dragbox.scss`, `dragLayer.scss`, `emptySearch.scss`, `emptyState.scss`, `error.scss`, `errorBoundary.scss`, `floater.scss`, `frame.scss`, `headSimple.scss`, `hightlight.scss`, `layoutPlug.scss`, `optionSelect.scss`, `progressBar.scss`, `progressText.scss`, `stickyScrollbar.scss`, `updateBanner.scss`, `upsell.scss` | Misc component styles |
| `form/` | `common.scss`, `button.scss`, `input.scss`, `select.scss`, `switch.scss`, `textarea.scss`, `editable.scss`, `filter.scss`, `inputWithFile.scss`, `inputWithLabel.scss`, `phrase.scss`, `pin.scss`, `tabSwitch.scss`, `drag/` (horizontal, vertical) | Form control styles |
| `list/` | `common.scss`, `object.scss`, `objectManager.scss` | List styles |
| `menu/` | `common.scss`, `block/` (add, context, cover, emoji, latex, link, linkSettings, mention, relation), `chat/` (create, text), `comment/` (toolbar), `dataview/` (common, create, file, filter, group, object, option, relation, sort, source, template, text, view), `preview/` (object), `search/` (chat, object, text), `button.scss`, `calendar.scss`, `changeOwner.scss`, `graph.scss`, `help.scss`, `icon.scss`, `identity.scss`, `object.scss`, `onboarding.scss`, `oneToOne.scss`, `participant.scss`, `publish.scss`, `relation.scss`, `select.scss`, `smile.scss`, `syncStatus.scss`, `tableOfContents.scss`, `type.scss`, `widget.scss` | Menu component styles |
| `notification/` | `common.scss` | Notification styles |
| `page/` | `common.scss`, `auth.scss`, `main/` (archive, chat, date, edit, empty, graph, history, import, invite, media, membership, navigation, relation, set, settings, void) | Page-level styles |
| `popup/` | `common.scss`, `about.scss`, `aiOnboarding.scss`, `apiCreate.scss`, `confirm.scss`, `export.scss`, `help.scss`, `introduceChats.scss`, `invite.scss`, `logout.scss`, `membership.scss`, `objectManager.scss`, `onboarding.scss`, `page.scss`, `phrase.scss`, `pin.scss`, `preview.scss`, `prompt.scss`, `relation.scss`, `search.scss`, `settings.scss`, `share.scss`, `shortcut.scss`, `spaceCreate.scss`, `upload.scss`, `usecase.scss` | Popup modal styles |
| `widget/` | `common.scss`, `object.scss`, `space.scss`, `tree.scss`, `view/` (common, board, calendar, gallery, graph, list) | Widget styles |
| `media/` | `print.scss` | Print media query styles |
| `theme/` | `dark/` (`common.scss`, `block.scss`, `menu.scss`, `page.scss`, `popup.scss`) | Dark mode theme overrides |

## Conventions

- CSS supports native nesting (no need for SCSS `&` in most cases)
- Do NOT use `cursor: pointer` -- the app does not use custom cursors
- Theme colors via CSS custom properties (`var(--color-bg-primary)`, etc.)
- Never combine a selector's own properties and nested children in the same block
- Use tabs for indentation
