export class GrpcWebClientBase {
	constructor() {}
	rpcCall() { return {}; }
	serverStreaming() { return {}; }
};

export class MethodDescriptor {
	constructor() {}
};

export const MethodType = { UNARY: 0, SERVER_STREAMING: 1 };

export class AbstractClientBase {
	constructor() {}
};
