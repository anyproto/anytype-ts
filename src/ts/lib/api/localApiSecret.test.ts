import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./service', () => ({ ServiceClient: class {} }));
vi.mock('./grpc-devtools', () => ({ unaryInterceptors: [], streamInterceptors: [] }));
vi.mock('Model', () => ({}));

import { dispatcher } from './dispatcher';

const address = 'http://127.0.0.1:1234';
const secret = 'PxqHkE0Jt9d1gG7mN2rW4vY6zB8cF3sL5aT1uQ9oXyE';

/**
 * Captures the gRPC metadata of every call the dispatcher makes, from both the
 * unary and the streaming path.
 */
const captureMetadata = (): any[] => {
	const captured: any[] = [];

	dispatcher.service = {
		request: (_type: string, _data: any, metadata: any, callback: any) => {
			captured.push(metadata);
			callback(null, { error: { code: 0 } });
		},
		listenSessionEvents: (_request: any, metadata: any) => {
			captured.push(metadata);
			return { on: () => {}, cancel: () => {} };
		},
	} as any;

	return captured;
};

beforeEach(() => {
	vi.stubGlobal('S', {
		Common: { config: { flagsMw: {} } },
		Auth: { token: 'session-token' },
		Recovery: { runId: '', isRecoveryNeeded: () => false },
	});
	vi.stubGlobal('U', { Common: { translateError: (_type: string, error: any) => error.description } });
	vi.stubGlobal('analytics', { event: vi.fn() });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	dispatcher.service = null;
	dispatcher.stream = null;
});

describe('local api secret', () => {
	it('carries the parent secret on every command, alongside the session token', () => {
		dispatcher.init(address, secret);

		const captured = captureMetadata();

		dispatcher.request('AppGetVersion', {});

		expect(captured[0]).toEqual({ token: 'session-token', 'local-api-secret': secret });
	});

	it('carries the parent secret when opening the event stream', () => {
		dispatcher.init(address, secret);

		const captured = captureMetadata();

		dispatcher.startStream();

		expect(captured[0]).toEqual({ token: 'session-token', 'local-api-secret': secret });
	});

	it('omits the header when the client was handed no secret', () => {
		// Web mode and an externally started helper have no parent pipe: sending
		// an empty value would be indistinguishable from a wrong one. The browser
		// mock answers getGlobal with null for this key, which is what arrives here
		dispatcher.init(address, null);

		const captured = captureMetadata();

		dispatcher.request('AppGetVersion', {});

		expect(captured[0]).toEqual({ token: 'session-token' });
	});
});
