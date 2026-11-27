/**
 * Z2: AI links are canonical at main's ingress — what main keeps pending and what it forwards to a renderer
 * carry only the catalog id (or the AI apps page's allowed fields), never a key.
 */
import { expect, test, vi } from 'vitest';

vi.mock('electron', () => ({ app: { getPath: () => '/tmp', isPackaged: false }, shell: {}, nativeTheme: {}, BrowserWindow: {} }));
vi.mock('electron-util', () => ({ is: { macos: true, windows: false, linux: false, development: false }, fixPathForAsarUnpack: (p: string) => p }));
vi.mock('electron-log', () => ({ default: { initialize: vi.fn(), transports: { file: {}, console: {} }, info: vi.fn(), error: vi.fn(), warn: vi.fn(), log: vi.fn() } }));
vi.mock('./config', () => ({ default: { config: {} } }));
vi.mock('./lib/trustedUrl', () => ({ isTrustedUrl: vi.fn() }));

import Util from './util';

const SENTINEL = 'sk-SENTINEL-abcdefghijklmnop';

test('Z2: a key in an AI link never reaches the pending URL or the forwarded route', () => {
	const pending = Util.canonicalDeepLink(`anytype://ai/connect?app=cursor&key=${SENTINEL}&x=1`);

	expect(pending).toBe('anytype://ai/connect?app=cursor');
	expect(Util.getRouteFromUrl(pending)).toBe('/ai/connect?app=cursor');
	expect(Util.getRouteFromUrl(`anytype://ai/connect?app=cursor&key=${SENTINEL}`)).toBe('/ai/connect?app=cursor');
	expect(Util.canonicalDeepLink(`anytype://ai/connect/?app=nope&key=${SENTINEL}`)).toBe('anytype://ai/connect');

	// The AI apps page reached directly keeps only its allowed fields
	const page = Util.getRouteFromUrl(`anytype://main/settings/aiApps/spaceId/sp-1/key/${SENTINEL}?app=codex&key=${SENTINEL}&route=Deeplink`);

	expect(page).toBe('/main/settings/aiApps/spaceId/sp-1/app/codex/route/Deeplink');
	expect(Util.canonicalDeepLink(`anytype://main/settings/aiApps?key=${SENTINEL}`)).toBe('anytype://main/settings/aiApps');
});

test('Z2: other links pass unchanged; nothing that isn\'t an anytype link is kept', () => {
	expect(Util.canonicalDeepLink('anytype://invite/?cid=abc&key=xyz')).toBe('anytype://invite/?cid=abc&key=xyz');
	expect(Util.getRouteFromUrl('anytype://membership?code=1')).toBe('/membership?code=1');
	expect(Util.canonicalDeepLink(undefined)).toBe('');
	expect(Util.canonicalDeepLink('https://example.com/ai/connect')).toBe('');
});

test('A3: every spelling of an AI page is canonical before main keeps or forwards it', () => {
	const forms = [
		[ `anytype://main/aiConnect//app/cursor/key/${SENTINEL}`, 'anytype://ai/connect?app=cursor' ],
		[ `anytype://main/%61iConnect/x/app/cursor?key=${SENTINEL}`, 'anytype://ai/connect?app=cursor' ],
		[ `anytype://main/settings?id=aiApps&key=${SENTINEL}&app=codex`, 'anytype://main/settings/aiApps/app/codex' ],
		[ `anytype://main/%73ettings/aiApps/key/${SENTINEL}/app/codex`, 'anytype://main/settings/aiApps/app/codex' ],
		[ `anytype://main/settings/other/%69d/aiApps/key/${SENTINEL}`, 'anytype://main/settings/aiApps' ],
	];

	for (const [ url, canonical ] of forms) {
		expect(Util.canonicalDeepLink(url)).toBe(canonical);
		expect(Util.getRouteFromUrl(url)).not.toContain(SENTINEL);
	};
});
