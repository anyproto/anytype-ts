# hook/ - Custom React Hooks

Custom hooks directory. Accessed via the `H` import alias. Contains **2 hooks**.

## Hooks

- `useScrollRestore.ts` - Restores scroll position across navigation, anchored to a stable element
- `useParticipantCandidates.ts` - People the account already shares a space with: subscribes cross-space, deduplicates by identity, sorts by shared-space count, filters by search. Used by the space-create member picker and the Add Members popup
