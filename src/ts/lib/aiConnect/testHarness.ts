/**
 * Test support only (imported by *.test.ts, never by the app): a fake heart (`C`), a fake main (`Renderer`)
 * with the real IPC result shapes, the `S` globals, and deferred replies for any call, so tests can drive the
 * flows and the popup controller exactly as the app does.
 */
import { vi } from 'vitest';
import { AiConnectStore } from '../../store/aiConnect';
import type { AiConnection, AiDetection, AiPlan } from '../../interface/aiConnect';
import * as flow from './flow';

export const GRANT = { spaceIds: [], allSpaces: true, perm: 1 };
export const READ_ONE = { spaceIds: [ 'space-1' ], allSpaces: false, perm: 0 };
export const SENTINEL = 'SENTINEL';

export interface Row { hash: string; apiKey: string; name: string; createdAt?: number; grant: any; expireAt: number };

export const deferred = <T = any>() => {
	let resolve: (v?: T) => void;
	const promise = new Promise<T>(r => { resolve = r; });

	return { promise, resolve };
};

/** Lets every queued microtask and zero-delay timer run, until `fn` holds */
export const until = async (fn: () => boolean, rounds = 300): Promise<boolean> => {
	for (let i = 0; (i < rounds) && !fn(); i++) {
		await new Promise(r => setTimeout(r, 0));
	};
	return fn();
};

/**
 * heart's key lists, one per account: every call works on the list of the session signed in at that moment
 * (`auth.account.id`), as heart's session-bound RPCs do. Switch accounts with `h.auth.account = { id }`.
 */
export const makeHeart = (auth: { account?: { id: string } } = { account: { id: 'acc-1' } }) => {
	const lists = new Map<string, Map<string, Row>>();
	const rowsOf = (accountId: string): Map<string, Row> => {
		if (!lists.has(accountId)) {
			lists.set(accountId, new Map());
		};
		return lists.get(accountId);
	};
	const current = () => rowsOf(String(auth.account?.id || ''));
	const hidden = new Map<string, number>();
	const state = {
		seq: 0,
		/** Lookups that don't see a freshly created row yet */
		hideNewFor: 0,
		listFails: false,
		/** heart refuses CreateApp: no key exists afterwards */
		createFails: false,
		revokeFails: new Set<string>(),
		/** RevokeApp never reaches heart: grpc-web answers its own code (HTTP 400 → 3), which the dispatcher marks `transport` */
		revokeTransport: new Set<string>(),
		creates: 0,
		lists: 0,
		revokes: [] as string[],
		/** `<account>:<hash>` per RevokeApp: the session each revoke ran under */
		revokedUnder: [] as string[],
		/** The account signed in at each CreateApp */
		createdUnder: [] as string[],
		/** Holds the next successful RevokeApp: called with the answer to give it later */
		revokeHold: null as null | ((answer: () => void) => void),
		updates: [] as { hash: string; grant: any }[],
		order: [] as string[],
	};
	/** Holds the next CreateApp / ListApps answer until released */
	const gate = { hold: false, release: null as null | (() => void), holdList: false, releaseList: null as null | (() => void) };
	const later = (fn: () => void) => queueMicrotask(fn);

	const C = {
		AccountLocalLinkCreateApp: (app: any, cb: any) => {
			state.creates++;
			state.order.push('CreateApp');
			state.createdUnder.push(String(auth.account?.id || ''));
			if (state.createFails) {
				later(() => cb({ error: { code: 1 } }));
				return;
			};

			const n = ++state.seq;
			const key = `${SENTINEL}-key-${n}-abcdefghijklmnop`;
			const hash = `hash-${n}`;

			current().set(hash, { hash, apiKey: key, name: app.name, createdAt: Math.floor(Date.now() / 1000), grant: app.grant, expireAt: app.expireAt || 0 });
			if (state.hideNewFor) {
				hidden.set(hash, state.hideNewFor);
			};
			if (gate.hold) {
				gate.hold = false;
				gate.release = () => cb({ error: { code: 0 }, key });
				return;
			};
			later(() => cb({ error: { code: 0 }, key }));
		},
		AccountLocalLinkListApps: (cb: any) => {
			state.lists++;
			state.order.push('ListApps');

			// The session that asked: a held answer still lists that account's keys
			const rows = current();
			const answer = () => {
				if (state.listFails) {
					cb({ error: { code: 1 } });
					return;
				};

				const list = [ ...rows.values() ].filter(r => {
					const left = hidden.get(r.hash) || 0;

					if (left > 0) {
						hidden.set(r.hash, left - 1);
						return false;
					};
					return true;
				}).map(r => ({ ...r }));

				cb({ error: { code: 0 }, list });
			};

			if (gate.holdList) {
				gate.holdList = false;
				gate.releaseList = answer;
				return;
			};
			later(answer);
		},
		AccountLocalLinkRevokeApp: (hash: string, cb: any) => {
			const rows = current();

			state.revokes.push(hash);
			state.revokedUnder.push(`${auth.account?.id}:${hash}`);
			state.order.push(`RevokeApp:${hash}`);
			if (state.revokeHold) {
				const go = state.revokeHold;

				state.revokeHold = null;
				go(() => {
					rows.delete(hash);
					cb({ error: { code: 0 } });
				});
				return;
			};
			if (state.revokeTransport.has(hash)) {
				later(() => cb({ error: { code: 3, description: 'Bad Request', transport: true } }));
				return;
			};
			if (state.revokeFails.has(hash)) {
				later(() => cb({ error: { code: 1 } }));
				return;
			};
			if (!rows.has(hash)) {
				later(() => cb({ error: { code: 3 } }));
				return;
			};
			rows.delete(hash);
			later(() => cb({ error: { code: 0 } }));
		},
		AccountLocalLinkUpdateApp: (hash: string, grant: any, cb: any) => {
			state.updates.push({ hash, grant });

			const row = current().get(hash);

			if (row) {
				row.grant = grant;
			};
			later(() => cb({ error: { code: row ? 0 : 1 } }));
		},
	};

	/** A key that exists already (an earlier connection's) */
	const add = (hash: string, grant: any = GRANT, expireAt = 0, name = 'Cursor'): Row => {
		const row = { hash, apiKey: `${SENTINEL}-old-${hash}-abcdefghijklmnop`, name, grant, expireAt };

		current().set(hash, row);
		return row;
	};

	return {
		C, state, add, gate, rowsOf,
		/** The signed-in account's keys */
		get rows () {
			return current();
		},
	};
};

export const BASE_PLAN: AiPlan = {
	appId: 'cursor', targetId: 'cursor', route: 'http', tier: 'large', method: 'config', nextStep: 'restart',
	displayTarget: '~/.cursor/mcp.json', canApply: true, existing: 'none', sentenceKey: 'aiConnectPlanConfigRestart',
	instructions: { restart: 'aiConnectStepRestart', afterRestart: 'aiConnectHintCursor' },
	steps: [ { textKey: 'aiConnectManualOpen', args: [ '~/.cursor/mcp.json' ], path: '/Users/me/.cursor/mcp.json' }, { textKey: 'aiConnectManualMerge', snippet: '{"Authorization":"Bearer <KEY>"}', lang: 'json' } ],
	targetPath: '/Users/me/.cursor/mcp.json',
};

export const DETECTIONS: AiDetection[] = [
	{ appId: 'cursor', installed: true, targetId: 'cursor', targetPaths: [ '/Users/me/.cursor/mcp.json' ], canRestart: true },
	{ appId: 'lmstudio', installed: true, targetId: 'lmstudio', targetPaths: [ '/Users/me/.lmstudio/mcp.json' ], canRestart: false },
	{ appId: 'claude-desktop', installed: true, targetId: 'claude-desktop', targetPaths: [ '/Users/me/.anytype/ai-connect/claude-desktop.json' ], canRestart: true },
];

export const record = (over: any = {}): any => ({
	id: 'cursor', appId: 'cursor', accountId: 'acc-1', appHash: 'hash-old', keyFp: '0123456789abcdef', name: 'Cursor',
	route: 'http', tier: 'large', recommendedTier: 'large', method: 'config', targetPath: '/Users/me/.cursor/mcp.json',
	port: 31009, createdAt: 1, grant: GRANT, expireAt: 0, nextStep: 'none', observedInstalled: true, lastProbe: 'ok',
	revokePending: [], removed: false, createdDirs: [], ...over,
});

const union = (a: string[], b: string[]) => [ ...new Set([ ...(a || []), ...(b || []) ]) ];

export const makeMain = () => {
	const records = new Map<string, any>();
	const orphans = new Set<string>();
	const calls: { cmd: string; param: any }[] = [];
	/** Mint intents main holds: saved before CreateApp, cleared when the key is delivered or released */
	const intents = new Map<string, { id: string; accountId: string; name: string; time: number }>();
	const m = {
		records,
		orphans,
		calls,
		intents,
		/** Intents an earlier run left (main reports them in the list) */
		staleIntents: [] as { id: string; name: string; time: number }[],
		/** Main can't save a mint intent: no key may be created */
		intentFails: false,
		intentSeq: 0,
		detections: DETECTIONS.slice() as AiDetection[],
		/** The plan of a card (BASE_PLAN with its app id by default) */
		plans: {} as Record<string, AiPlan>,
		/** Replaces the default apply */
		apply: null as null | ((p: any) => any),
		/** Replaces the default record-manual */
		recordManual: null as null | ((p: any) => any),
		removeConflict: false,
		orphanFails: false,
		stepDoneFails: false,
		checkUnsaved: false,
		listFails: false,
		/** Called during each check, before the records are read (a test changes a record there) */
		onCheck: null as null | (() => void),
		statuses: new Map<string, string>(),
		/** The profile's one nudge claim (registry `nudgeClaimed`) */
		nudgeClaimed: false,
		/** Main's sender gate refuses the claim (a background tab, an unfocused window): no answer */
		claimDenied: false,
		/** Main's sender gate refuses every call (this tab isn't the active one): no answer */
		denied: false,
		/** Holds the next answer to a command until resolved */
		hold: {} as Record<string, { promise: Promise<any>; resolve: (v?: any) => void }>,
	};

	/** Records whose current absence was reported (main keeps it on the record: removedReported) */
	const reported = new Set<string>();
	const view = (r: any): AiConnection => ({ ...r, status: m.statuses.get(r.id) || (r.removed ? 'removed' : 'ok'), displayTarget: r.targetPath ? '~/x' : '' });
	const list = () => [ ...records.values() ].map(view);
	const planFor = (appId: string): AiPlan => m.plans[appId] || { ...BASE_PLAN, appId: appId as any };

	const deliver = (id: string, p: any, method: string) => {
		const rec = records.get(id);

		if (((rec?.appHash ?? null) !== p.expectedHash) || rec?.removed) {
			return { ok: false, error: { stage: 'validate', category: 'stale' } };
		};

		// Main's recordManual (index.ts): every earlier hash, candidates included, goes to revokePending and
		// `unconfirmed` is dropped; apply keeps the candidates
		const manual = (method == 'manual');
		const earlier = manual ? [ rec?.appHash, ...(rec?.unconfirmed || []).map((c: any) => c.appHash) ] : [ rec?.appHash ];
		const next = record({
			...(rec || {}), id, appId: p.appId, appHash: p.appHash, name: p.name, grant: p.grant, expireAt: p.expireAt, tier: p.tier,
			route: p.route, method, nextStep: manual ? 'none' : 'restart', lastProbe: 'none', removed: false, port: p.port,
			keyFp: manual ? '' : 'fedcba9876543210',
			revokePending: union(rec?.revokePending || [], earlier.filter(h => h && (h != p.appHash))),
		});

		if (manual) {
			delete next.unconfirmed;
		};
		records.set(id, next);
		// The key belongs to a record now: its mint intent has done its job
		intents.delete(p.intentId);
		return { ok: true, connection: view(next) };
	};

	const handlers: Record<string, (p: any) => any> = {
		aiConnectList: () => m.listFails ? { ok: false, error: { stage: 'read', category: 'unknown' } } : ({ ok: true, scanOk: true, detections: m.detections, connections: list(), orphanHashes: [ ...orphans ], mintIntents: m.staleIntents.slice() }),
		aiConnectMintIntent: p => {
			if (p.done) {
				intents.delete(p.id);
				m.staleIntents = m.staleIntents.filter(it => it.id != p.id);
				return { ok: true, id: p.id };
			};
			// As main's registry: a 65th unresolved intent is refused, never evicting one (Q6)
			if (m.intentFails || (intents.size >= 64)) {
				return { ok: false, error: { stage: 'write', category: 'unsaved' } };
			};

			const id = (++m.intentSeq).toString(16).padStart(16, '0');

			intents.set(id, { id, accountId: p.accountId, name: p.name, time: p.time });
			return { ok: true, id };
		},
		aiConnectPlan: p => ({ ok: true, ...planFor(p.appId), route: planFor(p.appId).route || p.route, tier: p.tier }),
		aiConnectApply: p => m.apply ? m.apply(p) : deliver((p.appId == 'cursor') ? 'cursor' : p.appId, p, p.manual ? 'keyfile' : 'config'),
		aiConnectRecordManual: p => m.recordManual ? m.recordManual(p) : deliver(p.connectionId || ((p.appId == 'other') ? 'other-0a1b2c3d' : p.appId), p, 'manual'),
		aiConnectRemove: p => {
			const rec = records.get(p.connectionId);

			if (!rec || (rec.appHash !== p.expectedHash)) {
				return { ok: false, error: { stage: 'validate', category: 'stale' } };
			};
			if (m.removeConflict && !p.forget) {
				return { ok: false, error: { stage: 'validate', category: 'conflict' } };
			};
			if (rec.removed) {
				return { ok: true, connection: view(rec), removedNow: false };
			};

			const next = { ...rec, removed: true, revokePending: union(rec.revokePending, [ rec.appHash ]) };

			delete next.unconfirmed;
			records.set(rec.id, next);
			return { ok: true, connection: view(next), removedNow: true };
		},
		aiConnectRevoked: p => {
			const rec = records.get(p.connectionId);

			if (!rec) {
				return { ok: false, error: { stage: 'validate', category: 'unknown' } };
			};

			const next = { ...rec, revokePending: rec.revokePending.filter((h: string) => h != p.hash) };

			if (next.removed && !next.revokePending.length) {
				records.delete(rec.id);
				return { ok: true, connection: null };
			};
			records.set(rec.id, next);
			return { ok: true, connection: view(next) };
		},
		aiConnectOrphan: p => {
			if (m.orphanFails && !p.done) {
				return { ok: false, error: { stage: 'write', category: 'unsaved' } };
			};
			// As main (S3): a recovery hash is refused while a record or a candidate owns it, or a mint of this run
			// for the same name is unresolved
			const stale = p.intentId ? m.staleIntents.find(it => it.id == p.intentId) : null;
			const owned = [ ...records.values() ].some(r => (r.appHash == p.hash) || (r.unconfirmed || []).some((c: any) => c.appHash == p.hash));

			if (p.intentId && (!stale || owned || [ ...intents.values() ].some(it => it.name === stale.name))) {
				return { ok: false, error: { stage: 'validate', category: 'stale' } };
			};
			if (p.done) {
				orphans.delete(p.hash);
			} else {
				orphans.add(p.hash);
			};
			return { ok: true };
		},
		aiConnectCheck: p => {
			m.onCheck?.();
			if (m.checkUnsaved) {
				return { ok: false, error: { stage: 'write', category: 'unsaved' } };
			};
			// As main: a key list never clears a pending revocation or an orphan (only aiConnectRevoked / aiConnectOrphan
			// do, after RevokeApp answered); a removed record with nothing pending is deleted
			for (const rec of [ ...records.values() ]) {
				if (rec.removed && !rec.revokePending.length) {
					records.delete(rec.id);
				};
			};
			// Main names an entry found gone once per absence (Z12)
			const now = list();
			const removed = now.filter(c => !c.removed && (c.status == 'removed') && !reported.has(c.id)).map(c => c.id);

			removed.forEach(id => reported.add(id));
			now.filter(c => c.status != 'removed').forEach(c => reported.delete(c.id));
			return { ok: true, connections: now, healed: [], removed };
		},
		aiConnectProbe: () => ({ ok: true }),
		aiConnectStepDone: p => {
			if (m.stepDoneFails) {
				return { ok: false, error: { stage: 'write', category: 'unsaved' } };
			};

			const rec = { ...records.get(p.connectionId), nextStep: 'none' };

			records.set(rec.id, rec);
			return { ok: true, connection: view(rec) };
		},
		aiConnectUpdate: p => {
			const rec = records.get(p.connectionId);

			if (rec.method == 'manual') {
				return { ok: false, error: { stage: 'validate', category: 'unsupportedForm' } };
			};

			const next = { ...rec, tier: p.tier };

			records.set(rec.id, next);
			return { ok: true, connection: view(next) };
		},
		aiConnectClaimNudge: () => {
			if (m.claimDenied) {
				return null;
			};

			// Main refuses the claim while the account has any connection (Z9)
			if (m.records.size) {
				return { claimed: false };
			};

			const claimed = !m.nudgeClaimed;

			m.nudgeClaimed = true;
			return { claimed };
		},
		aiConnectRestartApp: () => ({ ok: true }),
		aiConnectOpenApp: () => ({ ok: true }),
		aiConnectReveal: () => ({ ok: true }),
	};

	const send = vi.fn(async (cmd: string, param: any) => {
		calls.push({ cmd, param: JSON.parse(JSON.stringify(param)) });

		if (m.denied) {
			return null;
		};

		const held = m.hold[cmd];

		if (held) {
			delete m.hold[cmd];

			const over = await held.promise;

			if (over !== undefined) {
				return over;
			};
		};
		return handlers[cmd] ? handlers[cmd](param) : null;
	});

	/** The next `cmd` waits until `resolve()` (or answers with what `resolve(value)` passes) */
	const holdNext = (cmd: string) => {
		const d = deferred<any>();

		m.hold[cmd] = d;
		return d;
	};

	return { m, send, view, holdNext };
};

export type Harness = {
	heart: ReturnType<typeof makeHeart>;
	main: ReturnType<typeof makeMain>;
	auth: any;
	store: AiConnectStore;
	listening: (on: boolean, port?: number) => void;
	calls: (cmd: string) => { cmd: string; param: any }[];
	cmds: () => string[];
	existing: (over?: any) => AiConnection;
	/** analytics.event calls: [ code, data ] */
	events: () => [ string, any ][];
};

/** Installs the fakes as the app's globals; call in beforeEach (vi.unstubAllGlobals in afterEach) */
export const installHarness = (): Harness => {
	const auth: any = { account: { id: 'acc-1' }, localApiConfig: { enabled: true, port: 31009 }, jsonApiStatus: null };
	const heart = makeHeart(auth);
	const main = makeMain();
	const store = new AiConnectStore();

	store.ensureAccount(auth.account.id);
	const listening = (on: boolean, port = 31009) => {
		auth.jsonApiStatus = on ? { success: true, listenAddr: `127.0.0.1:${port}`, error: '' } : null;
		auth.localApiConfig = { enabled: on, port };
	};

	listening(true);
	vi.stubGlobal('C', heart.C);
	vi.stubGlobal('Renderer', { send: main.send });
	vi.stubGlobal('S', { Auth: auth, AiConnect: store });
	const analyticsEvent = vi.fn();

	vi.stubGlobal('analytics', { event: analyticsEvent });
	(window as any).Electron = { aiConnect: true };

	flow.flowConfig.lookupDelay = 0;
	flow.flowConfig.pollInterval = 0;
	flow.flowConfig.pollTimeout = 200;
	flow.flowConfig.rpcTimeout = 30000;
	flow.resetFlowForTests();

	const existing = (over: any = {}): AiConnection => {
		const rec = record(over);

		main.m.records.set(rec.id, rec);
		store.upsert(main.view(rec));
		return main.view(rec);
	};

	return {
		heart, main, auth, store, listening, existing,
		events: () => analyticsEvent.mock.calls as [ string, any ][],
		calls: (cmd: string) => main.m.calls.filter(it => it.cmd == cmd),
		cmds: () => main.m.calls.map(it => it.cmd),
	};
};
