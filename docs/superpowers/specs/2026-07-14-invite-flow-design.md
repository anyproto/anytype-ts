# Invite flow redesign — design

- **Linear**: JS-9795, DSGN-1935
- **Figma**: [Settings — Membership, section "Space Settings - Invite Members"](https://www.figma.com/design/I1MQkpHI1b4ftImOS9OaFA/-D--Settings---Membership?node-id=13135-49108)
- **Middleware**: GO-7222, branch `go-7222-invite-cleanup`, integration guide `anytype-heart/docs/InviteSharing.md`

## Why

Until GO-7222, generating an invite wrote its cid **and file key** into the workspace object, which every
member syncs. Anyone holding both can join the space, so every member could hand the space out to anyone —
and if the invite was *anyone can join* with Writer permissions, they could hand out editor access without
approval.

After GO-7222 the invite is **held by the owner** by default: cid and key go to the owner's spaceView in
their tech space, which only the owner's devices sync. The workspace gets a boolean marker. Members learn
an invite exists and that the owner is the one to ask.

This spec covers the client side: the new RPC surface, a request-to-join default, and the redesigned
Members page.

**Where the integration guide and the Figma design disagree, the guide wins.** Two known divergences:

1. The design has a modal — *"Your invite links have been updated. For security reasons, all existing
   invite links have been replaced."* The middleware does **not** migrate or revoke anything; legacy
   invites keep working. **We do not build that modal.** Instead the owner of a space whose invite is the
   dangerous combination (shared + anyone-can-join + Writer) is told that the link lets any member —
   including a viewer — get editor access, and is offered revoke + re-create.
2. The design has no share-within-space control. The guide specifies one. **We add it**, in the
   Manage-invite-link popup.

## Decisions

| | |
|---|---|
| Default invite type | `WithApprove` (request to join) at **every** generate call site |
| Default permissions for an anyone-can-join invite | `Reader`. Turning auto-approval on never produces an editor link by itself |
| Default `shareWithinSpace` | `false` (owner-held) |
| Who may create / revoke an invite | **Owner only.** Not admins — "for now" |
| Who may add members directly / approve requests | Owner and admin (unchanged) |
| Legacy warning trigger | invite is shared (`heldByOwner: false`) **and** `WithoutApprove` **and** permissions ≥ Writer |
| Legacy warning placement | banner on the Members page **and** callout in the Manage-invite-link popup |
| Un-sharing | not offered — middleware refuses it (`INVITE_ALREADY_SHARED`). Offer Reset link |
| Revoke / Reset link | keep today's "Disable invite link" confirm |
| Scope | full Members page redesign (tabs, search, Add members) + General page action row |

## Middleware dependency

The generated pb in this repo comes from a middleware release (`middleware.version` = 0.50.15) and has
none of the new fields. GO-7222 is unmerged.

**We regenerate `middleware/pb` from the local `../anytype-heart_invite-cleanup` worktree** to develop
against, and re-run `update.sh` against a real release before merge. Nothing may land on `develop` until
`middleware.version` names a release that carries GO-7222.

New surface, from `pb/protos/commands.proto`:

- `Rpc.Space.InviteGenerate.Request.shareWithinSpace` (bool, field 4)
- `Rpc.Space.InviteGetCurrent.Response.heldByOwner` (bool, field 6)
- `Rpc.Space.InviteGenerate.Response.Error.Code.INVITE_ALREADY_SHARED = 106`
- `Rpc.Space.InviteGenerate.Response.Error.Code.INVITE_NOT_SHAREABLE = 107`
- `Rpc.Space.InviteChange` returns `107` when the current invite is shared and the requested permissions
  are above Reader

## Semantics the client must respect

`InviteGetCurrent` answers differently depending on who asks:

| who | invite | response |
|---|---|---|
| owner | owner-held | cid + key + type + permissions, `heldByOwner: true` |
| owner | shared within the space | cid + key + type + permissions, `heldByOwner: false` |
| **member** | **owner-held** | **success, empty cid + key, empty type, `heldByOwner: true`** |
| member | shared within the space | cid + key + type + permissions, `heldByOwner: false` |
| anyone | no invite | `NO_ACTIVE_INVITE` |

A member with an owner-held invite gets a **success** response with an empty cid. **Check `heldByOwner`
before you check `cid`, and never render an empty link.**

What may be shared within the space (enforced on generate, on publish, and on raising permissions):

| invite type | permissions | shareable |
|---|---|---|
| `WithApprove` (request to join) | any | yes — a join still needs approval |
| `WithoutApprove` (anyone can join) | Reader | yes |
| `WithoutApprove` (anyone can join) | Writer and above | **no** → `INVITE_NOT_SHAREABLE` |

Publishing a page with `joinSpace: true` embeds the invite only when it is safe to make public; a
no-approval writer link is silently skipped, middleware-side. No client change needed.

## Data layer

### Commands (`src/ts/lib/api/`)

- `command.ts` — `SpaceInviteGenerate(spaceId, inviteType, permissions, shareWithinSpace, callBack)`. New
  fourth argument; all four existing call sites updated.
- `response.ts` — `SpaceInviteGetCurrent` gains `heldByOwner`. `SpaceInviteGenerate` currently **drops**
  `inviteType` and `permissions` even though the pb response carries them; start returning them, so the
  Manage-link popup can re-render from the generate response without a refetch.
- `src/json/text.json` — `errorSpaceInviteGenerate106`, `errorSpaceInviteGenerate107`,
  `errorSpaceInviteChange107`.

### Invite state (`S.Common`)

Today the invite is refetched into component-local `useState` in five places (`settings/space/share.tsx`,
`settings/space/index.tsx`, `header/main/settings.tsx`, `U.Menu.spaceContext`, `U.Object.getInviteLink`),
each holding its own `{ cid, key }`. The new UI needs `inviteType`, `permissions` and `heldByOwner` in
three of them, and the Manage-link popup mutates state the Members page must re-render from.

Add an observable invite map to `S.Common`, keyed by spaceId:

```ts
type Invite = {
    cid: string;
    key: string;
    inviteType: I.InviteType;
    permissions: I.ParticipantPermissions;
    heldByOwner: boolean;
};
```

- `U.Space.getInvite(spaceId, callBack)` writes through to the store and keeps its current callback
  signature, so existing callers do not change.
- `S.Common.inviteSet(spaceId, invite)` / `inviteGet(spaceId)` / `inviteClear(spaceId)`.
- Revoke clears the entry; generate and change update it.

The popup and the page then read one source and cannot drift.

### Derived predicates (`U.Space`)

- `canManageInvite(spaceId?)` → `isMyOwner(spaceId)`. **Replaces `canMyParticipantModerate()` as the
  gate on the invite section** — admins lose invite rights.
- `hasVisibleInvite(spaceId?)` → invite exists and (`!heldByOwner || isMyOwner`). Gates every Copy
  link / QR affordance.
- `isInviteUnsafe(spaceId?)` → `!heldByOwner && (inviteType == WithoutApprove) && (permissions >= Writer)`.
  The legacy-warning trigger.

## UI

### A. Members page — `component/page/main/settings/space/share.tsx`

Rewritten. Header row: title `Members`, a search toggle, and an `Add members` button (owner and admin).

**Invite section — owner only** (`U.Space.canManageInvite()`):

- Row `Add members via link` with a caption and a `Switch`.
  - **On** → an invite exists. **Off** → none.
  - Turning **on**: `SpaceMakeShareable` (keeping today's shared-spaces-limit confirm and the
    `ScreenHitShareSpaceLimit` analytics) → `SpaceInviteGenerate(WithApprove, Reader, false)`.
  - Turning **off**: today's `popupConfirmRevokeLink*` confirm → `SpaceInviteRevoke`.
  - Caption, derived from state:
    - request to join → *"Admins must approve join requests. Only you can see this link."*
    - auto-approval → *"Anyone with the link can view / edit. Only you can see this link."*
    - shared within the space → *"… Everyone in the space can see and share this link."*
- When on: `Copy link`, `Show QR code` (existing `inviteQr` popup), `Manage link` (new popup).
- **Legacy warning banner** when `U.Space.isInviteUnsafe()`: the link grants editor access without
  approval and every member can already see it, so any viewer can use it to become an editor. Action:
  `Reset link`.

**Tabs**: `All (n)` / `Requests (n)` / `Editors` / `Viewers`, filtering the participant list from
`share/members.tsx`. The Requests tab keeps the blue dot and exists only for owner/admin (it maps to
`I.ParticipantStatus.Joining`, which non-moderators do not receive today). Search filters by name and
`globalName`.

Member rows, the permission menus, the join-request approve/reject flow, the pending-member rows and the
reader/writer limit banners keep today's behavior.

### B. New popup `inviteManage` — `component/popup/invite/manage.tsx`

*Manage invite link*. Registered in `component/popup/index.tsx` and `store/popup.ts` next to
`inviteRequest` / `inviteConfirm` / `inviteQr`.

Top to bottom:

1. **Callout** — the legacy warning when `isInviteUnsafe()`; otherwise, when auto-approval is on:
   *"Please note, anyone who has access to this link will be able to join this space at any time."*
2. `Enable auto approval` + `Switch`, caption *"If enabled, people can join with this link without
   admins approval"*. Off = `WithApprove`, on = `WithoutApprove`. Toggling calls `SpaceInviteGenerate`
   with the new type and the current `shareWithinSpace`. **Turning it on generates a `Reader` invite** —
   an anyone-can-join link defaults to view access, never edit. (The Figma frame shows `Edit` selected;
   that is a state, not the default.)
3. `Anyone with the link can` + select `Edit` / `View` — **only when auto-approval is on**, defaulting to
   `View`. Calls `SpaceInviteChange(permissions)`. Offers `View` only when the invite is shared within the
   space (`Edit` there is `INVITE_NOT_SHAREABLE`).
4. `Everyone in the space can share this invite` + `Switch` — `shareWithinSpace`.
   - Off by default.
   - Turning **on** shows a confirm: *"All space members will be able to see this invite link and share
     it with anyone."* On confirm, `SpaceInviteGenerate(same type, same permissions, true)` — the
     middleware publishes the very same invite: same cid, same key, no new acl record, and the link
     already handed out keeps working.
   - Once on it **cannot go back off** — the workspace's change history has already given the cid and key
     to every member. Render it disabled with a hint pointing at `Reset link`.
   - **Disabled** when auto-approval is on and the role is `Edit`, with the reason: *"Anyone with this
     link joins as an editor, without approval. Only you can share it."* Selecting `View` re-enables it.
5. Read-only link input.
6. `Copy link` (primary).
7. `Reset link` — confirm (the existing revoke confirm copy), then `SpaceInviteRevoke` →
   `SpaceInviteGenerate(same type, same permissions, shareWithinSpace: false)`. Everyone holding the old
   link loses it, including the people the owner meant to invite; the confirm must say so.

### C. New popup `inviteAdd` — `component/popup/invite/add.tsx`

*Add Members*. The participant picker currently living inside `popup/space/create.tsx` step 0 (search +
cross-space participant subscription + multi-select) extracted into a shared component both callers use,
plus a `Select role` dropdown. `Invite N members` → `C.SpaceParticipantsAddList(spaceId, identities,
permissions)`.

`addMembers` middleware-side adds accounts to the ACL directly and does not need an invite to exist — so
this popup works with the link toggle off. Verify during implementation, since `popup/space/create.tsx`
today generates an invite before calling `SpaceParticipantsAddList` and that call may be vestigial.

### D. General settings page — `component/page/main/settings/space/index.tsx`

Action row: `Mute` + `Invite members` when the space is not shared; `Mute` + `Copy link` + `Show QR code`
when it is. Gate the Copy/QR pair on `U.Space.hasVisibleInvite()` — a member whose invite is owner-held
gets neither.

### E. Owner-held gating elsewhere

`header/main/settings.tsx` and `U.Menu.spaceContext` (the *Copy invite link* / *Show QR code* items) hide
those affordances when the invite is owner-held and we are not the owner. `U.Object.getInviteLink` already
degrades correctly (it guards on `cid && key`), so deeplinks silently drop the invite params.

### F. Default invite type

All four `SpaceInviteGenerate` call sites switch from `WithoutApprove` to `WithApprove`, with
`shareWithinSpace: false`:

| call site | today |
|---|---|
| `settings/space/share.tsx` | `WithoutApprove` + Reader/Writer, from the link-type picker |
| `popup/space/create.tsx:279` | `WithoutApprove` + Writer |
| `lib/action.ts:1090` (`processPendingMembers`) | `WithoutApprove` + Writer |
| `page/auth/onboard.tsx:244` | `WithoutApprove` + Reader |

The two `SpaceParticipantsAddList` flows (space-create, pending members) keep adding people at the role
they pick; only the invite left behind changes, so they no longer strand a no-approval editor link in the
space.

`I.InviteLinkType` (None / Editor / Viewer / Manual) stops being the UI model — the picker it drove is
gone — but stays as the analytics dimension for `ClickShareSpaceNewLink`, derived from
`(inviteType, permissions)`.

## Error handling

| code | when | UI |
|---|---|---|
| `INVITE_ALREADY_SHARED` (106) | generate with `shareWithinSpace: false` while the current invite of that type is shared. Reachable only on legacy spaces — e.g. the owner toggles auto-approval on a pre-existing invite | Confirm: the invite cannot be taken back into your account; offer `Reset link`, and say the old link stops working for everyone who has it |
| `INVITE_NOT_SHAREABLE` (107) | `shareWithinSpace: true` on an anyone-can-join invite above Reader, or `InviteChange` raising a shared invite above Reader | Explain the link grants too much to be shared; offer to lower the role to `View` first |
| `LIMIT_REACHED` (104) | shared-space limit | today's `popupConfirmSharedSpaceLimit*` upgrade confirm — unchanged |
| `NO_ACTIVE_INVITE` | no invite | not an error: the link toggle is off. Already in `SKIP_ERRORS` |

## Testing

- Unit (vitest, on `develop`): `U.Space.canManageInvite` / `hasVisibleInvite` / `isInviteUnsafe` across the
  owner × member × held-by-owner × shared × type × permissions matrix; the `S.Common` invite map;
  `response.SpaceInviteGetCurrent` mapping `heldByOwner`.
- Manual, against the local `go-7222-invite-cleanup` middleware: owner generates a request-to-join invite
  and a second device joins; a member sees no link; auto-approval on/off; share-within-space on, then
  confirm it cannot go back off; reset link; a legacy space with an anyone-can-join Writer invite shows the
  banner.
- E2E: run `/qa-engineer` after implementation — this changes editor-adjacent, user-facing settings flows.

## Out of scope

- The *"Your invite links have been updated"* modal from the design (see Why).
- Guest invites (`I.InviteType.Guest`) — unused in the client and unchanged by GO-7222.
- Removing admins' ability to add members or approve requests. Only invite create/revoke becomes
  owner-only.
