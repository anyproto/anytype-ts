# store/ - MobX State Management

Reactive state stores using MobX. Each store manages a specific domain. Accessed via `S.*` import alias.

## Stores

| File | Alias | Purpose |
|------|-------|---------|
| `common.ts` | `S.Common` | Global app state: space, theme, language, config, sidebar states, date format |
| `auth.ts` | `S.Auth` | Authentication: account, wallet phrase, membership, PIN |
| `block.ts` | `S.Block` | Document block trees: block CRUD, tree traversal, children management |
| `detail.ts` | `S.Detail` | Object details/properties: get/set details, relations, layout info |
| `record.ts` | `S.Record` | Dataview records: views, sorts, filters, groups, types, relations |
| `menu.ts` | `S.Menu` | Menu state: open/close/update menus, sub-menu management |
| `popup.ts` | `S.Popup` | Popup state: open/close/update popups, dimmer control |
| `chat.ts` | `S.Chat` | Chat messages: message CRUD, reactions, threads, counters |
| `notification.ts` | `S.Notification` | Notification management |
| `progress.ts` | `S.Progress` | Background task progress tracking |
| `membership.ts` | `S.Membership` | Membership tier and features |
| `extension.ts` | `S.Extension` | Browser extension state |
| `sparkOnboarding.ts` | `S.SparkOnboarding` | Onboarding progress tracking |

## Pattern

All stores use `makeObservable` with `observable`, `action`, and `computed` decorators:

```typescript
class SomeStore {
    constructor() {
        makeObservable(this, {
            data: observable,
            list: computed,
            set: action,
        });
    }
}
```

Components wrapped with `observer()` automatically re-render when observed store data changes.
