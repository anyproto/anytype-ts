# form/ - Reusable Form Controls

Form input components used across auth flows, settings, and modals. **30 files** (15 components + 15 Storybook stories).

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
| `commentEditor.tsx` | Rich text comment editor built on Lexical |
| `drag/horizontal.tsx` | Horizontal drag slider |
| `drag/vertical.tsx` | Vertical drag slider |

## Storybook Stories

Each component (except `inputWithFile.tsx`) has a corresponding `.stories.tsx` file for Storybook documentation and visual testing.

## Comment Editor (`commentEditor.tsx`)

Full-featured rich text editor built on Lexical. Supports:
- Rich text formatting (bold, italic, strikethrough, code, underline)
- Lists (ordered, unordered, check)
- Headings, code blocks, block quotes, horizontal rules
- Mentions via `@` with object search
- Emoji picker
- File attachments and embed previews
- Paste handling with URL detection
- Max length enforcement
- Custom `MentionNode` and `HorizontalRuleNode` Lexical nodes

## Patterns

- `forwardRef` + `useImperativeHandle` for method access (`setValue`, `getValue`, `focus`, `setRange`)
- Input masking via `Inputmask` library
- State managed via refs for uncontrolled inputs
