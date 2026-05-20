# api/ - gRPC Communication Layer

Handles all communication between the React frontend and the Go middleware (anytype-heart) via gRPC.

## Files

| File | Purpose |
|------|---------|
| `command.ts` | All gRPC command wrappers (exported as `C.*`). Each function wraps a gRPC call with request construction and response handling. |
| `dispatcher.ts` | Low-level gRPC request dispatching, event streaming, and MobX store updates from server events |
| `mapper.ts` | Response mapping: converts gRPC protobuf responses to frontend-friendly objects |
| `response.ts` | Response type definitions and error handling |
| `service.ts` | Custom gRPC-web service client using ts-proto `MessageFns` for serialization. Auto-generated registry of ~329 unary methods. Replaces the old CJS `service_grpc_web_pb.js`. |
| `struct.ts` | Struct/Value encoding/decoding for protobuf. With ts-proto bindings these are identity operations, kept for backward compatibility (`Encode.struct()` / `Decode.struct()`). |
| `grpc-devtools.ts` | gRPC devtools interceptor integration (unary + stream interceptors) |
| `grpc-devtools.d.ts` | Type declarations for the `__gRPC_devtools__` global |

## Usage Pattern

```typescript
import { C } from 'Lib';

// Create a block
C.BlockCreate(rootId, targetId, position, block, (message) => {
	if (!message.error.code) {
		// success
	}
});

// Open an object
C.ObjectOpen(objectId, '', spaceId, (message) => { ... });
```

All mutations go through this command layer. The middleware handles persistence, sync, and business logic.

## Dispatcher Architecture

The dispatcher manages:
- Request queuing and execution via `ServiceClient`
- Event stream subscription (`listenEvents`) with ordered event processing
- MobX store updates from server events (block changes, detail updates, subscription counters)
- Event sorting to ensure correct processing order (e.g., `BlockSetChildrenIds` before `BlockAdd`)
