/**
 * Checks that a freshly delivered key works against Anytype's own API, the way the AI app will use
 * it. Talks only to http://127.0.0.1:<port>, follows no redirects, never logs a body.
 *
 * The transport is node:http with a fresh agent, not fetch: fetch refuses the WHATWG "bad ports"
 * (6000, 10080, …) that the Local API accepts, and may route through an environment HTTP proxy.
 */
import http from 'http';
import type { AiErrorCategory, AiProbeResult, AiRoute, AiTier } from './types';

export const PROBE_PROTOCOL_VERSION = '2025-06-18';
const TIMEOUT_MS = 5000;
const MAX_BODY = 8 * 1024 * 1024;

export interface ProbeRequest {
	port: number;
	method: string;
	path: string;
	headers: Record<string, string>;
	body?: string;
	timeoutMs: number;
	/** Called as soon as the status and headers arrive, before the body is read */
	onHeaders?: (status: number, headers: Record<string, string>) => void;
	/** Aborted: the request in flight is torn down (a logout, D1S-20) */
	signal?: AbortSignal;
};

export interface ProbeResponse {
	status: number;
	/** Lower-case names */
	headers: Record<string, string>;
	text: string;
};

export type Transport = (req: ProbeRequest) => Promise<ProbeResponse>;

const timeoutError = (): Error => Object.assign(new Error('timeout'), { name: 'TimeoutError', code: 'ETIMEDOUT' });

/** One loopback request with node:http: no proxy, no keep-alive pool, no redirects, a hard deadline */
export const httpTransport: Transport = req => new Promise((resolve, reject) => {
	let settled = false;
	let timer: ReturnType<typeof setTimeout> | null = null;

	const done = (err: Error | null, res?: ProbeResponse) => {
		if (settled) {
			return;
		};
		settled = true;
		if (timer) {
			clearTimeout(timer);
		};
		err ? reject(err) : resolve(res);
	};

	const headers: Record<string, string> = { ...req.headers };

	if (req.body !== undefined) {
		headers['Content-Length'] = String(Buffer.byteLength(req.body, 'utf8'));
	};

	const r = http.request({ host: '127.0.0.1', port: req.port, method: req.method, path: req.path, headers, agent: false }, res => {
		const status = res.statusCode || 0;
		const lower: Record<string, string> = {};

		for (const [ k, v ] of Object.entries(res.headers)) {
			lower[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
		};

		try {
			req.onHeaders?.(status, lower);
		} catch (e) { /* the caller's bookkeeping must not break the request */ };

		const chunks: Buffer[] = [];
		let size = 0;

		res.on('data', (chunk: Buffer) => {
			size += chunk.length;
			if (size > MAX_BODY) {
				r.destroy(new Error('response too large'));
				return;
			};
			chunks.push(chunk);
		});
		res.on('end', () => done(null, { status, headers: lower, text: Buffer.concat(chunks).toString('utf8') }));
		res.on('error', e => done(e));
		res.on('close', () => {
			if (!res.complete) {
				done(new Error('incomplete response'));
			};
		});
	});

	timer = setTimeout(() => r.destroy(timeoutError()), req.timeoutMs);
	if (req.signal?.aborted) {
		r.destroy(Object.assign(new Error('aborted'), { name: 'AbortError' }));
	} else {
		req.signal?.addEventListener('abort', () => r.destroy(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
	};
	r.on('error', e => done(e));
	r.end(req.body);
});

class ProbeError extends Error {
	constructor (public category: AiErrorCategory) {
		super(category);
	};
};

/** A JSON body, or the first `data:` line of an event stream */
const parseBody = (text: string): any => {
	try {
		return JSON.parse(text);
	} catch (e) { /* maybe SSE */ };

	const line = String(text || '').split(/\r?\n/).find(l => l.startsWith('data:'));
	if (!line) {
		return null;
	};

	try {
		return JSON.parse(line.slice(5).trim());
	} catch (e) {
		return null;
	};
};

const categoryOf = (e: any): AiErrorCategory => {
	if (e instanceof ProbeError) {
		return e.category;
	};

	const name = String(e?.name || '');
	const code = String(e?.cause?.code || e?.code || '');

	if ((name == 'AbortError') || (name == 'TimeoutError') || (code == 'ETIMEDOUT')) {
		return 'timeout';
	};
	if ([ 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH' ].includes(code)) {
		return 'unreachable';
	};
	return 'unknown';
};

export interface ProbeParam {
	port: number;
	tier: AiTier;
	route: AiRoute;
	key: string;
};

/**
 * `gate`: asked right before every request that carries the key (session cleanup included); false → nothing is
 * sent and the probe answers `apiOff` (main: the API listens on that port, bound where 127.0.0.1 reaches it).
 * `signal`: aborted, the request in flight is torn down and nothing more is sent (`apiOff`)
 */
export const probe = async (param: ProbeParam, opt: { transport?: Transport; version?: string; timeoutMs?: number; gate?: () => boolean; signal?: AbortSignal } = {}): Promise<AiProbeResult> => {
	const transport = opt.transport || httpTransport;
	const timeoutMs = opt.timeoutMs || TIMEOUT_MS;
	const auth = `Bearer ${param.key}`;

	const request = async (method: string, path: string, headers: Record<string, string>, body?: any, onHeaders?: ProbeRequest['onHeaders']) => {
		if (opt.signal?.aborted || (opt.gate && !opt.gate())) {
			throw new ProbeError('apiOff');
		};

		const res = await transport({
			port: param.port,
			method,
			path,
			headers: { Authorization: auth, ...headers },
			body: (body === undefined) ? undefined : JSON.stringify(body),
			timeoutMs,
			onHeaders,
			signal: opt.signal,
		});

		if (opt.signal?.aborted) {
			throw new ProbeError('apiOff');
		};
		if ((res.status == 401) || (res.status == 403)) {
			throw new ProbeError('unauthorized');
		};
		return res;
	};

	if (param.route == 'skill') {
		try {
			const res = await request('GET', '/v2/auth/whoami', {});
			return (res.status == 200) ? { ok: true } : { ok: false, category: 'unknown' };
		} catch (e) {
			return { ok: false, category: categoryOf(e) };
		};
	};

	const path = `/mcp/${param.tier}`;
	const stateful = (param.tier != 'full');
	const jsonHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };

	let session = '';
	let negotiated = PROBE_PROTOCOL_VERSION;

	try {
		// The session id is taken from the headers before the body is read, so a body that fails
		// still leaves a session the finally block can delete
		const init = await request('POST', path, jsonHeaders, {
			jsonrpc: '2.0',
			id: 1,
			method: 'initialize',
			params: { protocolVersion: PROBE_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'anytype-desktop', version: opt.version || '0.0.0' } },
		}, (status, headers) => {
			if (stateful && (status == 200)) {
				session = headers['mcp-session-id'] || '';
			};
		});
		const initBody = parseBody(init.text);

		if ((init.status != 200) || !initBody?.result) {
			throw new ProbeError('unknown');
		};

		negotiated = String(initBody.result.protocolVersion || PROBE_PROTOCOL_VERSION);

		const follow: Record<string, string> = { ...jsonHeaders, 'MCP-Protocol-Version': negotiated };

		if (stateful) {
			if (!session) {
				throw new ProbeError('unknown');
			};
			follow['Mcp-Session-Id'] = session;
		};

		const notified = await request('POST', path, follow, { jsonrpc: '2.0', method: 'notifications/initialized' });
		if (![ 200, 202 ].includes(notified.status)) {
			throw new ProbeError('unknown');
		};

		const list = await request('POST', path, follow, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
		const tools = parseBody(list.text)?.result?.tools;

		if ((list.status != 200) || !Array.isArray(tools) || !tools.length) {
			throw new ProbeError('unknown');
		};

		return { ok: true };
	} catch (e) {
		return { ok: false, category: categoryOf(e) };
	} finally {
		if (stateful && session) {
			try {
				await request('DELETE', path, { 'MCP-Protocol-Version': negotiated, 'Mcp-Session-Id': session });
			} catch (e) { /* ignored */ };
		};
	};
};
