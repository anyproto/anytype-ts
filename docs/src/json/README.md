# json/ - JSON Data and Constants

Static data and configuration used by the frontend. All modules are re-exported from `index.ts`.

## Files

| File | Export | Purpose |
|------|--------|---------|
| `text.json` | (loaded separately) | All UI translation strings (i18n). Used by `translate()` function |
| `constant.ts` | `Constant` | Application constants: API keys, delays, limits, protocol, network IDs, color palettes, namespace config |
| `error.ts` | `Error` | gRPC error code mappings (account, import, payment errors) |
| `extension.ts` | `Extension` | Web Clipper extension config (Chrome extension IDs, name, emoji URL) |
| `key.ts` | `Key` | Keyboard key code mappings (keyCode values for shortcuts) |
| `lang.ts` | `Lang` | Language config: enabled UI locales (26 languages), spelling language map, interface-to-spelling mappings |
| `menu.ts` | `Menu` | Menu sub-ID configurations |
| `relation.ts` | `Relation` | Default relation key lists |
| `route.ts` | `Route` | URL route patterns for the app router |
| `shortcut.ts` | `Shortcut` | Keyboard shortcut definitions for help display |
| `size.ts` | `Size` | UI size constants: editor width, sidebar min/max/default, header height, history panel |
| `theme.ts` | `Theme` | Theme definitions |
| `url.ts` | `Url` | External URLs: community, tutorial, download, pricing, contact, CDN, gallery, web clipper |
| `emoji.json` | `Emoji` | Emoji dataset |
| `icon.json` | `Icon` | Icon metadata |
| `latex.json` | `Latex` | LaTeX symbol definitions |
