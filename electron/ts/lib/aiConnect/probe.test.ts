import fs from 'fs';
import http from 'http';
import type { AddressInfo } from 'net';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import { PROBE_PROTOCOL_VERSION, httpTransport, probe, type ProbeRequest, type ProbeResponse } from './probe';
import { proxyAwareNode, envProxyVars, recordingProxy, runChild, tempDir } from './testEnv';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const esbuild = require('esbuild');

const KEY = 'SENTINEL-probe-key-0123456789';

const response = (status: number, body: any = '', headers: Record<string, string> = {}): ProbeResponse => ({
	status,
	headers,
	text: (typeof body == 'string') ? body : JSON.stringify(body),
});

interface Req { method: string; path: string; headers: Record<string, string>; body: any; raw: ProbeRequest };

/** A fake transport: `reply` decides per request; every request is recorded */
const fakeTransport = (reply: (req: Req) => ProbeResponse | Promise<ProbeResponse>) => {
	const requests: Req[] = [];
	const transport = async (raw: ProbeRequest) => {
		const req = { method: raw.method, path: raw.path, headers: raw.headers, body: raw.body ? JSON.parse(raw.body) : undefined, raw };

		requests.push(req);

		const res = await reply(req);

		raw.onHeaders?.(res.status, res.headers);
		return res;
	};

	return { transport, requests };
};

const mcpServer = (opt: { session?: string; notifyStatus?: number; tools?: any[]; failList?: boolean; protocol?: string } = {}) => (req: Req) => {
	if (req.method == 'DELETE') {
		return response(200);
	};
	if (req.body.method == 'initialize') {
		return response(200, { jsonrpc: '2.0', id: 1, result: { protocolVersion: opt.protocol || PROBE_PROTOCOL_VERSION, serverInfo: { name: 'anytype' } } }, opt.session ? { 'mcp-session-id': opt.session } : {});
	};
	if (req.body.method == 'notifications/initialized') {
		return response(opt.notifyStatus || 202);
	};
	if (req.body.method == 'tools/list') {
		return opt.failList ? response(500, 'boom') : response(200, { jsonrpc: '2.0', id: 2, result: { tools: opt.tools || [ { name: 'search' } ] } });
	};
	return response(400);
};

describe('probe', () => {
	test('large: session header echoed back, negotiated version on follow-ups, DELETE sent', async () => {
		const { transport, requests } = fakeTransport(mcpServer({ session: 'sess-1', protocol: '2025-03-26' }));

		expect(await probe({ port: 31009, tier: 'large', route: 'http', key: KEY }, { transport, version: '0.57.9' })).toEqual({ ok: true });
		expect(requests.map(r => [ r.method, r.raw.port, r.path, r.body?.method ])).toEqual([
			[ 'POST', 31009, '/mcp/large', 'initialize' ],
			[ 'POST', 31009, '/mcp/large', 'notifications/initialized' ],
			[ 'POST', 31009, '/mcp/large', 'tools/list' ],
			[ 'DELETE', 31009, '/mcp/large', undefined ],
		]);

		const [ init, notify, list, del ] = requests;

		expect(init.body.params).toEqual({ protocolVersion: PROBE_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'anytype-desktop', version: '0.57.9' } });
		expect(init.headers).toEqual({ Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' });

		for (const r of [ notify, list ]) {
			expect(r.headers['MCP-Protocol-Version']).toBe('2025-03-26');
			expect(r.headers['Mcp-Session-Id']).toBe('sess-1');
		};
		expect(del.headers['Mcp-Session-Id']).toBe('sess-1');
		expect(requests.every(r => r.raw.timeoutMs == 5000)).toBe(true);
	});

	test('full: stateless, no session header, no DELETE', async () => {
		const { transport, requests } = fakeTransport(mcpServer({ notifyStatus: 200 }));

		expect(await probe({ port: 31009, tier: 'full', route: 'stdio', key: KEY }, { transport })).toEqual({ ok: true });
		expect(requests.map(r => r.method)).toEqual([ 'POST', 'POST', 'POST' ]);
		expect(requests.every(r => r.headers['Mcp-Session-Id'] === undefined)).toBe(true);
		expect(requests[0].path).toBe('/mcp/full');
	});

	test('the notification is accepted with 200 or 202 only', async () => {
		const run = (notifyStatus: number) => probe({ port: 1, tier: 'small', route: 'http', key: KEY }, { transport: fakeTransport(mcpServer({ session: 's', notifyStatus })).transport });

		expect(await run(202)).toEqual({ ok: true });
		expect(await run(200)).toEqual({ ok: true });
		expect(await run(204)).toEqual({ ok: false, category: 'unknown' });
	});

	test('a stateful tier without a session id fails; an empty tools list fails', async () => {
		expect(await probe({ port: 1, tier: 'large', route: 'http', key: KEY }, { transport: fakeTransport(mcpServer({})).transport })).toEqual({ ok: false, category: 'unknown' });
		expect(await probe({ port: 1, tier: 'full', route: 'http', key: KEY }, { transport: fakeTransport(mcpServer({ tools: [] })).transport })).toEqual({ ok: false, category: 'unknown' });
	});

	test('DELETE is still sent when tools/list fails', async () => {
		const { transport, requests } = fakeTransport(mcpServer({ session: 'sess-2', failList: true }));

		expect(await probe({ port: 1, tier: 'large', route: 'http', key: KEY }, { transport })).toEqual({ ok: false, category: 'unknown' });
		expect(requests[requests.length - 1]).toMatchObject({ method: 'DELETE', headers: { 'Mcp-Session-Id': 'sess-2' } });
	});

	test('the session id is taken from the headers: a broken initialize body still gets its DELETE', async () => {
		const requests: ProbeRequest[] = [];
		const transport = async (req: ProbeRequest): Promise<ProbeResponse> => {
			requests.push(req);
			if (req.method == 'DELETE') {
				return response(200);
			};
			// Headers arrive, then the body fails
			req.onHeaders?.(200, { 'mcp-session-id': 'sess-3' });
			throw new Error('incomplete response');
		};

		expect(await probe({ port: 1, tier: 'small', route: 'http', key: KEY }, { transport })).toEqual({ ok: false, category: 'unknown' });
		expect(requests.map(r => r.method)).toEqual([ 'POST', 'DELETE' ]);
		expect(requests[1].headers['Mcp-Session-Id']).toBe('sess-3');
	});

	test('an event-stream answer is read from its data line', async () => {
		const sse = (req: Req) => (req.body?.method == 'initialize')
			? response(200, `event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: { protocolVersion: PROBE_PROTOCOL_VERSION } })}\n\n`)
			: mcpServer()(req);

		expect(await probe({ port: 1, tier: 'full', route: 'http', key: KEY }, { transport: fakeTransport(sse).transport })).toEqual({ ok: true });
	});

	test.each([ 401, 403 ])('%s → unauthorized', async status => {
		expect(await probe({ port: 1, tier: 'large', route: 'http', key: KEY }, { transport: fakeTransport(() => response(status)).transport })).toEqual({ ok: false, category: 'unauthorized' });
		expect(await probe({ port: 1, tier: 'large', route: 'skill', key: KEY }, { transport: fakeTransport(() => response(status)).transport })).toEqual({ ok: false, category: 'unauthorized' });
	});

	test('a redirect is not followed', async () => {
		const { transport, requests } = fakeTransport(() => response(307, '', { location: 'http://evil.example/' }));

		expect(await probe({ port: 1, tier: 'full', route: 'http', key: KEY }, { transport })).toEqual({ ok: false, category: 'unknown' });
		expect(requests).toHaveLength(1);
	});

	test('skill: GET /v2/auth/whoami with the bearer header', async () => {
		const { transport, requests } = fakeTransport(() => response(200, { ok: true }));

		expect(await probe({ port: 31012, tier: 'large', route: 'skill', key: KEY }, { transport })).toEqual({ ok: true });
		expect(requests).toHaveLength(1);
		expect(requests[0]).toMatchObject({ method: 'GET', path: '/v2/auth/whoami', headers: { Authorization: `Bearer ${KEY}` } });
		expect(await probe({ port: 31012, tier: 'large', route: 'skill', key: KEY }, { transport: fakeTransport(() => response(500)).transport })).toEqual({ ok: false, category: 'unknown' });
	});
});

describe('the node:http transport', () => {
	const servers: http.Server[] = [];

	afterEach(async () => {
		await Promise.all(servers.splice(0).map(s => new Promise(r => {
			s.closeAllConnections?.();
			s.close(r);
		})));
	});

	/** A heart stand-in; `port` 0 picks a free one */
	const listen = (handler: http.RequestListener, port = 0): Promise<number | null> => new Promise(resolve => {
		const server = http.createServer(handler);

		server.once('error', () => resolve(null));
		server.listen(port, '127.0.0.1', () => {
			servers.push(server);
			resolve((server.address() as AddressInfo).port);
		});
	});

	const heart = (requests: { method: string; url: string; headers: http.IncomingHttpHeaders }[]): http.RequestListener => (req, res) => {
		let body = '';

		req.on('data', c => body += c);
		req.on('end', () => {
			requests.push({ method: req.method, url: req.url, headers: req.headers });

			if (req.headers.authorization != `Bearer ${KEY}`) {
				res.writeHead(401).end();
				return;
			};
			if (req.method == 'DELETE') {
				res.writeHead(200).end();
				return;
			};

			const msg = JSON.parse(body);

			if (msg.method == 'initialize') {
				res.writeHead(200, { 'Content-Type': 'application/json', 'Mcp-Session-Id': 'live-1' }).end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { protocolVersion: PROBE_PROTOCOL_VERSION } }));
			} else
			if (msg.method == 'tools/list') {
				res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: 2, result: { tools: [ { name: 'search' } ] } }));
			} else {
				res.writeHead(202).end();
			};
		});
	};

	test('works on a port fetch refuses ("bad port")', async () => {
		const requests: any[] = [];
		let port: number | null = null;

		// Ports on the WHATWG bad-port list; the first one that is free on this machine
		for (const candidate of [ 10080, 6566, 6665, 6666, 6667, 6668, 6669, 6697, 6000 ]) {
			port = await listen(heart(requests), candidate);
			if (port) {
				break;
			};
		};

		expect(port).not.toBeNull();
		await expect(fetch(`http://127.0.0.1:${port}/`)).rejects.toThrow();

		expect(await probe({ port, tier: 'large', route: 'http', key: KEY })).toEqual({ ok: true });
		expect(requests.map(r => [ r.method, r.url ])).toEqual([
			[ 'POST', '/mcp/large' ], [ 'POST', '/mcp/large' ], [ 'POST', '/mcp/large' ], [ 'DELETE', '/mcp/large' ],
		]);
		expect(requests[1].headers['mcp-session-id']).toBe('live-1');
		expect(await probe({ port, tier: 'large', route: 'http', key: 'wrong-key-0123456789' })).toEqual({ ok: false, category: 'unauthorized' });
	});

	/**
	 * Node's built-in proxy support really on (NODE_USE_ENV_PROXY=1 at start-up, HTTP_PROXY set, no
	 * loopback exemption), in Electron's Node as in the product: probe.ts is bundled the way main is and
	 * run in a child. A plain request in the same child (the control) goes to the proxy; the probe, with
	 * its bearer, reaches only the local API.
	 */
	test.skipIf(!proxyAwareNode)('with Node\'s environment proxy enabled, the probe never goes through the proxy', async () => {
		const dir = tempDir('aic-probe-');
		const proxy = await recordingProxy();
		const requests: any[] = [];

		try {
			const port = await listen(heart(requests));
			const out = path.join(dir, 'probe.js');

			await esbuild.build({ entryPoints: [ path.join(__dirname, 'probe.ts') ], bundle: true, platform: 'node', target: 'node24', format: 'cjs', outfile: out, logLevel: 'silent' });
			fs.writeFileSync(path.join(dir, 'run.js'), `
const http = require('http');
const { probe } = require(${JSON.stringify(out)});
(async () => {
	const control = await new Promise(resolve => {
		const q = http.get('http://127.0.0.1:${port}/control', res => { res.resume(); resolve(res.statusCode); });
		q.on('error', () => resolve('error'));
		q.setTimeout(3000, () => q.destroy());
	});
	const result = await probe({ port: ${port}, tier: 'large', route: 'http', key: ${JSON.stringify(KEY)} });
	process.stdout.write(JSON.stringify({ control, result }));
})();
`);

			const res = await runChild(proxyAwareNode, [ path.join(dir, 'run.js') ], envProxyVars(proxy.port), { cwd: dir });
			const { control, result } = JSON.parse(res.stdout);

			// The control went to the proxy (502), so the environment proxy is active in this process
			expect(control).toBe(502);
			expect(proxy.seen).toEqual([ `GET http://127.0.0.1:${port}/control auth=` ]);
			// The probe, bearer included, reached only the API
			expect(result).toEqual({ ok: true });
			expect(requests.map(r => [ r.method, r.url, r.headers.authorization ])).toEqual([
				[ 'POST', '/mcp/large', `Bearer ${KEY}` ], [ 'POST', '/mcp/large', `Bearer ${KEY}` ], [ 'POST', '/mcp/large', `Bearer ${KEY}` ], [ 'DELETE', '/mcp/large', `Bearer ${KEY}` ],
			]);
		} finally {
			await proxy.close();
			fs.rmSync(dir, { recursive: true, force: true });
		};
	});

	test('connection refused → unreachable', async () => {
		const port = await listen(() => {});
		const server = servers.pop();

		await new Promise(r => server.close(r));
		expect(await probe({ port, tier: 'large', route: 'http', key: KEY })).toEqual({ ok: false, category: 'unreachable' });
	});

	test('a server that never answers → timeout', async () => {
		const port = await listen(() => { /* hangs */ });

		expect(await probe({ port, tier: 'full', route: 'http', key: KEY }, { timeoutMs: 100 })).toEqual({ ok: false, category: 'timeout' });
	});

	test('a redirect is returned, never followed', async () => {
		const requests: string[] = [];
		const port = await listen((req, res) => {
			requests.push(req.url);
			res.writeHead(307, { Location: 'http://example.com/' }).end();
		});

		const res = await httpTransport({ port, method: 'GET', path: '/v2/auth/whoami', headers: {}, timeoutMs: 1000 });

		expect(res.status).toBe(307);
		expect(requests).toEqual([ '/v2/auth/whoami' ]);
	});

	test('headers reach onHeaders before a body that breaks off', async () => {
		const port = await listen((req, res) => {
			res.writeHead(200, { 'Mcp-Session-Id': 'early', 'Content-Length': '100' });
			res.write('{"partial":');
			setTimeout(() => res.destroy(), 20);
		});
		const seen: Record<string, string>[] = [];

		await expect(httpTransport({ port, method: 'POST', path: '/mcp/large', headers: {}, body: '{}', timeoutMs: 1000, onHeaders: (s, h) => seen.push(h) })).rejects.toThrow();
		expect(seen[0]['mcp-session-id']).toBe('early');
	});
});

describe('D1R1-F: the gate before every authenticated request', () => {
	test('D1R1-F: the API stops between two requests of one probe: nothing more is sent, not even the session cleanup', async () => {
		let open = true;
		const fake = fakeTransport(req => {
			// Right after the first answer the user switches the API off
			open = false;
			return mcpServer({ session: 's' })(req);
		});
		const res = await probe({ port: 1, tier: 'small', route: 'http', key: KEY }, { transport: fake.transport, gate: () => open });

		expect(res).toEqual({ ok: false, category: 'apiOff' });
		expect(fake.requests.map(r => r.method)).toEqual([ 'POST' ]);

		const closed = fakeTransport(mcpServer({ session: 's' }));

		expect(await probe({ port: 1, tier: 'small', route: 'skill', key: KEY }, { transport: closed.transport, gate: () => false })).toEqual({ ok: false, category: 'apiOff' });
		expect(closed.requests).toEqual([]);
	});
});
