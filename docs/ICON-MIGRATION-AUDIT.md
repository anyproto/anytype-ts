# Icon Migration Audit

The Icon component auto-generates a className from the `name` prop:
`common/ghost` → `commonGhost`, `notification/hide` → `notificationHide`, etc.

The problem: many classNames were removed during migration because they seemed redundant with `name`. But SCSS references the **old short className**, not the auto-generated camelCase one. So the CSS rules no longer match.

---

## 1. Removed classNames — SCSS Still References Them

Each entry: SCSS expects `.icon.X`, auto-generated class is `Y`, so the CSS rule is dead.

### `.icon.ghost` — 5 SCSS references

SCSS: `src/scss/component/deleted.scss`, `block/link.scss`, `block/bookmark.scss`, `block/media.scss`, `block/relation.scss`
(sets width/height: 24px or 64px)

Auto-generated: `commonGhost` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/util/deleted.tsx` | 68 |
| `src/ts/component/block/link.tsx` | 132 |
| `src/ts/component/block/relation.tsx` | 105 |
| `src/ts/component/block/bookmark.tsx` | 108 |
| `src/ts/component/block/media/file.tsx` | 48 |

**Fix:** Add `className="ghost"` to each `<Icon name="common/ghost" />`

---

### `.icon.back` — 2 SCSS references

SCSS: `src/scss/popup/usecase.scss:121` (width/height 8px), `src/scss/component/sidebar/page/common.scss:39` (background-size 20px)

Auto-generated: `commonBack` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/popup/page/usecase/item.tsx` | 125 |
| `src/ts/component/sidebar/page/settings/index.tsx` | 306 |
| `src/ts/component/sidebar/page/settings/library.tsx` | 477 |
| `src/ts/component/sidebar/page/widget.tsx` | 589 |

**Fix:** Add `className="back"` to each `<Icon name="common/back" />`

---

### `.icon.badge` — 3 SCSS references

SCSS: `src/scss/page/main/settings.scss:593`, `src/scss/component/comment.scss:54`, `src/scss/menu/changeOwner.scss:21`
(width/height 14px)

Auto-generated: `membershipBadge` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/page/main/settings/account.tsx` | 87 |
| `src/ts/component/util/object/name.tsx` | 89 |
| `src/ts/component/header/main/settings.tsx` | 64 |

**Fix:** Add `className="badge"` to each `<Icon name="membership/badge" />`

---

### `.icon.hide` — 1 SCSS reference

SCSS: `src/scss/notification/common.scss:13` (background-size 12px 8px)

Auto-generated: `notificationHide` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/list/notification.tsx` | 105 |

**Fix:** Add `className="hide"` to `<Icon name="notification/hide" />`

---

### `.icon.clear` in notification head — 1 SCSS reference

SCSS: `src/scss/notification/common.scss:14` (background-size 10px, inside `.head`)

The old code was `<Icon className="clear" />`, now it's `<Icon name="notification/delete" />` which auto-generates `notificationDelete` — **does not match** `.icon.clear`

| File | Line |
|------|------|
| `src/ts/component/list/notification.tsx` | 106 |

**Fix:** Add `className="clear"` to `<Icon name="notification/delete" />`, OR rename the SCSS selector to `.icon.notificationDelete`

---

### `.icon.mention` — 1 SCSS reference

SCSS: `src/scss/page/main/date.scss:28` (width 20px, height 20px, margin)

Auto-generated: `commonMention` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/comment/form.tsx` | 708 |

**Fix:** Check if this is actually the Icon in the date page context. If so, add `className="mention"`.

---

### `.icon.search` — 1 SCSS reference

SCSS: `src/scss/menu/search/text.scss:23` (margin 0)

Auto-generated: `commonSearch` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/menu/search/text.tsx` | 368 |

**Fix:** Add `className="search"` to `<Icon name="common/search" />`

---

### `.icon.info` — 1 SCSS reference

SCSS: `src/scss/menu/publish.scss:10` (width/height 20px)

Auto-generated: `commonInfo` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/menu/publish.tsx` | 192 |

**Fix:** Add `className="info"` to `<Icon name="common/info" />`

---

### `.icon.settings` — 1 SCSS reference

SCSS: `src/scss/component/header.scss:133` (`display: none` in auth header)

Auto-generated: `headerSettings` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/header/auth/index.tsx` | 55 |

**Fix:** Add `className="settings"` to `<Icon name="header/settings" />`

---

### `.icon.success` — 1 SCSS reference

SCSS: `src/scss/popup/aiOnboarding.scss:516`

Auto-generated: `popupHeaderSuccess` — **does not match**

| File | Line |
|------|------|
| `src/ts/component/popup/aiOnboarding.tsx` | 502 |

**Fix:** Add `className="success"` to `<Icon name="popup/header/success" />`

---

## 2. Menu Items Using `icon` String Instead of `iconParam` Object

`MenuItemVertical` renders icons from `iconParam: { name: '...' }`. The old `icon` string field is not used for rendering in that component. Items using `icon: 'string'` will have no icon rendered.

### `src/ts/component/menu/chat/text.tsx` (Lines 13-18)

```
icon: 'menu/mark/bold'  →  should be  iconParam: { name: 'menu/mark/bold' }
```
6 toolbar buttons affected (bold, italic, strike, underline, link, code).

### `src/ts/component/menu/comment/toolbar.tsx` (Lines 14-17, 105-107)

7 toolbar actions. Same pattern — `icon:` string should be `iconParam: { name: }`.

### `src/ts/component/menu/block/add.tsx` (Line 760)

```
item.icon = 'color'  →  should be  item.iconParam = { name: 'color' }
```

### `src/ts/component/menu/dataview/group/edit.tsx` (Line 113)

```
action.icon = 'color'  →  should be  action.iconParam = { name: 'color' }
```

### `src/ts/component/menu/dataview/view/layout.tsx` (Line 456)

```
it.icon = viewIconMap[it.id]  →  should be  it.iconParam = { name: viewIconMap[it.id] }
```

### `src/ts/component/menu/widget.tsx` (Line 368)

```
param.data.icon = 'screenshot'  →  verify how popup consumes this
```

---

## Summary

| Issue | Count | Impact |
|-------|-------|--------|
| Removed className, SCSS still references it | ~20 Icons across 11 CSS selectors | Sizing, positioning, visibility broken |
| Menu items with `icon` string instead of `iconParam` | ~20 items across 6 files | Icons not rendering |
