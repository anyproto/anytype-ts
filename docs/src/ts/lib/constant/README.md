# constant/ - Application Constants

Static configuration values used by specific features.

## Files

| File | Purpose |
|------|---------|
| `sparkOnboarding.ts` | Constants for the spark onboarding flow: graph visualization config (`MAX_NODES`, `NODE_RADIUS`), UI dimensions (`POPUP_WIDTH`, `POPUP_HEIGHT`), animation timings, validation rules, and network retry config |

The exported config objects are `GRAPH_CONFIG`, `UI_CONFIG`, `ANIMATION_CONFIG`, `VALIDATION_CONFIG`, and `NETWORK_CONFIG`.

Note: Most application-wide constants (delays, limits, colors, keyboard shortcuts) are defined in `src/json/` and imported directly via the `json` alias. This directory holds only feature-specific constant modules.
