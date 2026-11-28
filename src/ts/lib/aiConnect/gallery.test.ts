import { describe, expect, test } from 'vitest';
import { AiConnectStore } from 'Store/aiConnect';
import type { AiAppCatalogItem, AiConnection, AiDetection } from '../../interface/aiConnect';
import { CATALOG } from './catalog';
import { buildGallery, connectionState, movedConnection, type GalleryInput } from './gallery';
import { FIXTURE_CONNECTION, FIXTURE_MANUAL_CONNECTION } from './ipcFixtures';

const nameOf = (item: AiAppCatalogItem) => item.name || item.nameKey;

const det = (appId: string, over: Partial<AiDetection> = {}): AiDetection => ({
	appId: appId as any, installed: true, targetId: appId as any, targetPaths: [ `/Users/me/${appId}` ], canRestart: false, ...over,
});

const conn = (over: Partial<AiConnection> = {}): AiConnection => ({ ...FIXTURE_CONNECTION, nextStep: 'none', ...over });

const gallery = (over: Partial<GalleryInput> = {}) => buildGallery({
	catalog: CATALOG, detections: {}, connections: [], scanOk: true, isDesktop: true, loaded: true, apiListening: true, query: '', nameOf, ...over,
});

const CURSOR = det('cursor', { targetPaths: [ FIXTURE_CONNECTION.targetPath ] });

describe('gallery', () => {
	test('row states by connection status', () => {
		expect(connectionState(conn())).toBe('added');
		expect(connectionState(conn({ firstUsedAt: 1 }))).toBe('connected');
		expect(connectionState(conn({ nextStep: 'restart' }))).toBe('finish');
		expect(connectionState(conn({ status: 'pending' }))).toBe('pending');
		expect(connectionState(conn({ lastProbe: 'unauthorized', nextStep: 'restart' }))).toBe('probeFailed');
		expect(connectionState(conn({ status: 'conflict', nextStep: 'restart' }))).toBe('conflict');
		expect(connectionState(conn({ status: 'notInstalled' }))).toBe('gone');
		expect(connectionState(conn({ status: 'revokeFailed', removed: true }))).toBe('revokeFailed');
		// V5: main's status right after Disconnect is 'removed'; the record still waits for its revoke
		expect(connectionState(conn({ status: 'removed', removed: true, revokePending: [ 'h' ] }))).toBe('revokeFailed');
		// V16: an unconfirmed CLI write waits, even with a next step
		expect(connectionState(conn({ status: 'pending', nextStep: 'newSession', unconfirmed: [ { appHash: 'h2' } as any ] }))).toBe('checking');
	});

	test('V5: a removed record with outstanding hashes is a Retry row at once', () => {
		const g = gallery({ detections: { cursor: CURSOR }, connections: [ conn({ removed: true, status: 'removed', revokePending: [ 'h' ] }) ] });

		expect(g.connected).toHaveLength(1);
		expect(g.connected[0]).toMatchObject({ state: 'revokeFailed', actions: [ { id: 'retry' } ], status: { key: 'aiAppsStatusRevokeFailed' } });
	});

	test('V21: nothing read yet, or a failed scan: absence is unknown, not "Not on this computer"', () => {
		const unread = gallery({ loaded: false });

		expect(unread.nothingDetected).toBe(false);
		expect(unread.other.find(it => it.appId == 'cursor')).toMatchObject({ state: 'unknown', status: { key: 'aiAppsStatusUnknown' }, actions: [ { id: 'setUpManually' } ] });
		expect(gallery({ scanOk: false }).other.find(it => it.appId == 'codex').state).toBe('unknown');
	});

	test('sections: connected, on this computer, other apps; Other app last', () => {
		const g = gallery({
			detections: { cursor: CURSOR, 'claude-code': det('claude-code'), 'chatgpt-classic': det('chatgpt-classic') },
			connections: [ conn(), FIXTURE_MANUAL_CONNECTION ],
		});

		expect(g.connected.map(it => it.id)).toEqual([ 'cursor', 'other-0a1b2c3d' ]);
		expect(g.detected.map(it => it.appId)).toEqual([ 'claude-code', 'chatgpt-classic' ]);
		expect(g.other.map(it => it.appId).pop()).toBe('other');
		expect(g.other.some(it => it.appId == 'cursor')).toBe(false);
		expect(g.detected[0]).toMatchObject({ state: 'connect', status: { key: 'aiAppCoversClaudeCode' }, actions: [ { id: 'connect', disabled: false } ] });
		expect(g.detected[1]).toMatchObject({ state: 'unsupported', status: { key: 'aiAppsStatusCantConnect' }, actions: [ { id: 'details' } ] });
		expect(g.connected[1]).toMatchObject({ name: 'Other app', state: 'added' });
	});

	test('the Gemini app\'s card is listed only when the app is on this computer (and the scan can tell)', () => {
		const all = (g: ReturnType<typeof gallery>) => [ ...g.connected, ...g.detected, ...g.other ].map(it => it.appId);

		expect(all(gallery())).not.toContain('gemini');
		expect(all(gallery({ isDesktop: false }))).not.toContain('gemini');
		expect(all(gallery({ detections: { gemini: det('gemini') }, scanOk: false }))).not.toContain('gemini');
		// Search can't find it either
		expect(gallery({ query: 'gemini' }).other.map(it => it.appId)).toEqual([ 'gemini-cli', 'antigravity' ]);

		const found = gallery({ detections: { gemini: det('gemini', { targetId: undefined, targetPaths: [] }) } });

		expect(found.detected.find(it => it.appId == 'gemini')).toMatchObject({ state: 'unsupported', status: { key: 'aiAppsStatusCantConnect' }, actions: [ { id: 'details' } ] });
		// The new app cards are ordinary Connect cards
		expect(gallery({ detections: { 'gemini-cli': det('gemini-cli'), opencode: det('opencode'), antigravity: det('antigravity') } }).detected.map(it => [ it.appId, it.state ]))
			.toEqual([ [ 'gemini-cli', 'connect' ], [ 'antigravity', 'connect' ], [ 'opencode', 'connect' ] ]);
	});

	test('Hermes: not here → Get app and Set up on another machine; here → Connect', () => {
		expect(gallery().other.find(it => it.appId == 'hermes')).toMatchObject({ state: 'notInstalled', actions: [ { id: 'getApp' }, { id: 'setUpRemote' } ] });
		expect(gallery({ detections: { hermes: det('hermes') } }).detected.find(it => it.appId == 'hermes')).toMatchObject({ state: 'connect', actions: [ { id: 'connect' }, { id: 'setUpRemote' } ] });
	});

	test('H17: an installed Hermes with the Local API off still offers the guide for another machine', () => {
		expect(gallery({ apiListening: false, detections: { hermes: det('hermes') } }).detected.find(it => it.appId == 'hermes').actions).toEqual([ { id: 'connect', disabled: true }, { id: 'setUpRemote', disabled: false } ]);
	});

	test('a not installed card offers Get app and Set up manually', () => {
		const row = gallery().other.find(it => it.appId == 'cursor');

		expect(row).toMatchObject({ state: 'notInstalled', status: { key: 'aiAppsNotInstalled' } });
		expect(row.actions.map(it => it.id)).toEqual([ 'getApp', 'setUpManually' ]);
	});

	test('a shared target is one connected row; the sibling card says it uses the same settings', () => {
		const path = '/Users/me/.codex/config.toml';
		const g = gallery({
			detections: { chatgpt: det('chatgpt', { targetId: 'codex', targetPaths: [ path ] }), codex: det('codex', { targetId: 'codex', targetPaths: [ path ] }) },
			connections: [ conn({ id: 'codex', appId: 'chatgpt', targetPath: path, name: 'ChatGPT' }) ],
		});

		expect(g.connected).toHaveLength(1);
		expect(g.connected[0]).toMatchObject({ name: 'ChatGPT', alsoIn: [ 'Codex' ] });
		expect(g.detected.find(it => it.appId == 'codex')).toMatchObject({ state: 'shared', status: { key: 'aiAppsStatusShared', args: [ 'ChatGPT' ] }, actions: [ { id: 'manage' } ] });
	});

	test('a moved Codex home: the old row stays and the card is offered for the new place', () => {
		const old = conn({ id: 'codex-home-11111111', appId: 'codex', targetPath: '/Users/me/a/config.toml', status: 'reconnect' });
		const detections = { codex: det('codex', { targetId: 'codex-home-22222222', targetPaths: [ '/Users/me/b/config.toml' ] }) };
		const g = gallery({ detections, connections: [ old ] });

		expect(g.connected.map(it => it.state)).toEqual([ 'reconnect' ]);
		expect(g.detected.find(it => it.appId == 'codex')).toMatchObject({ state: 'connect' });
		expect(movedConnection('codex', detections, [ old ])?.id).toBe('codex-home-11111111');
	});

	test('the API off disables Connect, Fix, Continue and Retry check only', () => {
		const g = gallery({
			apiListening: false,
			detections: { cursor: CURSOR, 'claude-code': det('claude-code'), lmstudio: det('lmstudio') },
			connections: [
				conn({ status: 'conflict' }),
				conn({ id: 'lmstudio', appId: 'lmstudio', targetPath: '/Users/me/lmstudio', status: 'revokeFailed', removed: true, revokePending: [ 'h' ] }),
			],
		});

		expect(g.connected.map(it => it.actions[0])).toEqual([ { id: 'fix', disabled: true }, { id: 'retry', disabled: false } ]);
		expect(g.detected[0].actions[0]).toEqual({ id: 'connect', disabled: true });
	});

	test('the scan failed: every card under Other apps', () => {
		const g = gallery({ scanOk: false, detections: { cursor: CURSOR } });

		expect(g.detected).toEqual([]);
		expect(g.nothingDetected).toBe(false);
		expect(g.other.find(it => it.appId == 'cursor').state).toBe('connect');
	});

	test('nothing detected, a search with no match, not desktop', () => {
		expect(gallery().nothingDetected).toBe(true);
		expect(gallery({ query: 'copilot' }).other.map(it => it.appId)).toEqual([ 'vscode' ]);
		expect(gallery({ query: 'zzz' }).searchEmpty).toBe(true);

		const web = gallery({ isDesktop: false });

		expect(web.nothingDetected).toBe(false);
		expect(web.other.every(it => !it.actions.length)).toBe(true);
	});

	test('removed records with nothing outstanding are not listed', () => {
		const g = gallery({ detections: { cursor: CURSOR }, connections: [ conn({ removed: true, status: 'removed' }) ] });

		expect(g.connected).toEqual([]);
	});
});

describe('store', () => {
	test('getByApp maps by target id and canonical path; getById addresses any record', () => {
		const store = new AiConnectStore();

		store.set({ ok: true, scanOk: true, detections: [ CURSOR ], connections: [ conn(), FIXTURE_MANUAL_CONNECTION ], orphanHashes: [] });

		expect(store.getByApp('cursor')?.id).toBe('cursor');
		expect(store.getById('other-0a1b2c3d')?.appId).toBe('other');
		expect(store.others().map(it => it.id)).toEqual([ 'other-0a1b2c3d' ]);
		expect(store.isInstalled('cursor')).toBe(true);
		expect(store.atTarget('cursor')?.appHash).toBe('hash-1');

		store.upsert(conn({ targetPath: '/elsewhere' }));
		expect(store.getByApp('cursor')).toBeNull();
		expect(store.atTarget('cursor')?.targetPath).toBe('/elsewhere');

		store.remove('cursor');
		expect(store.getById('cursor')).toBeNull();
		store.clear();
		expect(store.connections).toEqual([]);
		expect(store.isLoaded).toBe(false);
	});

	test('siblings: other installed cards on the same record', () => {
		const store = new AiConnectStore();
		const path = '/Users/me/.codex/config.toml';
		const c = conn({ id: 'codex', appId: 'chatgpt', targetPath: path });

		store.set({
			ok: true, scanOk: true, orphanHashes: [], connections: [ c ],
			detections: [ det('chatgpt', { targetId: 'codex', targetPaths: [ path ] }), det('codex', { targetId: 'codex', targetPaths: [ path ] }) ],
		});

		expect(store.siblings(c)).toEqual([ 'codex' ]);
		expect(store.getByApp('codex')?.id).toBe('codex');
	});
});
