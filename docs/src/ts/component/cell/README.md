# cell/ - Data Cells for Dataviews and Tables

Inline editable cell components used in dataview grids and tables. **8 files** (including 1 Storybook story).

## Files

- `index.tsx` - Main cell dispatcher. Routes to type-specific cell based on relation format. Handles edit mode, menu integration, click/keyboard interactions.
- `text.tsx` - Text, numbers, dates, URLs, emails, phones
- `select.tsx` - Single/multi-select tag options
- `checkbox.tsx` - Boolean toggle
- `object.tsx` - Object relation cells
- `file.tsx` - File relation cells
- `item/object.tsx` - Object-specific item renderer within cells
- `item/object.stories.tsx` - Storybook stories for object item (Default, TaskObject, CompletedTask, WithRemove, TypeRelation)

## Behavior

- Cells integrate with the menu system for editing (opening select menus, date pickers, etc.)
- Cell state managed through DOM manipulation via `U.Dom` helpers
- Uses `Relation` utilities for formatting and validation
- `forwardRef` + `useImperativeHandle` for imperative control from parent
- Cell ID generation via `Relation.cellId(idPrefix, relationKey, recordId)`
- MobX `observable` used for record data in the dispatcher
