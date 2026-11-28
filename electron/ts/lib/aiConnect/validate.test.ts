import { describe, expect, test } from 'vitest';
import { AI_CONNECT_METHODS, aiConnectSenderAllowed, cleanName, isKey, validateParam, type AiSenderWindow } from './validate';
import type { ApplyOutcome, Ctx } from './types';
import { COVERAGE, IPC_RESULT_FIXTURES, PLAN_RESULTS } from '../../../../src/ts/lib/aiConnect/ipcFixtures';

const KEY = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789+/=';
const GRANT = { spaceIds: [], allSpaces: true, perm: 1 };

const apply = (over: Record<string, any> = {}) => ({
	accountId: 'acc-1', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY,
	appHash: 'hash-1', name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: null, ...over,
});

describe('validateParam', () => {
	test('a complete apply passes and comes back as a clean copy', () => {
		const p = validateParam('aiConnectApply', apply({ name: '  Cur\u0007sor\n ' }));

		expect(p).toMatchObject({ appId: 'cursor', name: 'Cursor', grant: GRANT });
	});

	test.each([ 0, 65536, -1, 1.5, '80', null ])('port %s is rejected', port => {
		expect(validateParam('aiConnectApply', apply({ port }))).toBeNull();
	});

	test.each([ 1, 80, 65535 ])('port %s is accepted', port => {
		expect(validateParam('aiConnectApply', apply({ port }))).not.toBeNull();
	});

	test('unknown properties are rejected', () => {
		expect(validateParam('aiConnectApply', apply({ path: '/etc/passwd' }))).toBeNull();
		expect(validateParam('aiConnectList', { accountId: 'a', command: 'rm' })).toBeNull();
		expect(validateParam('aiConnectBundleInfo', { x: 1 })).toBeNull();
		expect(validateParam('aiConnectBundleInfo', {})).toEqual({});
	});

	test('missing required properties and non-objects are rejected', () => {
		const { key, ...noKey } = apply();

		expect(key).toBe(KEY);
		expect(validateParam('aiConnectApply', noKey)).toBeNull();
		expect(validateParam('aiConnectList', null)).toBeNull();
		expect(validateParam('aiConnectList', [ 'a' ])).toBeNull();
		expect(validateParam('aiConnectList', 'a')).toBeNull();
		expect(validateParam('nope', {})).toBeNull();
	});

	test.each([
		[ 'a quote', `${KEY}"` ],
		[ 'a single quote', `${KEY}'` ],
		[ 'a backtick', `${KEY}\`` ],
		[ 'a backslash', `${KEY}\\` ],
		[ 'a dollar', `${KEY}$` ],
		[ 'angle brackets', `${KEY}<>` ],
		[ 'a newline', `${KEY}\n` ],
		[ 'a space', `${KEY} x` ],
		[ 'non-ASCII', `${KEY}é` ],
		[ 'too short', 'abc' ],
		[ 'too long', 'a'.repeat(513) ],
	])('a key with %s is rejected', (_, key) => {
		expect(isKey(key)).toBe(false);
		expect(validateParam('aiConnectApply', apply({ key }))).toBeNull();
	});

	test('appId must be in the catalog and the route one the card offers', () => {
		expect(validateParam('aiConnectApply', apply({ appId: 'notepad' }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ route: 'skill' }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ appId: 'claude-code', route: 'skill' }))).not.toBeNull();
		expect(validateParam('aiConnectApply', apply({ tier: 'huge' }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ method: 'cli' }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ method: 'config' }))).not.toBeNull();
		expect(validateParam('aiConnectApply', apply({ allowQuit: 'yes' }))).toBeNull();
		// The user's own "I've quit it" (plan.preflight quitAppSelf): a boolean only
		expect(validateParam('aiConnectApply', apply({ quitConfirmed: true }))).toMatchObject({ quitConfirmed: true });
		expect(validateParam('aiConnectApply', apply({ quitConfirmed: 1 }))).toBeNull();
		// The plan's target echoed back (compared only): a string, never anything else
		expect(validateParam('aiConnectApply', apply({ previewTarget: '/Users/me/.cursor/mcp.json' }))).toMatchObject({ previewTarget: '/Users/me/.cursor/mcp.json' });
		expect(validateParam('aiConnectApply', apply({ previewTarget: 7 }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ previewTarget: 'x'.repeat(4097) }))).toBeNull();
	});

	test('hashes, ids, names, grants and expiry', () => {
		expect(validateParam('aiConnectApply', apply({ appHash: 'has space' }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ appHash: 'x'.repeat(257) }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ expectedHash: 'h+/=_.:-1' }))).not.toBeNull();
		expect(validateParam('aiConnectApply', apply({ name: ' \n\t ' }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ name: 'я'.repeat(65) }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ grant: { spaceIds: [], allSpaces: false, perm: 1 } }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ grant: { ...GRANT, extra: 1 } }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ expireAt: -1 }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ expireAt: 1.5 }))).toBeNull();
		expect(validateParam('aiConnectRemove', { accountId: 'a', connectionId: 'Other_1', expectedHash: 'h' })).toBeNull();
		expect(validateParam('aiConnectRemove', { accountId: 'a', connectionId: 'other-0a1b2c3d', expectedHash: 'h' })).not.toBeNull();
	});

	test('cleanName strips control characters and limits UTF-8 bytes', () => {
		expect(cleanName(' a\u0000b\u009Fc ')).toBe('abc');
		expect(cleanName('я'.repeat(64))).toBe('я'.repeat(64));
		expect(cleanName('я'.repeat(65))).toBe('');
		expect(cleanName(5)).toBe('');
	});

	test('check: managed keys only, a failed list is null, the port only matters while listening', () => {
		const base = { accountId: 'a', port: 31009, apiListening: true };

		expect(validateParam('aiConnectCheck', { ...base, keys: null })).not.toBeNull();
		expect(validateParam('aiConnectCheck', { ...base, keys: [ { hash: 'h', present: true, grant: GRANT, expireAt: 0 } ] })).not.toBeNull();
		expect(validateParam('aiConnectCheck', { ...base, keys: [ { hash: 'h', present: 'yes' } ] })).toBeNull();
		expect(validateParam('aiConnectCheck', { ...base, keys: [ { hash: 'h', present: true, apiKey: KEY } ] })).toBeNull();
		expect(validateParam('aiConnectCheck', { ...base, keys: Array(1001).fill({ hash: 'h', present: true }) })).toBeNull();
		expect(validateParam('aiConnectCheck', { ...base, port: 0, keys: [] })).toBeNull();
		expect(validateParam('aiConnectCheck', { accountId: 'a', apiListening: true, keys: [] })).toBeNull();
	});

	test.each([ 65536, -1, 1.5, '80', 'abc', { port: 1 }, [ 31009 ] ])('offline check: a stale port %o is not validated and is dropped; online it is rejected', port => {
		const keys = [ { hash: 'h-1', present: false } ];

		expect(validateParam<any>('aiConnectCheck', { accountId: 'a', apiListening: false, port, keys })).toEqual(Object.assign(Object.create(null), { accountId: 'a', apiListening: false, keys: [ Object.assign(Object.create(null), { hash: 'h-1', present: false }) ] }));
		expect(validateParam('aiConnectCheck', { accountId: 'a', apiListening: true, port, keys })).toBeNull();
	});

	test('check without a port while the API is off; a stray port is ignored', () => {
		expect(validateParam('aiConnectCheck', { accountId: 'a', apiListening: false, keys: [] })).toEqual(Object.assign(Object.create(null), { accountId: 'a', apiListening: false, keys: [] }));
		expect(validateParam<any>('aiConnectCheck', { accountId: 'a', apiListening: false, port: 31009, keys: null }).port).toBeUndefined();
		expect(validateParam<any>('aiConnectCheck', { accountId: 'a', apiListening: false, port: 0, keys: null })).not.toBeNull();
		expect(validateParam<any>('aiConnectCheck', { accountId: 'a', apiListening: true, port: 31009, keys: null }).port).toBe(31009);
	});

	test('apply: replace is absent or exactly { targetPath, foreignDigest }', () => {
		const replace = { targetPath: '/Users/me/.cursor/mcp.json', foreignDigest: 'a'.repeat(64) };

		expect(validateParam<any>('aiConnectApply', apply({ replace })).replace).toEqual(Object.assign(Object.create(null), replace));
		expect(validateParam('aiConnectApply', apply())).not.toBeNull();
		expect(validateParam('aiConnectApply', apply({ replace: true }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ replace: { ...replace, extra: 1 } }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ replace: { targetPath: replace.targetPath } }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ replace: { ...replace, foreignDigest: 'A'.repeat(64) } }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ replace: { ...replace, targetPath: '' } }))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ replace: { ...replace, targetPath: 'x'.repeat(4097) } }))).toBeNull();
	});

	test('a foreign plan\'s replace object goes back through apply validation unchanged', () => {
		const plan = PLAN_RESULTS.foreign;
		const p = validateParam<any>('aiConnectApply', apply({ appId: plan.appId, route: plan.route, tier: plan.tier, replace: plan.replace }));

		expect(p).not.toBeNull();
		expect({ ...p.replace }).toEqual(plan.replace);
		expect(plan.existing).toBe('foreign');
	});

	test('orphan: { accountId, hash, done? }', () => {
		expect(validateParam('aiConnectOrphan', { accountId: 'a', hash: 'h' })).not.toBeNull();
		expect(validateParam('aiConnectOrphan', { accountId: 'a', hash: 'h', done: true })).not.toBeNull();
		expect(validateParam('aiConnectOrphan', { accountId: 'a', hash: 'h', done: 'yes' })).toBeNull();
		expect(validateParam('aiConnectOrphan', { accountId: 'a' })).toBeNull();
	});

	test('names on Object.prototype are not schema members; __proto__ is data', () => {
		expect(validateParam('aiConnectList', { accountId: 'a', toString: 'extra' })).toBeNull();
		expect(validateParam('aiConnectList', { accountId: 'a', hasOwnProperty: 'x' })).toBeNull();
		expect(validateParam('aiConnectList', JSON.parse('{ "accountId": "a", "__proto__": { "refresh": true } }'))).toBeNull();
		expect(validateParam('aiConnectApply', apply({ grant: JSON.parse('{ "spaceIds": [], "allSpaces": true, "perm": 1, "__proto__": { "x": 1 } }') }))).toBeNull();
		expect(validateParam('constructor', {})).toBeNull();
		expect(validateParam('__proto__', {})).toBeNull();
	});

	test('the result holds only declared fields, with null prototypes all the way down', () => {
		const p = validateParam<any>('aiConnectApply', apply({ replace: { targetPath: '/x', foreignDigest: 'a'.repeat(64) } }));

		expect(Object.getPrototypeOf(p)).toBeNull();
		expect(Object.getPrototypeOf(p.grant)).toBeNull();
		expect(Object.getPrototypeOf(p.replace)).toBeNull();
		expect(p.allowQuit).toBeUndefined();

		const c = validateParam<any>('aiConnectCheck', { accountId: 'a', apiListening: false, keys: [ { hash: 'h', present: true, grant: GRANT } ] });

		expect(Object.getPrototypeOf(c.keys[0])).toBeNull();
		expect(Object.getPrototypeOf(c.keys[0].grant)).toBeNull();
	});

	test('probe: a connection id needs the account', () => {
		const base = { port: 31009, tier: 'large', route: 'http', key: KEY };

		expect(validateParam('aiConnectProbe', base)).not.toBeNull();
		expect(validateParam('aiConnectProbe', { ...base, connectionId: 'cursor' })).toBeNull();
		expect(validateParam('aiConnectProbe', { ...base, accountId: 'a', connectionId: 'cursor' })).not.toBeNull();
	});

	test('reveal takes a record or a card, never both', () => {
		expect(validateParam('aiConnectReveal', { accountId: 'a', connectionId: 'cursor' })).not.toBeNull();
		expect(validateParam('aiConnectReveal', { appId: 'claude-desktop', what: 'bundle' })).not.toBeNull();
		expect(validateParam('aiConnectReveal', { appId: 'claude-desktop', what: 'bundle', accountId: 'a', connectionId: 'cursor' })).toBeNull();
		expect(validateParam('aiConnectReveal', { appId: 'claude-desktop', what: '/etc' })).toBeNull();
		expect(validateParam('aiConnectReveal', {})).toBeNull();
	});
});

describe('aiConnectSenderAllowed', () => {
	const win: AiSenderWindow = { isQuickSearch: false, isApproval: false, isFocused: true, activeViewId: 7 };
	const sender = { cmd: 'aiConnectList', senderId: 7, isMainFrame: true };

	test('the active tab\'s top frame of a normal window', () => {
		expect(aiConnectSenderAllowed(win, sender)).toBe(true);
	});

	test.each([
		[ 'Quick Search', { ...win, isQuickSearch: true }, sender ],
		[ 'the approval window', { ...win, isApproval: true }, sender ],
		[ 'the tab strip (the window\'s own webContents)', win, { ...sender, senderId: 1 } ],
		[ 'a background tab', win, { ...sender, senderId: 8 } ],
		[ 'a window without an active tab', { ...win, activeViewId: null }, sender ],
		[ 'a sub-frame', win, { ...sender, isMainFrame: false } ],
		[ 'a nudge claim from an unfocused window', { ...win, isFocused: false }, { ...sender, cmd: 'aiConnectClaimNudge' } ],
	])('denied for %s', (_, w, s) => {
		expect(aiConnectSenderAllowed(w as AiSenderWindow, s)).toBe(false);
	});

	test('an unfocused window may still list', () => {
		expect(aiConnectSenderAllowed({ ...win, isFocused: false }, sender)).toBe(true);
		expect(aiConnectSenderAllowed(win, { ...sender, cmd: 'aiConnectClaimNudge' })).toBe(true);
	});
});

describe('result types', () => {
	// The shared IPC fixtures are compiled here by tsconfig.electron.json (catalog.test.ts compiles them with
	// tsconfig.json). The main-only producer types are checked below with explicitly typed values
	test('every IPC command has result fixtures, and every validated command has a result type', () => {
		expect(COVERAGE.every(Boolean)).toBe(true);
		expect(Object.keys(IPC_RESULT_FIXTURES).sort()).toEqual(AI_CONNECT_METHODS.slice().sort());
	});

	test('main-only shapes', () => {
		const outcomeOk: ApplyOutcome = { ok: true, method: 'package', nextStep: 'confirmInApp', targetPath: '', observedInstalled: false, createdDirs: [], openFailed: true, entryDigest: 'b'.repeat(64), deliver: async () => true, configure: false, install: null };
		const outcomeNeeds: ApplyOutcome = { ok: false, needs: 'quitAppSelf' };
		const outcomeFail: ApplyOutcome = { ok: false, error: { stage: 'write', category: 'changed' } };
		const ctx: Ctx = { env: null, homes: null, detections: [], appId: 'cursor', targetId: 'codex-home-0a1b2c3d', port: 1, tier: 'large', route: 'http', key: '', replace: PLAN_RESULTS.foreign.replace };

		expect([ outcomeOk, outcomeNeeds, outcomeFail, ctx ]).toHaveLength(4);
	});
});
