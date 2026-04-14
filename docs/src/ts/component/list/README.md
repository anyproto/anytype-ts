# list/ - List and Table Rendering

Paginated list components for rendering collections of objects/records. **7 files**.

## Files

- `object.tsx` - Object list with columns, paging, sorting, and virtual scrolling via `react-virtualized`
- `objectManager.tsx` - Advanced object management list with filter, selection, compact mode, and action buttons
- `popup.tsx` - List used within popups
- `menu.tsx` - List used within menus
- `children.tsx` - Nested child item lists
- `notification.tsx` - Notification list
- `banner.tsx` - Banner list

## Key Patterns

### ListObject

Uses a column descriptor pattern with virtual scrolling:
```typescript
interface Column {
	relationKey: string;
	name: string;
	className?: string;
	width?: string;
	isObject?: boolean;
	isCell?: boolean;
	withDescription?: boolean;
	mapper?: (value: any) => any;
}
```

Data fetched via `U.Subscription.subscribe()` with filters, sorts, and pagination. Supports infinite scroll and traditional paging. Exposes `getData()` and `reload()` via imperative ref.

### ListObjectManager

More complex list with:
- Checkbox selection (`getSelected`, `setSelection`, `setSelectedRange`, `selectionClear`)
- Filter bar (`onFilterShow`)
- Action buttons bar (forwarded as `buttons` prop)
- `CellMeasurerCache` for dynamic row heights
- Compact mode via `isCompact` prop
