# Membership API Integration

## Overview

The membership system manages subscription tiers, payment processing, and AnyName namespace allocation. The frontend communicates with the anytype-heart middleware via gRPC, using MobX for reactive state management.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  UI Components                                      │
│  (Settings pages, Popups)                           │
│       │                    ▲                        │
│       │ actions            │ MobX observes          │
│       ▼                    │                        │
│  ┌─────────┐    ┌──────────────────┐                │
│  │ Commands │    │ MembershipStore  │                │
│  │ (gRPC)  │    │ products / data  │                │
│  └────┬────┘    └────────▲─────────┘                │
│       │                  │                          │
│       ▼                  │ event updates            │
│  ┌─────────┐    ┌────────┴─────────┐                │
│  │ Middleware│◄──│   Dispatcher     │                │
│  │ (heart)  │──►│ (event stream)   │                │
│  └──────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────┘
```

## Enums

**Source:** `src/ts/interface/membership.ts`

| Enum | Values | Usage |
|------|--------|-------|
| `MembershipStatus` | None(0), Pending(1), Active(2), Finalization(3) | Tracks subscription lifecycle |
| `MembershipPeriod` | Unlimited(0), Monthly(1), Yearly(2), ThreeYears(3) | Billing period |
| `PaymentProvider` | None(0), Stripe(1), Crypto(2), BillingPortal(3), AppStore(4), GooglePlay(5) | Payment origin |
| `NameType` | Any(0) | Namespace type for AnyName allocation |

## Data Types

### MembershipProduct

Represents an available subscription tier.

```typescript
interface MembershipProduct {
    id: string;
    name: string;
    description: string;
    isTopLevel: boolean;        // primary tier (vs add-on)
    isIntro: boolean;           // introductory/free tier
    isHidden: boolean;          // hidden from UI
    color: string;              // tier color (green, blue, red, ice)
    offer: string;              // promotional offer text
    pricesYearly: MembershipAmount[];
    pricesMonthly: MembershipAmount[];
    features: {
        storageBytes: number;
        spaceReaders: number;
        spaceWriters: number;
        sharedSpaces: number;
        privateSpaces: number;
        teamSeats: number;
        anyNameCount: number;   // how many AnyNames included
        anyNameMinLen: number;  // minimum name length allowed
    };
}
```

**Model:** `src/ts/model/membershipProduct.ts` — adds computed `featuresList`, `colorStr`, `getPrice(isYearly)`, `getPriceString(isYearly)`.

### MembershipData

Represents the user's current membership state.

```typescript
interface MembershipData {
    products: MembershipPurchasedProduct[];
    nextInvoice: { date: number; total: MembershipAmount; };
    teamOwnerId: string;
    paymentProvider: PaymentProvider;
}
```

**Model:** `src/ts/model/membershipData.ts` — adds `getTopProduct()` (returns the top-level `MembershipProduct`) and `getTopPurchasedProduct()` (returns the purchased product entry with status).

### MembershipPurchasedProduct

A product instance owned by the user.

```typescript
interface MembershipPurchasedProduct {
    product: { id: string; };
    info: {
        dateStarted: number;
        dateEnds: number;
        isAutoRenew: boolean;
        period: MembershipPeriod;
    };
    status: MembershipStatus;
}
```

**Model:** `src/ts/model/membershipData.ts` — adds computed `isNone`, `isActive`, `isPending`, `isFinalization`.

## Store

**File:** `src/ts/store/membership.ts`

MobX store accessed via `S.Membership`:

| Property/Method | Description |
|---|---|
| `products` | Observable list of available `MembershipProduct[]` |
| `data` | Observable `MembershipData` (current membership state) |
| `productsSet(list)` | Replace all products |
| `productsUpdate(list)` | Merge/update products by ID |
| `dataSet(data)` | Replace membership data |
| `dataUpdate(data)` | Merge partial updates into data |
| `getProduct(id)` | Look up a single product by ID |
| `clearAll()` | Reset store |

## gRPC Commands

**File:** `src/ts/lib/api/command.ts`

All commands are async — they accept an optional callback with `(message: { error: { code, description }, ...data })`.

### V2 Commands (Primary API)

| Command | Parameters | Response | Description |
|---------|-----------|----------|-------------|
| `MembershipV2GetProducts` | `noCache: boolean` | `{ products: MembershipProduct[] }` | Fetch available tiers |
| `MembershipV2GetStatus` | `noCache: boolean` | `{ data: MembershipData }` | Fetch current membership state |
| `MembershipV2CartUpdate` | `productIds: string[], isYearly: boolean` | `{}` | Set cart contents before payment |
| `MembershipV2GetPortalLink` | — | `{ url: string }` | Get Stripe billing portal URL |
| `MembershipV2AnyNameIsValid` | `nsName: string` | `{}` | Validate name availability |
| `MembershipV2AnyNameAllocate` | `nsName: string` | `{}` | Claim an AnyName |
| `MembershipV2SubscribeToUpdates` | `email: string` | `{}` | Subscribe email to updates (platform=1 for desktop) |

### V1 Commands (Legacy, still used for promo codes)

| Command | Parameters | Response | Description |
|---------|-----------|----------|-------------|
| `MembershipCodeGetInfo` | `code: string` | `{ tier }` | Validate a promo code |
| `MembershipCodeRedeem` | `code: string, name: string` | `{}` | Redeem a promo code with AnyName |

V2 is enabled via `enableMembershipV2: true` passed during `AccountCreate`/`AccountSelect`.

## Response Mapping

**File:** `src/ts/lib/api/mapper.ts` (lines 617-681)

Mappers transform protobuf responses into TypeScript interfaces:

- `Mapper.From.MembershipAmount` — maps `{ currency, amountCents }`
- `Mapper.From.MembershipProduct` — maps product with features and pricing arrays
- `Mapper.From.MembershipData` — maps status with purchased products, invoice, provider

## Event Handling

**File:** `src/ts/lib/api/dispatcher.ts` (lines 1381-1401)

The middleware pushes real-time updates via the gRPC event stream:

| Event | Handler |
|-------|---------|
| `MembershipV2Update` | Calls `S.Membership.dataUpdate(data)`. If status is `Finalization`, triggers `Action.finalizeMembership()` to open the AnyName claim popup. |
| `MembershipV2ProductsUpdate` | Calls `S.Membership.productsUpdate(products)` to merge updated tier definitions. |

## Initialization Flow

**File:** `src/ts/lib/util/data.ts` (lines 979-1020)

Called during app startup (`U.Data.getMembershipData()`):

```
1. getMembershipProducts(noCache=true)
   → MembershipV2GetProducts → S.Membership.productsSet()
   
2. getMembershipStatus(noCache=true)  (chained after products load)
   → MembershipV2GetStatus → S.Membership.dataSet() → analytics.setProduct()
```

Both calls are skipped if offline or not on the Anytype network (`U.Data.isAnytypeNetwork()`).

## Purchase Flow

1. User selects a tier and billing period in the settings UI
2. `MembershipV2CartUpdate([ productId ], isYearly)` sends cart to middleware
3. `MembershipV2GetPortalLink()` returns a Stripe checkout/portal URL
4. User is redirected to the external payment page
5. After payment, the middleware sends a `MembershipV2Update` event
6. If the product requires AnyName setup, status transitions to `Finalization`
7. `Action.finalizeMembership()` opens the finalization popup
8. User validates and claims a name via `MembershipV2AnyNameIsValid` / `MembershipV2AnyNameAllocate`
9. Final `MembershipV2Update` event transitions status to `Active`

## Promo Code Flow

1. User enters a code in the activation popup
2. `MembershipCodeGetInfo(code)` validates the code and returns the tier
3. User enters a desired AnyName
4. `MembershipCodeRedeem(code, name)` activates the membership

## UI Components

### Settings Pages

**Directory:** `src/ts/component/page/main/settings/membership/`

| File | Component | Description |
|------|-----------|-------------|
| `index.tsx` | `PageMainSettingsMembership` | Router — shows Intro, Purchased, or Loader |
| `intro.tsx` | `PageMainSettingsMembershipIntro` | Tier selection carousel (Swiper), monthly/yearly toggle, purchase buttons |
| `purchased.tsx` | `PageMainSettingsMembershipPurchased` | Active membership details, manage plan, AnyName section |
| `loader.tsx` | `PageMainSettingsMembershipLoader` | Loading state with 5-second "long wait" fallback |

### Popups

**Directory:** `src/ts/component/popup/membership/`

| File | Component | Description |
|------|-----------|-------------|
| `activation.tsx` | `PopupMembershipActivation` | Promo code entry and redemption |
| `finalization.tsx` | `PopupMembershipFinalization` | AnyName validation (400ms debounce) and allocation after purchase |

### Page Router

**File:** `src/ts/component/page/main/membership.tsx`

Temporary page that opens the dashboard and shows the membership activation/settings popup. Supports a `code` URL parameter for direct promo code activation.

## Error Codes

Common error codes from the middleware (defined in protobuf):

| Code | Description |
|------|-------------|
| `BAD_INPUT` | Invalid request parameters |
| `NOT_LOGGED_IN` | User not authenticated |
| `PAYMENT_NODE_ERROR` | Payment processing failed |
| `CACHE_ERROR` | Cache read/write failure |
| `MEMBERSHIP_NOT_FOUND` | No membership record exists |
| `MEMBERSHIP_WRONG_STATE` | Operation invalid for current status |
| `CAN_NOT_CONNECT` | Network connectivity issue |
| `TOO_SHORT` / `TOO_LONG` | AnyName length validation |
| `HAS_INVALID_CHARS` | AnyName character validation |
| `NAME_IS_RESERVED` | AnyName already taken or reserved |
| `TIER_FEATURES_NO_NAME` | Tier does not include AnyName feature |

## Key Files

| Layer | File | Purpose |
|-------|------|---------|
| Commands | `src/ts/lib/api/command.ts` | gRPC request wrappers |
| Mappers | `src/ts/lib/api/mapper.ts` | Protobuf → TypeScript transforms |
| Responses | `src/ts/lib/api/response.ts` | Response extraction |
| Events | `src/ts/lib/api/dispatcher.ts` | Real-time event routing |
| Services | `src/ts/lib/api/service.ts` | Protobuf type registry |
| Store | `src/ts/store/membership.ts` | MobX reactive state |
| Interfaces | `src/ts/interface/membership.ts` | TypeScript types and enums |
| Models | `src/ts/model/membershipProduct.ts` | Product model with computed props |
| Models | `src/ts/model/membershipData.ts` | Data + PurchasedProduct models |
| Utilities | `src/ts/lib/util/data.ts` | Init helpers (`getMembershipData`) |
| Utilities | `src/ts/lib/util/common.ts` | Price formatting (`getMembershipPriceString`) |
| Actions | `src/ts/lib/action.ts` | `finalizeMembership()` |
| UI | `src/ts/component/page/main/settings/membership/` | Settings pages |
| UI | `src/ts/component/popup/membership/` | Activation/finalization popups |
