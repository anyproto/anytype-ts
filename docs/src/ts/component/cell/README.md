# cell/ - Data Cells for Dataviews and Tables

Inline editable cell components used in dataview grids and tables. **7 files**.

## Files

- `index.tsx` - Main cell dispatcher with relation-type handling
- `text.tsx` - Text, numbers, dates, URLs, emails, phones
- `select.tsx` - Single/multi-select options
- `checkbox.tsx` - Boolean toggle
- `object.tsx` - Object relation cells
- `file.tsx` - File relation cells
- `item/object.tsx` - Object-specific item renderer

## Behavior

- Cells integrate with the menu system for editing (opening select menus, date pickers, etc.)
- Cell state managed through jQuery DOM manipulation
- Uses `Relation` utilities for formatting and validation
- `forwardRef` + `useImperativeHandle` for imperative control from parent
