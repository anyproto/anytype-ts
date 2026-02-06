# list/ - List and Table Rendering

Paginated list components for rendering collections of objects/records. **7 files**.

## Files

- `object.tsx` - Object list with columns, paging, and sorting via subscriptions
- `popup.tsx` - List used within popups
- `menu.tsx` - List used within menus
- `children.tsx` - Nested child item lists
- `notification.tsx` - Notification list
- `banner.tsx` - Banner list
- `objectManager.tsx` - Advanced object management list

## Key Pattern

`ListObject` uses a column descriptor pattern:
```typescript
interface Column {
    relationKey: string;
    name: string;
    isCell?: boolean;
    mapper?: (value: any) => any;
}
```

Data is fetched via `U.Subscription.subscribe()` with filters, sorts, and pagination.
