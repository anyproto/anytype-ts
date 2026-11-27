import type { UnaryInterceptor, StreamInterceptor, Request } from 'grpc-web';
import { isSensitiveCommand } from './sensitive';

declare const __gRPC_devtools__:
	| undefined
	| {
		gRPCWebUnaryInterceptor: UnaryInterceptor<unknown, unknown>;
		gRPCWebStreamInterceptor: StreamInterceptor<unknown, unknown>;
	};

/** A method whose name can't be read is treated as sensitive: DevTools sees nothing it can't classify */
const sensitive = (request: Request<unknown, unknown>): boolean => {
	try {
		return isSensitiveCommand(request.getMethodDescriptor().getName());
	} catch (e) {
		return true;
	};
};

/**
 * The DevTools interceptors never see a key-bearing request or its response: those go straight to the invoker.
 * Both kinds are wrapped: grpc-web's callback-style `rpcCall` (what ServiceClient uses for every unary
 * command) runs the STREAM interceptors; the promise-style `unaryCall` runs the unary ones.
 */
export const bypassSensitive = (inner: UnaryInterceptor<unknown, unknown>): UnaryInterceptor<unknown, unknown> => ({
	intercept: (request, invoker) => sensitive(request) ? invoker(request) : inner.intercept(request, invoker),
});

export const bypassSensitiveStream = (inner: StreamInterceptor<unknown, unknown>): StreamInterceptor<unknown, unknown> => ({
	intercept: (request, invoker) => sensitive(request) ? invoker(request) : inner.intercept(request, invoker),
});

export const unaryInterceptors =
	typeof __gRPC_devtools__ === 'object'
		? [ bypassSensitive(__gRPC_devtools__.gRPCWebUnaryInterceptor) ]
		: [];

export const streamInterceptors =
	typeof __gRPC_devtools__ === 'object'
		? [ bypassSensitiveStream(__gRPC_devtools__.gRPCWebStreamInterceptor) ]
		: [];
