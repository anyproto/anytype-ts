/**
 * The endpoint file (tokens-plan §2.2, §3.2): `<home>/.anytype/ai-connect/endpoint.json` (`endpoint-dev.json` for a
 * development build), `{"v":1,"port":N}`. The forwarder reads it before every authenticated request and sends
 * nothing while it can't; the desktop is its only writer, and `syncEndpoint` is the only function that writes it.
 *
 * Written only while the Local API listens on a port reachable at 127.0.0.1 (heart's last bind on `127.0.0.1` or
 * `0.0.0.0`, as `liveApiListening` says) and an account is open; in every other state the file is deleted when it
 * names the port this instance published (another instance's file is left alone). At start it is deleted
 * whatever it says.
 */
import type { AiError, Ctx, Env } from './types';
import { isValidPort } from '../../../../src/ts/lib/aiConnect/catalog';
import { liveApiListening } from './validate';
import { bundleDir, ensureStoreDir } from './bundle';
import { buildMeta, endpointVerdict } from './forwarder';
import { MODE_SECRET, pathOf, tempName, tryUnlink } from './fsSafe';

/** The state syncEndpoint publishes: the renderer's shared settings and whether an account is open */
export interface ApiState {
	localApi: any;
	bind: any;
	account: boolean;
};

const MAX_BYTES = 256;

/**
 * Windows: a rename over the endpoint file fails (`EPERM` / `EBUSY`) while any handle to it is open, and the
 * forwarder reads it every 5 s. The writer retries for a short while, then fails visibly
 */
export const RENAME_ATTEMPTS = 10;
export const RENAME_RETRY_MS = 50;

const busy = (env: Env, e: any): boolean => (env.platform == 'win32') && [ 'EPERM', 'EBUSY' ].includes(e?.code);

export const endpointFile = (env: Env): string => pathOf(env).join(bundleDir(env), buildMeta(env)?.signed ? 'endpoint.json' : 'endpoint-dev.json');

/**
 * heart's bind address as `host:port` (`[v6]:port` too); the port only when the host lets 127.0.0.1 reach it.
 * The whole address is parsed: an IPv6-only bind publishes nothing
 */
export const reachablePort = (addr: any): number => {
	const m = /^(\[[^\]]*\]|[^:]+):(\d{1,5})$/.exec(String(addr || ''));
	const port = m ? Number(m[2]) : 0;

	return (m && [ '127.0.0.1', '0.0.0.0' ].includes(m[1]) && isValidPort(port)) ? port : 0;
};

/** The port the file should name now; 0: none */
export const publishablePort = (state: ApiState): number => {
	const port = state.account ? reachablePort(state.bind?.addr) : 0;
	return (port && liveApiListening(port, state.localApi, state.bind)) ? port : 0;
};

/** The port the endpoint file names now; 0 when it is missing or not in the format; null when it can't be read */
export const readEndpoint = (env: Env): number | null => {
	const res = env.readFile(endpointFile(env), MAX_BYTES, { noFollow: true });
	let data: any = null;

	if (!('data' in res) && (res.error != 'missing')) {
		return null;
	};
	try {
		data = ('data' in res) ? JSON.parse(res.data.toString('utf8')) : null;
	} catch (e) { /* invalid */ };

	return ((data?.v === 1) && isValidPort(data.port)) ? data.port : 0;
};

/**
 * The file stops naming `published` (the port this instance wrote last; null: none). Synchronous. Returns what this
 * instance still owns: null once the file is confirmed gone or names another instance's port; `published` when it
 * couldn't be read or removed (the next call retries)
 */
export const withdrawEndpoint = (env: Env, published: number | null, log?: (code: string) => void): number | null => {
	if (published === null) {
		return null;
	};

	const now = readEndpoint(env);

	// Ours is forgotten only once it is confirmed gone (or replaced by another instance's port); else the next call retries
	if (now === null) {
		log?.('EREAD');
		return published;
	};
	if (now == published) {
		try {
			env.unlink(endpointFile(env));
		} catch (e) {
			if ((e as any)?.code != 'ENOENT') {
				log?.(String((e as any)?.code || 'error'));
				return published;
			};
		};
	};
	return null;
};

/**
 * Makes the file match `state`. `published`: the port this instance wrote last (null: none). Returns the port
 * it published now (null: none). Never throws; a write that failed is reported through `log` (its error code).
 * `live(port)` is asked right before every rename (each Windows retry too): false (a logout, quit or API change
 * since this call started) discards the staged file, and nothing started before that change lands after it.
 */
export const syncEndpoint = async (env: Env, state: ApiState, published: number | null, log?: (code: string) => void, live?: (port: number) => boolean): Promise<number | null> => {
	const port = publishablePort(state);
	const file = endpointFile(env);

	if (!port) {
		return withdrawEndpoint(env, published, log);
	};
	if ((published === port) && (readEndpoint(env) == port)) {
		return port;
	};
	if (!(await ensureStoreDir(env))) {
		return published;
	};

	const temp = tempName(env, file, 'new');

	try {
		const staged = env.writeFile(temp, JSON.stringify({ v: 1, port }), MODE_SECRET);

		staged.close();
		for (let attempt = 1; ; attempt++) {
			if (live && !live(port)) {
				tryUnlink(env, temp);
				return published;
			};
			try {
				env.rename(temp, file);
				break;
			} catch (e) {
				if (!busy(env, e) || (attempt >= RENAME_ATTEMPTS)) {
					throw e;
				};
				await env.sleep(RENAME_RETRY_MS);
			};
		};
	} catch (e) {
		tryUnlink(env, temp);
		log?.(String((e as any)?.code || 'error'));
		return published;
	};

	// Renamed: the file names this port now, whether or not its folder's fsync succeeds (so it is withdrawn later)
	try {
		env.fsyncDir(pathOf(env).dirname(file));
	} catch (e) {
		log?.(String((e as any)?.code || 'error'));
	};
	return port;
};

/**
 * App start: whatever an earlier run (or a crash) left is gone before any account is selected. A Windows file
 * that is busy is retried like a rename. null: gone; otherwise the port it still names (0: not one), which the
 * caller keeps as published so every later lifecycle call finishes the withdrawal (D1C-25)
 */
export const clearEndpoint = async (env: Env): Promise<number | null> => {
	for (let attempt = 1; ; attempt++) {
		try {
			env.unlink(endpointFile(env));
			return null;
		} catch (e) {
			if ((e as any)?.code == 'ENOENT') {
				return null;
			};
			if (!busy(env, e) || (attempt >= RENAME_ATTEMPTS)) {
				return readEndpoint(env) ?? 0;
			};
			await env.sleep(RENAME_RETRY_MS);
		};
	};
};

/**
 * The preflight of a stdio route (§3.2): the file is brought up to date, then `anytype-mcp endpoint` runs on
 * `file`, the exact binary the app will be told to start, and must find Anytype on the API's port. `denied`
 * is `storeDenied` with the forwarder's rule and path; anything else (missing, invalid, unreachable, another
 * port) is `unreachable`.
 */
export const preflight = async (ctx: Ctx, file: string): Promise<AiError | null> => {
	await ctx.syncEndpoint?.();

	const verdict = await endpointVerdict(ctx.env, file);

	if (!('reason' in verdict)) {
		return (verdict.port == ctx.port) ? null : { stage: 'verify', category: 'unreachable' };
	};

	const where = { ...(verdict.path ? { path: verdict.path } : {}), ...(verdict.rule ? { rule: verdict.rule } : {}) };
	return { stage: 'verify', category: (verdict.reason == 'denied') ? 'storeDenied' : 'unreachable', ...where };
};
