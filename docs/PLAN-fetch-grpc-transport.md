# Plan: Migrate gRPC Stream from `grpc-web` Library to Fetch-Based Transport

## Context

**anytype-ts** uses the `grpc-web` npm library (`GrpcWebClientBase`) for both unary RPCs and server-streaming (event listening). This library manages its own HTTP transport, connection lifecycle, and protobuf framing internally.

**anytype-bun** replaced this with a **fetch-based gRPC-Web transport** — encoding/decoding gRPC-Web frames manually over standard `fetch()` calls and `ReadableStream`. This approach:
- Removes the `grpc-web` and `google-protobuf` npm dependencies
- Enables platform-agnostic fetch (Electron native, Tauri plugin, or browser)
- Adds **visibility-based stream pausing** (prevents CPU spikes when tab hidden)
- Adds **unary retry with exponential backoff** (network errors, 5xx, 429)
- Uses `AbortController` for clean stream lifecycle management
- Returns promises from commands instead of callbacks

The event dispatching logic (routing events to MobX stores) stays largely the same — both projects process the same protobuf event types. The key change is **how** the transport layer works.

## Key Differences Summary

| Aspect | anytype-ts (current) | anytype-bun (target) |
|--------|---------------------|---------------------|
| **Transport** | `grpc-web` library (`GrpcWebClientBase.rpcCall`, `.serverStreaming`) | Raw `fetch()` with manual gRPC-Web frame encoding |
| **Unary requests** | Callback-based via `service.request()` | Promise-based via `callUnary()` with retry |
| **Event stream** | `grpc-web` `ClientReadableStream` with `.on('data'|'status'|'end')` | `fetch` + `ReadableStream.getReader()` with manual frame parsing |
| **Visibility pause** | None | Pauses stream when page hidden, resumes when visible |
| **Unary retry** | None | 2 retries with exponential backoff (200ms base) |
| **Stream lifecycle** | `stream.cancel()` | `AbortController.abort()` + `reader.cancel()` |
| **Dependencies** | `grpc-web`, `google-protobuf` | None (uses ts-proto `MessageFns` directly) |
| **Command API** | `dispatcher.request(type, data, callback)` — callback-based | `dispatcher.request(method, req, reqFns, resFns)` — promise-based |
| **DevTools** | gRPC DevTools interceptors via `grpc-web` | Removed (not compatible with fetch transport) |

## Implementation Plan

### Phase 1: New Transport Layer (fetch-based)

Create new files alongside existing ones (no breaking changes yet):

**1.1 `src/ts/lib/api/fetchProvider.ts`** (new, ~30 lines)
- Electron: `globalThis.fetch` (Chromium, no CORS issue for localhost)
- Web mode: `globalThis.fetch`
- Simple cached getter, mirrors anytype-bun's `fetchProvider.ts`

**1.2 `src/ts/lib/api/client.ts`** (new, ~130 lines)
- `callUnary<Req, Res>(methodName, request, requestFns, responseFns, metadata)` → `Promise<Res>`
- Manual gRPC-Web frame encoding: `[0x00, length (4 bytes BE), payload]`
- POST to `{address}/anytype.ClientCommands/{methodName}`
- Headers: `Content-Type: application/grpc-web+proto`, `X-Grpc-Web: 1`, plus metadata
- Response: skip 5-byte frame header, decode payload via `responseFns.decode()`
- Retry logic: MAX_RETRIES=2, RETRY_BASE_DELAY=200ms, exponential backoff on transient errors (status 0, 429, 5xx)
- `GrpcError` class for typed errors

**1.3 `src/ts/lib/api/eventStream.ts`** (new, ~310 lines)
- `startEventStream(grpcAddress, getToken, onEvent)` → abort function
- `streamEvents()` — single stream attempt via fetch + `ReadableStream.getReader()`
- `reconnectLoop()` — backoff matching current dispatcher behavior (3s/5s/60s)
- Visibility-based pause via `document.visibilitychange`
- `parseGrpcTrailer()` for error extraction
- `sleep()` with AbortSignal support

### Phase 2: Update Dispatcher

**2.1 Modify `src/ts/lib/api/dispatcher.ts`**
- Remove `grpc-web` imports (`ClientReadableStream`, `ServiceClient`)
- Remove `service`, `stream` fields
- Add `grpcAddress: string` field (set in `init()`)
- Add `stopStreamFn: (() => void) | null` field

- `init(address)`:
  - Store `address` as `this.grpcAddress` (no more `ServiceClient` instantiation)

- `startStream()`:
  - Call `startEventStream(this.grpcAddress, () => S.Auth.token, onEvent)` from `eventStream.ts`
  - The `onEvent` callback pushes to `eventBuffer` (same buffering as now)
  - Store the returned abort function in `this.stopStreamFn`
  - Remove manual `.on('data'|'status'|'end')` handlers — handled inside `eventStream.ts`

- `stopStream()`:
  - Call `this.stopStreamFn?.()` instead of `this.stream.cancel()`

- `reconnect()`:
  - Remove entirely — reconnection is now internal to `eventStream.ts`

- `request()`:
  - Replace `this.service.request(type, data, { token }, callback)` with `callUnary()` from `client.ts`
  - Need to look up `requestFns` and `responseFns` from the service registry
  - Keep the callback-based API for now (wrap promise in try/catch and invoke callback)
  - Process response events and errors the same way

### Phase 3: Update Service Registry

**3.1 Modify `src/ts/lib/api/service.ts`**
- Remove `GrpcWebClientBase`, `MethodDescriptor`, `MethodType` imports
- Remove `ServiceClient` class entirely
- Keep only the `registry` object (mapping command names to `{ req, res }` MessageFns)
- Export `registry` as a standalone object for use by the new dispatcher
- Remove `listenSessionEvents()` method (replaced by `eventStream.ts`)

### Phase 4: Remove Old Dependencies

**4.1 `package.json`**
- Remove `grpc-web` dependency
- Remove `google-protobuf` dependency (verify no other usages first)

**4.2 `src/ts/lib/api/grpc-devtools.ts`**
- Remove file (gRPC DevTools interceptors are incompatible with fetch transport)
- Remove references in dispatcher

### Phase 5: Event Dispatcher Extraction (optional, recommended)

The current `dispatcher.ts` is 1772 lines because it contains both transport logic AND event routing (~1400 lines of event handling). anytype-bun split this into a separate `eventDispatcher.ts` (834 lines).

This is a large refactor and can be done as a follow-up. For this initial migration, the event handling can stay in `dispatcher.ts` — only the transport layer changes.

## Files to Modify/Create

| File | Action | Lines |
|------|--------|-------|
| `src/ts/lib/api/fetchProvider.ts` | **Create** | ~30 |
| `src/ts/lib/api/client.ts` | **Create** | ~130 |
| `src/ts/lib/api/eventStream.ts` | **Create** | ~310 |
| `src/ts/lib/api/dispatcher.ts` | **Modify** | ~1772 (transport parts only) |
| `src/ts/lib/api/service.ts` | **Modify** | ~441 → ~330 (remove class, keep registry) |
| `src/ts/lib/api/grpc-devtools.ts` | **Delete** | 18 |
| `package.json` | **Modify** | remove 2 deps |

## What Stays the Same

- `command.ts` — stays callback-based (no API change to callers)
- `response.ts` — response processing unchanged
- `mapper.ts` — event mapping unchanged
- Event handling in `dispatcher.ts` (the 1400-line `event()` method) — unchanged
- All MobX store updates — unchanged
- `struct.ts` — unchanged

## Verification

1. **TypeCheck**: `bun run typecheck` — ensure no type errors
2. **Lint**: `bun run lint` — ensure no lint issues
3. **Build**: `bun run build:dev` — ensure it compiles
4. **Manual testing**: `bun run start:dev` — verify:
   - App starts and connects to middleware
   - Login/session creation works
   - Real-time events arrive (create/edit objects, see updates)
   - Tab switching doesn't cause CPU spikes (visibility pause)
   - Stream reconnects after middleware restart
   - Commands work (create objects, search, etc.)

## Branch

Create branch `feature/fetch-grpc-transport` from `develop`.
