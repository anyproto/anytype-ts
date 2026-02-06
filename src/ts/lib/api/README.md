# api/ - gRPC Communication Layer

Handles all communication between the React frontend and the Go middleware (anytype-heart) via gRPC.

## Key Files

- `command.ts` - All gRPC command wrappers (exported as `C.*`). Each function wraps a gRPC call with proper request construction and response handling.
- `dispatcher.ts` - Low-level gRPC request dispatching and streaming
- `mapper.ts` - Response mapping: converts gRPC protobuf responses to frontend-friendly objects
- `response.ts` - Response type definitions and error handling

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
