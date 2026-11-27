import { describe, expect, test } from 'vitest';
import { CATALOG, DEFAULT_GRANT, EXPIRY_DAYS, KEY_PLACEHOLDER, TIERS, getCatalogItem, isCatalogId, isValidPort, searchCatalog } from './catalog';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { COVERAGE, IPC_RESULT_FIXTURES } from './ipcFixtures';

describe('catalog', () => {
	test('every Release 1 card and every unsupported card is there, once', () => {
		const ids = CATALOG.map(it => it.id);

		expect(ids).toEqual([
			'claude-desktop', 'claude-code', 'chatgpt', 'codex', 'cursor', 'vscode', 'lmstudio', 'gemini-cli', 'antigravity', 'opencode', 'hermes', 'other',
			'chatgpt-classic', 'chatgpt-web', 'claude-web', 'gemini',
		]);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test('routes, default routes and tiers', () => {
		expect(getCatalogItem('claude-code')).toMatchObject({ routes: [ 'skill', 'http' ], defaultRoute: 'skill' });
		expect(getCatalogItem('claude-desktop')).toMatchObject({ routes: [ 'stdio' ], defaultTier: 'full' });
		expect([ 'claude-code', 'chatgpt', 'codex', 'cursor', 'vscode', 'gemini-cli', 'antigravity', 'opencode', 'hermes', 'other' ].map(id => getCatalogItem(id as any).defaultTier)).toEqual(Array(10).fill('full'));
		expect(getCatalogItem('hermes')).toMatchObject({ kind: 'app', routes: [ 'http' ], remoteSetup: true });
		expect(getCatalogItem('gemini')).toMatchObject({ kind: 'unsupported', offer: [ 'gemini-cli', 'antigravity' ], onlyInstalled: true });
		expect(getCatalogItem('lmstudio').defaultTier).toBe('small');
		expect(getCatalogItem('claude-web')).toMatchObject({ kind: 'unsupported', offer: [ 'claude-desktop', 'claude-code' ] });
		expect(getCatalogItem('other')).toMatchObject({ kind: 'manual', name: '', nameKey: 'aiAppOther', routes: [ 'http', 'stdio' ] });

		for (const item of CATALOG) {
			if ([ 'app', 'manual' ].includes(item.kind)) {
				expect(item.routes[0]).toBe(item.defaultRoute);
			} else {
				expect(item.routes).toEqual([]);
				expect(item.offer.every(id => getCatalogItem(id)?.kind == 'app')).toBe(true);
			};
			expect(TIERS).toContain(item.defaultTier);
			expect(!!item.name != !!item.nameKey).toBe(true);
		};
	});

	test('defaults', () => {
		expect(KEY_PLACEHOLDER).toBe('<KEY>');
		// No space is preselected: the user chooses (one, several or All spaces) before a key can be made
		expect(DEFAULT_GRANT).toEqual({ spaceIds: [], allSpaces: false, perm: 1 });
		expect(isValidLinkGrant(DEFAULT_GRANT)).toBe(false);
		expect(EXPIRY_DAYS).toEqual([ 0, 7, 30, 90, 365 ]);
		expect(TIERS).toEqual([ 'small', 'large', 'full' ]);
	});

	test('ids and lookup', () => {
		expect(isCatalogId('cursor')).toBe(true);
		expect(isCatalogId('notepad')).toBe(false);
		expect(isCatalogId(1)).toBe(false);
		expect(getCatalogItem('notepad')).toBeNull();
	});

	test('search matches names, ids and aliases, case-insensitively', () => {
		expect(searchCatalog('').length).toBe(CATALOG.length);
		expect(searchCatalog('COPILOT').map(it => it.id)).toEqual([ 'vscode' ]);
		expect(searchCatalog('openai').map(it => it.id)).toEqual([ 'chatgpt', 'codex' ]);
		expect(searchCatalog('claude').map(it => it.id)).toEqual([ 'claude-desktop', 'claude-code', 'claude-web' ]);
		expect(searchCatalog('other app', it => (it.nameKey == 'aiAppOther') ? 'Other app' : it.name).map(it => it.id)).toEqual([ 'other' ]);
		expect(searchCatalog('zzz')).toEqual([]);
	});

	test.each([
		[ 0, false ], [ 65536, false ], [ -1, false ], [ 1.5, false ], [ '80', false ], [ NaN, false ],
		[ 1, true ], [ 80, true ], [ 65535, true ],
	])('isValidPort(%s) is %s', (port, ok) => {
		expect(isValidPort(port)).toBe(ok);
	});
});

describe('result types', () => {
	// The fixtures are compiled here by tsconfig.json (and by validate.test.ts with tsconfig.electron.json):
	// every variant of every IPC result has a fixture, and every fixture fits its type
	test('every IPC command has fixtures for all of its result variants', () => {
		expect(Object.keys(IPC_RESULT_FIXTURES).sort()).toEqual([
			'aiConnectApply', 'aiConnectBundleInfo', 'aiConnectCheck', 'aiConnectClaimNudge', 'aiConnectList', 'aiConnectMintIntent', 'aiConnectOpenApp',
			'aiConnectOrphan', 'aiConnectPlan', 'aiConnectProbe', 'aiConnectRecordManual', 'aiConnectRemove', 'aiConnectRestartApp',
			'aiConnectReveal', 'aiConnectRevoked', 'aiConnectStepDone', 'aiConnectUpdate',
		]);
		expect(COVERAGE.every(Boolean)).toBe(true);
		expect(IPC_RESULT_FIXTURES.aiConnectPlan.foreign.replace).toEqual({ targetPath: '/Users/me/.cursor/mcp.json', foreignDigest: 'a'.repeat(64) });
	});
});
