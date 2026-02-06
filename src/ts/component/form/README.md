# form/ - Reusable Form Controls

Form input components used across auth flows, settings, and modals. **15 files**.

## Components

| File | Description |
|------|-------------|
| `input.tsx` | Rich text input with mask support, validation, focus/range control |
| `textarea.tsx` | Multi-line text input |
| `button.tsx` | Interactive button with loading/disabled states |
| `checkbox.tsx` | Checkbox toggle |
| `switch.tsx` | Toggle switch |
| `tabSwitch.tsx` | Tab-style toggle |
| `select.tsx` | Dropdown selection (opens menu) |
| `filter.tsx` | Filter input for menus |
| `pin.tsx` | PIN code entry (multiple digit inputs) |
| `editable.tsx` | Inline contentEditable text |
| `inputWithLabel.tsx` | Input with label wrapper |
| `inputWithFile.tsx` | Input with file picker |
| `phrase.tsx` | Mnemonic recovery phrase display |
| `drag/horizontal.tsx` | Horizontal drag slider |
| `drag/vertical.tsx` | Vertical drag slider |

## Patterns

- `forwardRef` + `useImperativeHandle` for method access (`setValue`, `getValue`, `focus`, `setRange`)
- Input masking via `Inputmask` library
- State managed via refs for uncontrolled inputs
