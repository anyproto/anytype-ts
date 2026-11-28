import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMemoryHistory } from 'history';
import { matchPath } from 'react-router';
import Constant from 'json/constant';
import Routes from 'json/route';
import UtilString from 'Lib/util/string';

vi.mock('Lib/focus', () => ({ focus: { clear: () => {} } }));

import Router from '../util/router';
import Action from '../action';
import { keyboard } from '../keyboard';
import { Common as CommonStore } from '../../store/common';
import { isCatalogId } from './catalog';
import { canonicalAiRoute, OPEN_ROUTES } from './deeplink';
import { aiAppsObject, connectionForKey, GalleryVisit, resolveTarget, revealClearsQuery, routeTarget, targetParam, withoutTarget } from './entry';
import * as flow from './flow';
import { aiLinkArrived, clearAiLink, consumeAiLink, pendingAiLink, takeAiLink } from './link';
import { installHarness, record, until, type Harness } from './testHarness';

const SETTINGS = 106;
const SENTINEL = 'sk-SENTINEL-abcdefghijklmnop';

let h: Harness;
let history: ReturnType<typeof createMemoryHistory>;
let send: (cmd: string, ...args: any[]) => Promise<any>;
let common: any;

const route = (routeParam: any = {}) => Router.build({ page: 'main', action: 'settings', id: 'aiApps', spaceId: 'space-1', ...routeParam });
const DOC = '/main/edit/doc-1/spaceId/space-1';
const flush = async () => {
	for (let i = 0; i < 4; i++) {
		await new Promise(r => setTimeout(r, 0));
	};
};
const paths = () => history.entries.map(e => e.pathname);

/** The app's object router as far as these pages need it (U.Object.route / openRoute) */
const objectUtil = {
	route: (o: any) => Router.build({ page: 'main', action: 'settings', id: o.id, spaceId: common.space, ...o._routeParam_ }),
	openRoute: async (o: any, param?: any) => {
		const r = objectUtil.route(o);

		if (common.isPinned) {
			send('openRouteInTab', r);
			return;
		};
		if (await send('switchToTabByRoute', r)) {
			return;
		};
		Router.go(r, param || {});
	},
};

beforeEach(() => {
	h = installHarness();
	history = createMemoryHistory();
	Router.init(history);
	history.listen(() => consumeAiLink());
	clearAiLink();
	common = {
		space: 'space-1', isPinned: false, redirect: '',
		getRightSidebarState: () => ({ page: '' }),
		redirectSet: (v: string) => CommonStore.redirectSet(v),
	};
	send = vi.fn(async (cmd: string, p: any) => (cmd.startsWith('aiConnect') ? h.main.send(cmd, p) : null));
	vi.stubGlobal('S', {
		Auth: Object.assign(h.auth, { accountIsDeleted: () => false, accountIsPending: () => false }),
		AiConnect: h.store,
		Common: common,
		Menu: { closeAll: vi.fn(), getTimeout: () => 0 },
		Popup: { closeAll: vi.fn(), getTimeout: () => 0, open: vi.fn(), isOpen: vi.fn(() => true), close: vi.fn() },
	});
	vi.stubGlobal('U', {
		Common: {
			searchParam: (s: string) => Object.fromEntries(new URLSearchParams(s)),
			safeDecodeUri: (s: string) => {
				try {
					return decodeURIComponent(String(s || ''));
				} catch {
					return String(s || '');
				};
			},
			getElectron: () => ({ tabId: () => 'tab-1' }),
		},
		Router,
		Object: objectUtil,
		String: UtilString,
	});
	vi.stubGlobal('J', { Constant });
	vi.stubGlobal('Renderer', { send });
	vi.stubGlobal('Preview', { hideAll: () => {} });
	vi.stubGlobal('Action', Action);
	vi.stubGlobal('sidebar', { rightPanelClose: () => {} });
	// The harness's analytics stub (h.events), with the routes the pages name
	(globalThis as any).analytics.route = { deeplink: 'Deeplink' };
});

afterEach(() => {
	clearAiLink();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	(window as any).Electron = {};
	flow.resetFlowForTests();
});

describe('Z2: canonical AI routes everywhere', () => {
	test('Z2: a link keeps only its catalog id; the AI apps page only its allowed fields', () => {
		expect(canonicalAiRoute(`/ai/connect?app=cursor&key=${SENTINEL}`)).toBe('/ai/connect?app=cursor');
		expect(canonicalAiRoute('/ai/connect/?app=nope')).toBe('/ai/connect');
		expect(canonicalAiRoute(`/main/settings/aiApps/spaceId/space-1/key/${SENTINEL}/app/cursor?route=Deeplink&key=${SENTINEL}&connection=../x`))
			.toBe('/main/settings/aiApps/spaceId/space-1/app/cursor/route/Deeplink');
		expect(canonicalAiRoute('/main/edit/doc-1')).toBeNull();
		expect(Router.getParam(`/ai/connect?app=cursor&key=${SENTINEL}`)).toEqual({ page: 'main', action: 'aiConnect', id: '', app: 'cursor' });
		expect(OPEN_ROUTES).toEqual([ 'Settings', 'Deeplink', 'Notification', 'MenuHelp', 'ScreenSettingsApi' ]);
	});

	test('Z2: a key never reaches the redirect store, history or the saved tab route', () => {
		// A link while locked: pending as its catalog id only, not a redirect
		CommonStore.redirectSet(`/ai/connect?app=cursor&key=${SENTINEL}`);
		expect(CommonStore.redirect).toBe('');
		expect(pendingAiLink()).toEqual({ app: 'cursor' });
		clearAiLink();

		// The AI apps page with a key, as a redirect and through Router.go: only the allowed fields
		CommonStore.redirectSet(`/main/settings/aiApps/spaceId/space-1/key/${SENTINEL}?app=codex`);
		expect(CommonStore.redirect).toBe('/main/settings/aiApps/spaceId/space-1/app/codex');
		CommonStore.redirectSet('');

		Router.go(`/main/settings/aiApps/spaceId/space-1?key=${SENTINEL}&app=codex`, {});
		expect(history.location.pathname).toBe('/main/settings/aiApps/spaceId/space-1/app/codex');
		expect(JSON.stringify(paths())).not.toContain(SENTINEL);
		expect(JSON.stringify(vi.mocked(send).mock.calls)).not.toContain(SENTINEL);
		expect(vi.mocked(send)).toHaveBeenCalledWith('updateTab', 'tab-1', { route: '/main/settings/aiApps/spaceId/space-1/app/codex' });
	});
});

describe('Ollama is not a card (after Roma\'s review)', () => {
	test('a link to ollama is an unknown id: the gallery opens with no target and no sheet', async () => {
		const open = vi.fn();
		const show = vi.fn();

		expect(isCatalogId('ollama')).toBe(false);
		expect(canonicalAiRoute('/ai/connect?app=ollama')).toBe('/ai/connect');
		expect(Router.getParam('/ai/connect?app=ollama')).toEqual({ page: 'main', action: 'aiConnect', id: '', app: '' });

		history.push(DOC);
		takeAiLink('/ai/connect?app=ollama');
		await flush();
		expect(paths()).toEqual([ '/', DOC, route({ route: 'Deeplink' }) ]);

		const target = routeTarget(Router.getParam(history.location.pathname));
		const visit = new GalleryVisit({ open, show });

		expect(target.app).toBe('');
		visit.arrive(true, target);
		await until(() => h.calls('aiConnectCheck').length == 1);
		await flush();
		expect(open).not.toHaveBeenCalled();
		expect(show).not.toHaveBeenCalled();
		visit.dispose();
	});

	test('the Gemini app\'s card: its link opens only the gallery unless the app is on this computer', async () => {
		await flow.load(true);
		expect(resolveTarget({ app: 'gemini' })).toBeNull();

		h.main.m.detections = [ ...h.main.m.detections, { appId: 'gemini', installed: true, targetPaths: [], canRestart: false } as any ];
		await flow.load(true);
		expect(resolveTarget({ app: 'gemini' })).toEqual({ appId: 'gemini' });
	});
});

describe('Z1: a warm link is one history entry', () => {
	test('A2: from version history: one gallery entry; Back is one ordinary step there, Forward returns to the gallery with no sheet', async () => {
		const docA = '/main/edit/doc-a/spaceId/space-1';
		const docB = '/main/edit/doc-b/spaceId/space-1';
		const versions = '/main/history/doc-b/spaceId/space-1';
		const open = vi.fn();

		history.push(docA);
		history.push(docB);
		history.push(versions);
		takeAiLink('/ai/connect?app=nope');
		await flush();
		expect(paths()).toEqual([ '/', docA, docB, versions, route({ route: 'Deeplink' }) ]);

		const visit = new GalleryVisit({ open, show: vi.fn() });

		visit.arrive(true, routeTarget(Router.getParam(history.location.pathname)));
		keyboard.onBack(false);
		expect(paths()).toEqual([ '/', docA, docB, versions, route() ]);
		expect(history.location.pathname).toBe(versions);
		expect(keyboard.checkForward(false)).toBe(true);

		keyboard.onForward(false);
		expect(paths()).toEqual([ '/', docA, docB, versions, route() ]);
		expect(history.location.pathname).toBe(route());
		await flush();
		expect(open).not.toHaveBeenCalled();
		visit.dispose();
	});

	for (const from of [ DOC ]) {
		test(`Z1: from a document: the targeted gallery is pushed once; Back returns, Forward comes back, history is kept`, async () => {
			history.push('/main/edit/doc-0/spaceId/space-1');
			history.push(from);
			expect(takeAiLink(`/ai/connect?app=cursor&key=${SENTINEL}`)).toBe(true);
			await flush();

			expect(paths().slice(1)).toEqual([ '/main/edit/doc-0/spaceId/space-1', from, route({ app: 'cursor', route: 'Deeplink' }) ]);

			// The gallery takes its target off its entry on arrival
			const visit = new GalleryVisit({ open: vi.fn(), show: vi.fn() });

			visit.arrive(true, routeTarget(Router.getParam(history.location.pathname)));
			expect(history.location.pathname).toBe(route());

			keyboard.onBack(false);
			expect(history.location.pathname).toBe(from);
			expect(keyboard.checkForward(false)).toBe(true);
			keyboard.onForward(false);
			expect(history.location.pathname).toBe(route());
			expect(routeTarget(Router.getParam(history.location.pathname))).toEqual({ app: '', connection: '', route: '' });
			expect(paths().slice(1)).toEqual([ '/main/edit/doc-0/spaceId/space-1', from, route() ]);
			visit.dispose();
		});
	};
});

describe('Z3: a cold start keeps the link through account selection and the PIN', () => {
	test('Z3: the link waits on auth pages and opens once an app page shows', async () => {
		h.auth.account = null;
		history.push('/auth/select');
		expect(takeAiLink('/ai/connect?app=cursor')).toBe(true);
		await flush();
		expect(pendingAiLink()).toEqual({ app: 'cursor' });

		h.auth.account = { id: 'acc-1' };
		Router.go('/auth/pin-check', {});
		await flush();
		expect(pendingAiLink()).toEqual({ app: 'cursor' });
		// The startup redirect is cleared on the way (onSpaceSwitch, pin check): the link doesn't depend on it
		CommonStore.redirectSet('');

		Router.go(DOC, {});
		await flush();
		expect(pendingAiLink()).toBeNull();
		expect(history.location.pathname).toBe(route({ app: 'cursor', route: 'Deeplink' }));
	});

	test('Z3: without a space, or on a transient page, it keeps waiting; dropped, nothing opens', async () => {
		common.space = '';
		history.push(DOC);
		aiLinkArrived('codex');
		await flush();
		expect(pendingAiLink()).toEqual({ app: 'codex' });

		common.space = 'space-1';
		Router.go('/main/blank', {});
		await flush();
		expect(pendingAiLink()).toEqual({ app: 'codex' });
		clearAiLink();
		Router.go(DOC, {});
		await flush();
		expect(history.location.pathname).toBe(DOC);
	});
});

describe('Z6: pinned tabs', () => {
	test('Z6: from a pinned tab the gallery opens in a new tab with its target; the pinned tab keeps its route', async () => {
		common.isPinned = true;
		history.push(DOC);
		takeAiLink('/ai/connect?app=cursor');
		await flush();

		expect(vi.mocked(send)).toHaveBeenCalledWith('openRouteInTab', route({ app: 'cursor', route: 'Deeplink' }));
		expect(history.location.pathname).toBe(DOC);
		expect(paths().some(p => p.includes('aiConnect') || p.includes('aiApps'))).toBe(false);
	});

	test('Z6: the link page reached as a route becomes the targeted gallery in place (no dashboard detour)', () => {
		history.push(DOC);
		history.push('/main/aiConnect//app/cursor');
		Router.replaceCurrent(objectUtil.route(aiAppsObject({ app: 'cursor' }, 'Deeplink')));
		expect(paths().slice(1)).toEqual([ DOC, route({ app: 'cursor', route: 'Deeplink' }) ]);
	});
});

describe('Action.openAiApps (§5.8)', () => {
	test('opens Settings ▸ AI apps with the target in the route: a connection wins over an app', async () => {
		const openRoute = vi.spyOn(objectUtil, 'openRoute');

		Action.openAiApps({ app: 'cursor' }, 'Deeplink');
		Action.openAiApps({ connection: 'other-0a1b2c3d', app: 'other' }, 'ScreenSettingsApi');
		Action.openAiApps(undefined, 'MenuHelp');

		expect(openRoute.mock.calls.map(c => c[0])).toEqual([
			{ id: 'aiApps', layout: SETTINGS, _routeParam_: { app: 'cursor', route: 'Deeplink' } },
			{ id: 'aiApps', layout: SETTINGS, _routeParam_: { connection: 'other-0a1b2c3d', route: 'ScreenSettingsApi' } },
			{ id: 'aiApps', layout: SETTINGS, _routeParam_: { route: 'MenuHelp' } },
		]);
		expect(targetParam({}, '')).toEqual({});
		expect(routeTarget({ app: 'nope', connection: '../../x', route: '/Users/me' })).toEqual({ app: '', connection: '', route: '' });
		expect(withoutTarget(route({ app: 'cursor', connection: 'cursor', route: 'Deeplink' }))).toBe(route());
	});
});

describe('Z5: the target is one-shot, consumed on arrival', () => {
	const open = vi.fn();
	const show = vi.fn();
	let visit: GalleryVisit;

	const visitWith = (routeParam: any) => {
		history.push(DOC);
		history.push(route(routeParam));
		visit = new GalleryVisit({ open, show });
		return routeTarget(Router.getParam(history.location.pathname));
	};

	beforeEach(() => {
		open.mockReset();
		show.mockReset();
	});

	afterEach(() => visit?.dispose());

	test('Z5: the history entry is clean before the list loads; the sheet opens after it', async () => {
		const held = h.main.holdNext('aiConnectList');
		const target = visitWith({ app: 'cursor', route: 'Deeplink' });

		visit.arrive(true, target);
		expect(history.location.pathname).toBe(route());
		expect(open).not.toHaveBeenCalled();

		held.resolve();
		await until(() => open.mock.calls.length == 1);
		expect(open).toHaveBeenCalledWith({ appId: 'cursor' });
		expect(h.events()).toEqual([ [ 'AiConnectOpen', { route: 'Deeplink' } ] ]);
		await until(() => h.calls('aiConnectCheck').length == 1);
	});

	test('Z5: leaving during the load opens nothing, and Back to the gallery replays nothing', async () => {
		const held = h.main.holdNext('aiConnectList');
		const target = visitWith({ app: 'cursor', route: 'Deeplink' });

		visit.arrive(true, target);
		Router.go(DOC, {});
		visit.dispose();
		held.resolve();
		await flush();
		expect(open).not.toHaveBeenCalled();

		keyboard.onBack(false);
		expect(history.location.pathname).toBe(route());
		expect(routeTarget(Router.getParam(history.location.pathname))).toEqual({ app: '', connection: '', route: '' });
	});

	test('Z5: an account switch during the load drops the target', async () => {
		const held = h.main.holdNext('aiConnectList');
		const target = visitWith({ app: 'cursor', route: 'Deeplink' });

		visit.arrive(true, target);
		h.auth.account = { id: 'acc-2' };
		held.resolve();
		await flush();
		expect(open).not.toHaveBeenCalled();
	});

	test('Z5: a failed first load keeps the target; a successful Scan again opens it', async () => {
		h.main.m.listFails = true;

		const target = visitWith({ connection: 'cursor', route: 'ScreenSettingsApi' });

		h.existing();
		visit.arrive(true, target);
		await flush();
		expect(open).not.toHaveBeenCalled();
		expect(history.location.pathname).toBe(route());

		h.main.m.listFails = false;
		await visit.refresh('scan', true);
		expect(open).toHaveBeenCalledWith({ appId: 'cursor', connectionId: 'cursor' });
	});

	test('a second target while open switches the sheet, without an opening check of its own', async () => {
		const target = visitWith({});

		visit.arrive(true, target);
		await until(() => h.calls('aiConnectCheck').length == 1);

		history.push(route({ app: 'lmstudio', route: 'Deeplink' }));
		visit.arrive(false, routeTarget(Router.getParam(history.location.pathname)));
		await until(() => open.mock.calls.length == 1);
		expect(open).toHaveBeenCalledWith({ appId: 'lmstudio' });
		expect(h.calls('aiConnectCheck').length).toBe(1);

		// The re-render after the target was dropped does nothing
		visit.arrive(false, routeTarget({}));
		await flush();
		expect(open.mock.calls.length).toBe(1);
	});
});

describe('Z7, Z8: what a target opens', () => {
	test('Z7: the backlink resolves its record after the opening check; a record the check removed opens nothing', async () => {
		const open = vi.fn();

		h.existing({ removed: true, revokePending: [ 'hash-old' ] });
		history.push(route({ connection: 'cursor', route: 'ScreenSettingsApi' }));

		const visit = new GalleryVisit({ open, show: vi.fn() });

		visit.arrive(true, routeTarget(Router.getParam(history.location.pathname)));
		await until(() => h.calls('aiConnectCheck').length == 1);
		await flush();
		expect(h.store.getById('cursor')).toBeNull();
		expect(open).not.toHaveBeenCalled();
		visit.dispose();
	});

	test('Z7: an Other-app record that is still there opens its Manage', async () => {
		h.existing({ id: 'other-0a1b2c3d', appId: 'other', appHash: 'hash-other', method: 'manual', targetPath: '' });
		h.heart.add('hash-other');
		await flow.load();
		expect(resolveTarget({ connection: 'other-0a1b2c3d' })).toEqual({ appId: 'other', connectionId: 'other-0a1b2c3d' });
	});

	test('Z8: an app that isn\'t installed never gets the Connect form: its row is shown; an unknown scan waits for Scan again', async () => {
		const open = vi.fn();
		const show = vi.fn();

		h.main.m.detections = h.main.m.detections.filter(d => d.appId != 'cursor');
		history.push(route({ app: 'cursor', route: 'Deeplink' }));

		const visit = new GalleryVisit({ open, show });

		visit.arrive(true, routeTarget(Router.getParam(history.location.pathname)));
		await until(() => show.mock.calls.length == 1);
		expect(show).toHaveBeenCalledWith('cursor');
		expect(open).not.toHaveBeenCalled();
		visit.dispose();

		// Other, unsupported and installed cards keep their own views
		expect(resolveTarget({ app: 'other' })).toEqual({ appId: 'other' });
		expect(resolveTarget({ app: 'chatgpt-web' })).toEqual({ appId: 'chatgpt-web' });
		expect(resolveTarget({ app: 'lmstudio' })).toEqual({ appId: 'lmstudio' });

		// The scan couldn't tell: wait (opened after a successful Scan again)
		h.store.scanOk = false;
		expect(resolveTarget({ app: 'cursor' })).toBe('wait');
	});
});

describe('the API Keys backlink (connectionForKey)', () => {
	test('a key row matches the connection using it, Other-app ones included', async () => {
		h.existing();
		h.existing({ id: 'other-0a1b2c3d', appId: 'other', appHash: 'hash-other', method: 'manual', targetPath: '' });
		await flow.load();

		expect(connectionForKey('hash-old')?.id).toBe('cursor');
		expect(connectionForKey('hash-other')?.id).toBe('other-0a1b2c3d');
		expect(connectionForKey('hash-unknown')).toBeNull();
		expect(connectionForKey('')).toBeNull();
		expect(connectionForKey('hash-x', [ record({ appHash: 'hash-x' }) as any ])?.id).toBe('cursor');
	});
});

describe('A3: every spelling of an AI route is canonical', () => {
	const FORMS = [
		`/main/aiConnect//app/cursor/key/${SENTINEL}`,
		`/main/settings?id=aiApps&key=${SENTINEL}&app=codex`,
		`/main/%73ettings/aiApps/key/${SENTINEL}/app/codex`,
		`/main/settings/other/%69d/aiApps/key/${SENTINEL}`,
		`/main/%61iConnect/x/app/cursor?key=${SENTINEL}`,
	];

	test('A3: each form resolves to its AI page with only the allowed fields, through redirectSet, Router.go and the first updateTab', () => {
		for (const form of FORMS) {
			const p = Router.getParam(form);

			expect(JSON.stringify(p)).not.toContain(SENTINEL);
			expect([ 'aiConnect', 'settings' ].includes(p.action)).toBe(true);
			if (p.action == 'settings') {
				expect(p.id).toBe('aiApps');
			};

			clearAiLink();
			CommonStore.redirectSet('');
			CommonStore.redirectSet(form);
			expect(CommonStore.redirect).not.toContain(SENTINEL);

			vi.mocked(send).mockClear();
			Router.go(form, {});
			expect(history.location.pathname).not.toContain(SENTINEL);

			const first = vi.mocked(send).mock.calls.find(c => c[0] == 'updateTab');

			expect(first).toBeTruthy();
			expect(JSON.stringify(first)).not.toContain(SENTINEL);
		};
		clearAiLink();
		CommonStore.redirectSet('');
		expect(JSON.stringify(paths())).not.toContain(SENTINEL);
	});

	test('A3: the link page in any spelling is a link (pending as its catalog id), never a redirect', () => {
		CommonStore.redirectSet('');
		history.push('/auth/select');
		CommonStore.redirectSet(`/main/%61iConnect//app/codex/key/${SENTINEL}`);
		expect(CommonStore.redirect).toBe('');
		expect(pendingAiLink()).toEqual({ app: 'codex' });
		expect(canonicalAiRoute('/main/aiConnect//app/nope')).toBe('/ai/connect');
		clearAiLink();
	});
});

describe('A6: a gallery visit belongs to its history entry', () => {
	test('A6: Back between two gallery entries during the load drops the target; leaving closes the sheet it opened', async () => {
		const open = vi.fn();
		const visit = new GalleryVisit({ open, show: vi.fn() });

		history.push(route());
		visit.arrive(true, routeTarget({}));
		await until(() => h.calls('aiConnectCheck').length == 1);

		const held = h.main.holdNext('aiConnectList');

		history.push(route({ app: 'cursor', route: 'Deeplink' }));
		visit.arrive(false, routeTarget(Router.getParam(history.location.pathname)));
		keyboard.onBack(false);
		expect(history.location.pathname).toBe(route());
		held.resolve();
		await flush();
		expect(open).not.toHaveBeenCalled();

		// A target that did open: leaving its entry closes its sheet through the popup's own close
		keyboard.onForward(false);
		history.push(route({ app: 'cursor', route: 'Deeplink' }));
		visit.arrive(false, routeTarget(Router.getParam(history.location.pathname)));
		await until(() => open.mock.calls.length == 1);
		keyboard.onBack(false);
		expect(S.Popup.close).toHaveBeenCalledWith('aiConnect');
		visit.dispose();
	});

	test('A6: a direct gallery link without a space keeps its keyed route when cleaned (no remount)', () => {
		const keyOf = (path: string) => Routes.findIndex(r => !!matchPath(path, { path: r, exact: true }));
		const direct = Router.build(Router.getParam('/main/settings/aiApps?app=cursor'));
		const clean = withoutTarget(direct);

		expect(direct).toBe('/main/settings/aiApps/app/cursor');
		expect(clean).toBe('/main/settings/aiApps/spaceId/space-1');
		expect(keyOf(clean)).toBe(keyOf(direct));
	});
});

describe('A7: targets resolve after a successful reconciliation', () => {
	const visitWith = (routeParam: any, open: any) => {
		history.push(route(routeParam));

		const visit = new GalleryVisit({ open, show: vi.fn() });

		visit.arrive(true, routeTarget(Router.getParam(history.location.pathname)));
		return visit;
	};

	test('A7: a failed first load stops (no check, no sheet); Scan again opens it', async () => {
		const open = vi.fn();

		h.existing();
		h.heart.add('hash-old');
		h.main.m.listFails = true;

		const visit = visitWith({ connection: 'cursor', route: 'ScreenSettingsApi' }, open);

		await flush();
		expect(h.calls('aiConnectCheck')).toEqual([]);
		expect(open).not.toHaveBeenCalled();
		expect(h.store.loadFailed).toBe(true);

		h.main.m.listFails = false;
		await visit.refresh('scan', true);
		expect(open).toHaveBeenCalledWith({ appId: 'cursor', connectionId: 'cursor' });
		visit.dispose();
	});

	test('A7: a loaded list but a failed check: the record\'s Manage waits; Scan again opens it', async () => {
		const open = vi.fn();

		h.existing();
		h.heart.add('hash-old');
		h.main.m.checkUnsaved = true;

		const visit = visitWith({ connection: 'cursor', route: 'ScreenSettingsApi' }, open);

		await until(() => h.calls('aiConnectCheck').length == 1);
		await flush();
		expect(open).not.toHaveBeenCalled();
		expect(h.store.loadFailed).toBe(true);

		h.main.m.checkUnsaved = false;
		await visit.refresh('scan', true);
		expect(open).toHaveBeenCalledWith({ appId: 'cursor', connectionId: 'cursor' });
		visit.dispose();
	});
});

describe('A9, A11, A12', () => {
	test('A9: the empty-space landing page opens a waiting link; space selection keeps waiting', async () => {
		history.push('/main/void/select');
		aiLinkArrived('cursor');
		await flush();
		expect(pendingAiLink()).toEqual({ app: 'cursor' });

		Router.go('/main/void/empty', {});
		await flush();
		expect(pendingAiLink()).toBeNull();
		expect(history.location.pathname).toBe(route({ app: 'cursor', route: 'Deeplink' }));
	});

	test('A11: a link to a card sharing another app\'s connection opens it with the owner\'s identity', async () => {
		const file = '/Users/me/.codex/config.toml';

		h.main.m.detections = [
			{ appId: 'chatgpt', installed: true, targetId: 'codex', targetPaths: [ file ], canRestart: true },
			{ appId: 'codex', installed: true, targetId: 'codex', targetPaths: [ file ], canRestart: true },
		] as any;
		h.existing({ id: 'codex', appId: 'chatgpt', targetPath: file, name: 'ChatGPT' });
		await flow.load();

		expect(resolveTarget({ app: 'codex' })).toEqual({ appId: 'chatgpt', connectionId: 'codex' });
		expect(resolveTarget({ app: 'chatgpt' })).toEqual({ appId: 'chatgpt', connectionId: 'codex' });
	});

	test('A12: a search that hides the absent app\'s row is cleared; one that shows it (or none) stays', () => {
		const nameOf = (item: any) => item.name || item.nameKey;

		expect(revealClearsQuery('cursor', 'claude', nameOf)).toBe(true);
		expect(revealClearsQuery('cursor', 'curs', nameOf)).toBe(false);
		expect(revealClearsQuery('cursor', '', nameOf)).toBe(false);
		expect(revealClearsQuery('cursor', '   ', nameOf)).toBe(false);
	});
});

describe('Phase 4 final round', () => {
	test('B1: aliases the router resolves to an AI page keep only its allowed fields: history, the first updateTab, the redirect', () => {
		const forms = [
			`/object?objectId=aiApps&action=settings&key=${SENTINEL}&app=codex`,
			`/invite?action=settings&id=aiApps&key=${SENTINEL}`,
			`/membership?action=aiConnect&app=cursor&key=${SENTINEL}`,
		];

		for (const form of forms) {
			const p = Router.getParam(form);

			expect(JSON.stringify(p)).not.toContain(SENTINEL);
			expect(p.page).toBe('main');

			vi.mocked(send).mockClear();
			Router.go(form, {});
			expect(history.location.pathname).not.toContain(SENTINEL);

			const first = vi.mocked(send).mock.calls.find(c => c[0] == 'updateTab');

			expect(first).toBeTruthy();
			expect(JSON.stringify(first)).not.toContain(SENTINEL);

			clearAiLink();
			CommonStore.redirectSet(form);
			expect(CommonStore.redirect).not.toContain(SENTINEL);
			CommonStore.redirectSet('');
		};
		expect(Router.getParam(forms[0])).toEqual({ page: 'main', action: 'settings', id: 'aiApps', app: 'codex' });
		expect(JSON.stringify(paths())).not.toContain(SENTINEL);
	});

	test('B3: a cold link with a pinned restored tab: after the PIN the tab gets its own page back and the link opens (in a new tab)', async () => {
		common.isPinned = true;
		history.push('/auth/pin-check');
		aiLinkArrived('cursor');
		await flush();
		expect(pendingAiLink()).toEqual({ app: 'cursor' });

		// What U.Data.onSpaceSwitch now keeps through the PIN: the tab's restored route
		common.redirect = DOC;
		keyboard.onPinChecked();
		await flush();

		expect(history.location.pathname).toBe(DOC);
		expect(pendingAiLink()).toBeNull();
		expect(vi.mocked(send)).toHaveBeenCalledWith('openRouteInTab', route({ app: 'cursor', route: 'Deeplink' }));
	});

	test('B4: Back after a PIN round trip on AI apps reaches the document; Forward returns to AI apps', () => {
		history.push(DOC);
		history.push(route());
		history.push('/auth/pin-check');
		history.push(route());

		expect(keyboard.checkBack(false)).toBe(true);
		keyboard.onBack(false);
		expect(history.location.pathname).toBe(DOC);
		expect(keyboard.checkForward(false)).toBe(true);

		keyboard.onForward(false);
		expect(history.location.pathname).toBe(route());
		expect(paths()).toEqual([ '/', DOC, route() ]);
	});
});
