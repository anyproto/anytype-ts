# Invite security warning on space open — design (JS-9795)

## Problem

On the `js-9795-invite-flow` branch, an owner whose space carries a **legacy dangerous invite**
— shared within the space (`heldByOwner: false`), anyone-can-join (`InviteType.WithoutApprove`),
granting **Writer/Admin** — is warned only *passively*: a banner on the Members page and a callout
in the Manage-invite-link popup. Both require the owner to navigate there. An at-risk owner who
never opens sharing settings never learns that any existing **viewer** can open that link to
upgrade themselves to editor.

We add a **proactive, one-time popup** shown when such an owner opens the space, pointing them at
review/reset.

The original Figma design had an on-open modal ("your invite links have been replaced"); the
`2026-07-14-invite-flow-design.md` spec cut it because the middleware never migrates or revokes
anything, so that copy would be false. This popup is different: it makes no false claim, it only
surfaces the *existing* passive warning proactively.

## Trigger condition

The popup shows when **all** of the following hold, evaluated for the space just opened:

1. **Owner** — `U.Space.isMyOwner(spaceId)`. (Only the owner can reset the link, and in the
   held-by-owner model only the owner can even see a shared invite's cid/key.)
2. **Not already dismissed for this space** — local per-space storage flag (see Persistence).
3. **Unsafe invite** — `U.Space.isInviteUnsafe(spaceId)`, i.e. the invite is shared
   (`!heldByOwner`), anyone-can-join (`WithoutApprove`), and grants Writer/Admin. (Admin-granting
   invites are not actually producible today, but `isInviteUnsafe` already covers both.)
4. **At least one active viewer** — an `Active` participant with `Reader` permission exists.
   Without a viewer there is no one to escalate, so no warning.

Conditions 1 and 3 already exist as helpers. Only condition 4 is new logic.

## New predicate — `lib/util/space.ts`

```ts
/**
 * Whether the owner should be proactively warned about this space's invite: the invite is unsafe
 * (shared, anyone-can-join, grants editor) AND at least one viewer exists who could use it to
 * self-upgrade to editor. Does not consult the local "dismissed" flag — the caller does that.
 */
hasInviteSecurityRisk (spaceId?: string): boolean {
    const id = spaceId || S.Common.space;

    if (!this.isMyOwner(id) || !this.isInviteUnsafe(id)) {
        return false;
    };

    return this.getParticipantsList([ I.ParticipantStatus.Active ]).some(it => it.isReader);
};
```

Dismissal is intentionally **not** part of this predicate — it is space-state, dismissal is local
UI state. The caller (`checkInviteSecurity`) combines them.

Unit-tested in `lib/util/space.test.ts` beside the existing `isInviteUnsafe` tests: owner vs
non-owner, unsafe vs safe invite, viewer present vs absent.

## Persistence — local, per-space

A new per-space storage key `inviteSecurityDismissed`, written with `isLocal = true` so it lives in
electron-local storage and does **not** sync across devices.

- Register `inviteSecurityDismissed` in the `SPACE_KEYS` set in `lib/storage.ts`, so
  `Storage.setSpaceKey` / `Storage.getSpaceKey` route it correctly.
- Read: `Storage.getSpaceKey('inviteSecurityDismissed', true, spaceId)`.
- Write: `Storage.setSpaceKey('inviteSecurityDismissed', true, true, spaceId)`.

Per-space (not global): dismissing for space A must still warn for space B if B is also at risk.

## Trigger wiring — non-blocking

New method `U.Space.checkInviteSecurity(spaceId)`, called from the **tail of
`U.Data.onSpaceSwitch`** (`lib/util/data.ts`). It is **fire-and-forget**: not awaited, not chained
into the routing callback, so the space-switch/routing flow is never blocked or delayed by it.

`checkInviteSecurity(spaceId)`:

1. Cheap synchronous guards, return immediately if any fails — no network:
   - `U.Space.isMyOwner(spaceId)` is false, or
   - `Storage.getSpaceKey('inviteSecurityDismissed', true, spaceId)` is truthy.
2. Refresh the invite into the store via `U.Space.getInvite(spaceId, callback)` (async gRPC —
   the only latency, and it is off the routing path). The invite is otherwise not loaded on space
   switch, so this fetch is required.
3. In the callback, evaluate `U.Space.hasInviteSecurityRisk(spaceId)`; if true, open the popup
   (see below). The async round-trip also gives the participant subscription time to populate, so
   the viewer check in step 2's callback sees real data.

`onSpaceSwitch` already establishes the space subscription (`U.Subscription.createSpace`) before the
call site, so participants are being loaded by the time the invite fetch returns.

## Popup — reuse the generic `confirm` popup

No new popup component. Same pattern already used for the share-within-space confirm in
`popup/invite/manage.tsx`:

```ts
S.Popup.open('confirm', {
    data: {
        iconParam: { name: 'popup/header/warning', color: 'grey' },
        title: translate('popupInviteSecurityTitle'),
        text: translate('popupInviteSecurityText'),
        textConfirm: translate('popupInviteSecurityConfirm'), // "Review link"
        textCancel: translate('popupInviteSecurityCancel'),   // "Dismiss"
        onConfirm: () => S.Popup.open('inviteManage', { data: { spaceId } }),
    },
});
```

**Dismissal is marked at show-time**, immediately before/at `S.Popup.open`, not inside the button
handlers. This way every close path — Review, Dismiss, the X, Esc — counts as "seen", giving true
once-only semantics with no gap. `onConfirm` then *additionally* opens the Manage-invite-link popup
so the owner can review or reset.

The Manage popup id is `inviteManage` (registered in `component/popup/index.tsx`); confirm during
implementation.

## Copy — `src/json/text.json`

New keys (source of truth; do not edit generated `dist/lib/json/lang/`):

- `popupInviteSecurityTitle` — e.g. "Review your invite link"
- `popupInviteSecurityText` — e.g. "This space has an open invite link that grants editor access
  without approval. Anyone with the link — including current viewers — can use it to become an
  editor. Review the link and reset it if you didn't intend this."
- `popupInviteSecurityConfirm` — "Review link"
- `popupInviteSecurityCancel` — "Dismiss"

Final wording to be tuned against existing invite copy (`popupInviteManageEditorUpgradeNote`,
`inviteUnsafeText`) during implementation.

## Analytics

One screen event when the popup is shown, `ScreenInviteSecurityWarning`, consistent with the
existing `ScreenInviteManage`. Emitted at show-time next to the dismissal write.

## Testing

- **Unit** (`lib/util/space.test.ts`): `hasInviteSecurityRisk` across owner × unsafe-invite ×
  viewer-present permutations, mirroring the existing `isInviteUnsafe` test setup.
- **Manual / QA**:
  - Owner opens a space with a shared, anyone-can-join, editor invite **and** at least one viewer
    → popup appears once.
  - Dismiss (or close via X/Esc) → reopening the space never shows it again.
  - Review link → Manage-invite-link popup opens; owner can reset.
  - A second at-risk space still warns independently.
  - Non-owner, safe invite, or no viewers → never shown.

## Out of scope

- No change to `isInviteUnsafe`, the Members-page banner, or the Manage-popup callout.
- No middleware changes.
- No global "never warn me again" toggle — dismissal is per-space by design.
