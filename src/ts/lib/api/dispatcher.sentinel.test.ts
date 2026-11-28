/**
 * Key-bearing RPCs never reach the dispatcher's debug log or the gRPC DevTools interceptors, with every
 * flagsMw debug flag on and the DevTools extension present. Runs the real dispatcher.init + request path,
 * the real generated ServiceClient and the real grpc-web client (so grpc-web itself picks which interceptor
 * chain runs); only the bytes on the wire are faked: a JSON codec instead of protobuf, and an
 * XMLHttpRequest that answers with one grpc-web frame.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Mapper } from './mapper';

/** What the fake gRPC DevTools extension saw, per interceptor kind: request and response messages, as text */
const devtoolsSeen: { unary: string[]; stream: string[] } = { unary: [], stream: [] };

/** The response the fake server returns for the next call */
let nextResponse: any = null;

/** The HTTP status of the next answer (anything but 200 has no gRPC body: grpc-web maps the status itself) */
let nextStatus = 200;

/** URLs the fake transport received (proves the request really went through grpc-web) */
const wire: string[] = [];

// The extension's global, present before grpc-devtools.ts is evaluated (dispatcher is imported dynamically).
// Both hooks record what they see the way the real extension does: the request message, then every
// response message delivered to the caller.
(globalThis as any).__gRPC_devtools__ = {
	gRPCWebUnaryInterceptor: {
		intercept: async (request: any, invoker: any) => {
			devtoolsSeen.unary.push(JSON.stringify(request.getRequestMessage()));

			const response = await invoker(request);

			devtoolsSeen.unary.push(JSON.stringify(response.getResponseMessage()));
			return response;
		},
	},
	gRPCWebStreamInterceptor: {
		intercept: (request: any, invoker: any) => {
			devtoolsSeen.stream.push(JSON.stringify(request.getRequestMessage()));

			const stream = invoker(request);
			const on = stream.on.bind(stream);

			stream.on = (type: string, callback: (...args: any[]) => void) => {
				if (type == 'data') {
					return on(type, (response: any) => {
						devtoolsSeen.stream.push(JSON.stringify(response));
						callback(response);
					});
				};
				return on(type, callback);
			};
			return stream;
		},
	},
};

// The protobuf codecs are replaced by JSON: the generated proto modules don't load under vitest, and
// the interceptor selection under test doesn't depend on the encoding
vi.mock('Proto/pb/protos/commands', () => {
	const codec = {
		fromPartial: (x: any) => x,
		encode: (x: any) => ({ finish: () => new TextEncoder().encode(JSON.stringify(x)) }),
		decode: (bytes: Uint8Array) => JSON.parse(new TextDecoder().decode(bytes)),
	};
	return new Proxy({}, { get: (_t, k) => (k === 'then') ? undefined : codec, has: () => true });
});

/** One grpc-web binary response: a data frame with the message, then a trailer frame with grpc-status 0 */
const grpcWebBody = (message: any): ArrayBuffer => {
	const msg = new TextEncoder().encode(JSON.stringify(message));
	const trailer = new TextEncoder().encode('grpc-status:0\r\ngrpc-message:\r\n');
	const out = new Uint8Array(5 + msg.length + 5 + trailer.length);
	const view = new DataView(out.buffer);

	out[0] = 0;
	view.setUint32(1, msg.length);
	out.set(msg, 5);
	out[5 + msg.length] = 0x80;
	view.setUint32(6 + msg.length, trailer.length);
	out.set(trailer, 10 + msg.length);
	return out.buffer;
};

/** The transport grpc-web drives (through closure's XhrIo) */
class FakeXhr {
	readyState = 0;
	status = 0;
	responseType = '';
	response: any = null;
	responseText = '';
	onreadystatechange: (() => void) | null = null;

	open (_method: string, url: string) {
		wire.push(url);
		this.readyState = 1;
	};

	setRequestHeader () {};

	getResponseHeader (name: string) {
		return (name.toLowerCase() == 'content-type') ? 'application/grpc-web+proto' : null;
	};

	getAllResponseHeaders () {
		return 'content-type: application/grpc-web+proto\r\n';
	};

	send () {
		const status = nextStatus;
		const body = (status == 200) ? grpcWebBody(nextResponse) : new ArrayBuffer(0);

		setTimeout(() => {
			this.status = status;
			this.readyState = 4;
			this.response = body;
			this.onreadystatechange?.();
		}, 0);
	};

	abort () {};
};

// Only the request path is under test: everything the dispatcher drags in for events is stubbed
vi.mock('@sentry/browser', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }));
vi.mock('Model', () => ({}));
vi.mock('../presence', () => ({ presence: {} }));
vi.mock('../chatStatus', () => ({ chatStatus: {} }));
vi.mock('Lib/util/chatWindow', () => ({ liveAddIndex: vi.fn() }));
vi.mock('Lib/util/subscription', () => ({ applySubscriptionPosition: vi.fn() }));
vi.mock('Lib/linkApproval', () => ({ approvalSpaces: {} }));
vi.mock('Lib/membership', () => ({ membership: {} }));

const SENTINEL = 'SENTINEL-dispatcher-key-0123456789';

const flagsMw = { request: true, json: true, time: true, event: true, sync: true, file: true, subscribe: true };

beforeEach(() => {
	nextStatus = 200;
	devtoolsSeen.unary.length = 0;
	devtoolsSeen.stream.length = 0;
	wire.length = 0;
	vi.stubGlobal('XMLHttpRequest', FakeXhr);
	vi.stubGlobal('S', {
		Common: { config: { flagsMw } },
		Auth: { token: 'token' },
	});
	vi.stubGlobal('U', {
		Common: {
			objectCopy: (o: any) => JSON.parse(JSON.stringify(o)),
			objectClear: (o: any) => o,
			translateError: (_: string, e: any) => e.description,
		},
	});
	vi.stubGlobal('analytics', { event: vi.fn() });
	// response.ts maps through the global Mapper, as the app does
	vi.stubGlobal('Mapper', Mapper);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

/** All console output of one request plus what DevTools saw, as text */
const observe = async (type: string, data: any, response: any): Promise<{ console: string; devtools: string }> => {
	const { dispatcher } = await import('./dispatcher');
	const calls: any[][] = [];

	for (const m of [ 'log', 'info', 'warn', 'error', 'debug' ] as const) {
		vi.spyOn(console, m).mockImplementation((...args: any[]) => {
			calls.push(args);
		});
	};

	dispatcher.init('http://127.0.0.1:1');
	nextResponse = response;

	const message = await new Promise<any>(resolve => dispatcher.request(type, data, resolve));

	expect(message.error.code).toBe(0);
	expect(wire).toEqual([ `http://127.0.0.1:1/anytype.ClientCommands/${type}` ]);
	return {
		console: JSON.stringify(calls.map(args => args.map(a => (typeof a == 'string') ? a : JSON.stringify(a)))),
		devtools: [ ...devtoolsSeen.unary, ...devtoolsSeen.stream ].join('\n'),
	};
};

describe('key-bearing RPCs: no debug log, no gRPC DevTools', () => {
	test('a CreateApp response carrying a key', async () => {
		const out = await observe('AccountLocalLinkCreateApp', { app: { appName: 'Cursor' } }, { appKey: SENTINEL, error: { code: 0 } });

		expect(out.console).not.toContain(SENTINEL);
		expect(out.devtools).toBe('');
	});

	test('a ListApps response carrying keys', async () => {
		const out = await observe('AccountLocalLinkListApps', {}, { app: [ { appHash: 'h', appName: 'Cursor', appKey: SENTINEL, createdAt: 1, expireAt: 0, scope: 1, isActive: true } ], error: { code: 0 } });

		expect(out.console).not.toContain(SENTINEL);
		expect(out.devtools).toBe('');
	});

	test('a SolveChallenge response carrying a key', async () => {
		const out = await observe('AccountLocalLinkSolveChallenge', { challengeId: 'c', answer: '1234' }, { sessionToken: SENTINEL, appKey: SENTINEL, error: { code: 0 } });

		expect(out.console).not.toContain(SENTINEL);
		expect(out.devtools).toBe('');
	});

	test('a WalletCreateSession request carrying the clipper\'s appKey (and its session token response)', async () => {
		const out = await observe('WalletCreateSession', { appKey: SENTINEL }, { token: SENTINEL, accountId: 'acc', error: { code: 0 } });

		expect(out.console).not.toContain(SENTINEL);
		expect(out.devtools).toBe('');
	});

	test('control: other requests are still logged and reach the DevTools hook grpc-web actually runs (stream)', async () => {
		const out = await observe('AccountLocalLinkRevokeApp', { appHash: SENTINEL }, { error: { code: 0 }, echo: SENTINEL });

		expect(out.console).toContain(SENTINEL);
		// Request and response both reached the stream hook: the bypass above is what keeps keys out
		expect(devtoolsSeen.stream.length).toBe(2);
		expect(devtoolsSeen.stream[0]).toContain(SENTINEL);
		expect(devtoolsSeen.stream[1]).toContain(SENTINEL);
	});
});

describe('transport errors', () => {
	test('S1: an HTTP 400 that never reached heart arrives as code 3 marked `transport`; heart\'s own code 3 carries no mark', async () => {
		const { dispatcher } = await import('./dispatcher');

		vi.spyOn(console, 'error').mockImplementation(() => {});
		dispatcher.init('http://127.0.0.1:1');

		// grpc-web's status map: 400 → INVALID_ARGUMENT (3), the number heart uses for RevokeApp's NOT_FOUND
		nextStatus = 400;

		const failed = await new Promise<any>(resolve => dispatcher.request('AccountLocalLinkRevokeApp', { appHash: 'hash-1' }, resolve));

		expect(failed.error.code).toBe(3);
		expect(failed.error.transport).toBe(true);

		nextStatus = 200;
		nextResponse = { error: { code: 3, description: 'not found' } };

		const decoded = await new Promise<any>(resolve => dispatcher.request('AccountLocalLinkRevokeApp', { appHash: 'hash-1' }, resolve));

		expect(decoded.error.code).toBe(3);
		expect(decoded.error.transport).toBeUndefined();
	});
});

describe('bypassSensitive', () => {
	test('a request whose method name can not be read is treated as sensitive (both kinds)', async () => {
		const { bypassSensitive, bypassSensitiveStream } = await import('./grpc-devtools');
		const request = { getMethodDescriptor: () => { throw new Error('x'); } } as any;

		const unaryInner = { intercept: vi.fn() };
		const unaryInvoker = vi.fn(async () => 'response');

		expect(await bypassSensitive(unaryInner as any).intercept(request, unaryInvoker as any)).toBe('response');
		expect(unaryInner.intercept).not.toHaveBeenCalled();

		const streamInner = { intercept: vi.fn() };
		const streamInvoker = vi.fn(() => 'stream');

		expect(bypassSensitiveStream(streamInner as any).intercept(request, streamInvoker as any)).toBe('stream');
		expect(streamInner.intercept).not.toHaveBeenCalled();
	});
});
