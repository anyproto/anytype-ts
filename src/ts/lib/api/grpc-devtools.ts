import type { UnaryInterceptor, StreamInterceptor } from 'grpc-web';

declare const __gRPC_devtools__:
  | undefined
  | {
      gRPCWebUnaryInterceptor: UnaryInterceptor<unknown, unknown>;
      gRPCWebStreamInterceptor: StreamInterceptor<unknown, unknown>;
    };

export const unaryInterceptors =
  typeof __gRPC_devtools__ === 'object'
    ? [__gRPC_devtools__.gRPCWebUnaryInterceptor]
    : [];

export const streamInterceptors =
  typeof __gRPC_devtools__ === 'object'
    ? [__gRPC_devtools__.gRPCWebStreamInterceptor]
    : [];