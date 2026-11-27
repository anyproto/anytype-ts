import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { configure, getObserverTree, makeObservable, observable, runInAction } from 'mobx';
import { scheduleReaction, setReactionsPaused } from '../reactionScheduler';
import { Common as CommonStore } from '../../store/common';
import { NotificationStatus, NotificationType } from '../../interface/notification';
import * as flow from './flow';
import { aiConnectTabActivated, NUDGE_ID, nudgeCandidate, startAiConnect, startupConfig, tryNudge, type StartupEnv } from './startup';
import { installHarness, record, until, type Harness } from './testHarness';

let h: Harness;
const disposers: (() => void)[] = [];
let popupOpen = false;
let common: { isActiveTab: boolean };

/** A tab's window: focus and popups as the test sets them; chance listeners fire on `focus()` (also a closed popup) */
const makeEnv = (focused = true) => {
	const listeners = new Set<() => void>();
	const env = {
		isFocused: focused,
		notify: vi.fn(),
		focus: () => {
			env.isFocused = true;
			[ ...listeners ].forEach(fn => fn());
		},
		listeners,
	};
	const api: StartupEnv = {
		focused: () => env.isFocused,
		idle: () => !popupOpen,
		onChance: fn => {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
		notify: env.notify,
	};

	return { env, api };
};

const start = (api: StartupEnv) => {
	const dispose = startAiConnect(api);

	disposers.push(dispose);
	return dispose;
};

const signIn = (id = 'acc-1') => runInAction(() => {
	h.auth.account = { id };
});

const flush = () => new Promise(r => setTimeout(r, 0));

beforeEach(() => {
	h = installHarness();
	popupOpen = false;
	startupConfig.delay = 0;
	startupConfig.nudgeDelay = 0;
	common = observable({ isActiveTab: true });
	vi.stubGlobal('S', { Auth: h.auth, AiConnect: h.store, Popup: { isOpen: () => popupOpen }, Common: common });
	vi.stubGlobal('translate', (key: string) => key);
	// The app's S.Auth is observable: the self-heal reaction follows it
	makeObservable(h.auth, { account: observable, jsonApiStatus: observable, localApiConfig: observable });
	runInAction(() => {
		h.auth.account = null;
	});
});

afterEach(() => {
	disposers.splice(0).forEach(fn => fn());
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	(window as any).Electron = {};
	flow.resetFlowForTests();
	startupConfig.delay = 2000;
	startupConfig.nudgeDelay = 15000;
});

describe('self-heal triggers (task 2)', () => {
	test('the account becoming ready runs detection, then a check with the live port', async () => {
		const { api } = makeEnv();

		start(api);
		await flush();
		expect(h.cmds()).toEqual([]);

		signIn();
		await until(() => h.calls('aiConnectCheck').length == 1);

		expect(h.calls('aiConnectList')[0].param).toEqual({ accountId: 'acc-1', refresh: true });
		expect(h.calls('aiConnectCheck')[0].param).toMatchObject({ accountId: 'acc-1', apiListening: true, port: 31009 });
	});

	test('a port change runs a check with the new port; with the API off or failed the check says so (main rewrites nothing)', async () => {
		const { api } = makeEnv();

		start(api);
		signIn();
		await until(() => h.calls('aiConnectCheck').length == 1);

		runInAction(() => h.listening(true, 31010));
		await until(() => h.calls('aiConnectCheck').length == 2);
		expect(h.calls('aiConnectCheck')[1].param).toMatchObject({ apiListening: true, port: 31010 });
		// No new detection for a port change
		expect(h.calls('aiConnectList').filter(c => c.param.refresh).length).toBe(1);

		runInAction(() => {
			h.auth.jsonApiStatus = { success: false, listenAddr: '127.0.0.1:31010', error: 'busy' };
		});
		await until(() => h.calls('aiConnectCheck').length == 3);
		expect(h.calls('aiConnectCheck')[2].param.apiListening).toBe(false);
		expect(h.calls('aiConnectCheck')[2].param).not.toHaveProperty('port');

		runInAction(() => h.listening(false));
		await until(() => h.calls('aiConnectCheck').length == 4);
		expect(h.calls('aiConnectCheck')[3].param.apiListening).toBe(false);
	});

	test('Z4: outside the desktop app (web mode, the extension) no reaction is installed at all', async () => {
		(window as any).Electron = { Api: () => {} };

		const { api, env } = makeEnv();

		start(api);
		expect(getObserverTree(h.auth, 'account').observers).toBeUndefined();
		expect(getObserverTree(common, 'isActiveTab').observers).toBeUndefined();
		signIn();
		runInAction(() => h.listening(true, 31010));
		await flush();
		await flush();

		expect(h.cmds()).toEqual([]);
		expect(env.notify).not.toHaveBeenCalled();
	});

	test('the reaction is throttled (2 s by default)', async () => {
		vi.useFakeTimers();
		startupConfig.delay = 2000;

		const { api } = makeEnv();

		start(api);
		signIn();
		await vi.advanceTimersByTimeAsync(1000);
		expect(h.cmds()).toEqual([]);
		await vi.advanceTimersByTimeAsync(1500);
		expect(h.calls('aiConnectList').length).toBeGreaterThan(0);
		vi.useRealTimers();
	});
});

describe('discovery nudge (§5.9)', () => {
	const NOTIFICATION = {
		id: NUDGE_ID,
		type: NotificationType.AiConnect,
		status: NotificationStatus.Created,
		createTime: expect.any(Number),
		isLocal: true,
		payload: { appId: 'claude-desktop', appName: 'Claude Desktop', count: 3 },
	};

	test('shown once, in the focused tab, with the first installed app and the count', async () => {
		const { api, env } = makeEnv();

		start(api);
		signIn();
		await until(() => env.notify.mock.calls.length > 0);

		expect(h.calls('aiConnectClaimNudge')).toEqual([ { cmd: 'aiConnectClaimNudge', param: { accountId: 'acc-1' } } ]);
		expect(env.notify).toHaveBeenCalledTimes(1);
		expect(env.notify.mock.calls[0][0]).toEqual(NOTIFICATION);
		expect(Math.abs(env.notify.mock.calls[0][0].createTime - Date.now() / 1000)).toBeLessThan(5);

		// Later focus events do nothing more
		env.focus();
		await flush();
		expect(h.calls('aiConnectClaimNudge').length).toBe(1);
	});

	test('two tabs (or windows): exactly one shows it; the other is told it was claimed', async () => {
		const a = makeEnv();
		const b = makeEnv();

		start(a.api);
		start(b.api);
		signIn();
		await until(() => h.calls('aiConnectClaimNudge').length == 2);
		await flush();

		expect(a.env.notify.mock.calls.length + b.env.notify.mock.calls.length).toBe(1);
	});

	test('after a restart (claimed before): none', async () => {
		h.main.m.nudgeClaimed = true;

		const { api, env } = makeEnv();

		start(api);
		signIn();
		await until(() => h.calls('aiConnectClaimNudge').length == 1);
		await flush();
		expect(env.notify).not.toHaveBeenCalled();
	});

	test('an unfocused window does not claim; it tries again when focused', async () => {
		const { api, env } = makeEnv(false);

		start(api);
		signIn();
		await until(() => env.listeners.size == 1);
		expect(h.calls('aiConnectClaimNudge')).toEqual([]);

		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
		expect(h.calls('aiConnectClaimNudge').length).toBe(1);
		expect(env.listeners.size).toBe(0);
	});

	test('main refusing the tab (no answer) is not a claim: tried again on focus', async () => {
		h.main.m.claimDenied = true;

		const { api, env } = makeEnv();

		start(api);
		signIn();
		await until(() => env.listeners.size == 1);
		expect(env.notify).not.toHaveBeenCalled();

		h.main.m.claimDenied = false;
		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
	});

	test('an open popup skips it until the next focus', async () => {
		popupOpen = true;

		const { api, env } = makeEnv();

		start(api);
		signIn();
		await until(() => env.listeners.size == 1);
		expect(h.calls('aiConnectClaimNudge')).toEqual([]);

		popupOpen = false;
		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
	});

	test('waits ~15 s after the start check', async () => {
		vi.useFakeTimers();
		startupConfig.nudgeDelay = 15000;

		const { api, env } = makeEnv();

		start(api);
		signIn();
		await vi.advanceTimersByTimeAsync(100);
		expect(h.calls('aiConnectCheck').length).toBe(1);
		await vi.advanceTimersByTimeAsync(14000);
		expect(h.calls('aiConnectClaimNudge')).toEqual([]);
		await vi.advanceTimersByTimeAsync(1500);
		expect(env.notify).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	test('the data conditions: API listening, no connection at all, an installed app card', async () => {
		const ready = async () => {
			await flow.load();
		};

		signIn();
		await ready();
		expect(nudgeCandidate()).toEqual({ appId: 'claude-desktop', appName: 'Claude Desktop', count: 3 });

		h.listening(false);
		expect(nudgeCandidate()).toBeNull();
		h.listening(true);

		h.existing();
		await ready();
		expect(nudgeCandidate()).toBeNull();

		h.main.m.records.clear();
		h.main.m.detections = h.main.m.detections.map(d => ({ ...d, installed: false }));
		await ready();
		expect(nudgeCandidate()).toBeNull();

		// Only `app` cards count: an installed Other / unsupported card doesn't
		h.main.m.detections = [ { appId: 'chatgpt-classic', installed: true, targetId: null, targetPaths: [], canRestart: false } as any ];
		await ready();
		expect(nudgeCandidate()).toBeNull();

		h.main.m.detections = [ { appId: 'cursor', installed: true, targetId: 'cursor', targetPaths: [ '/Users/me/.cursor/mcp.json' ], canRestart: true } ];
		await ready();
		expect(nudgeCandidate()).toEqual({ appId: 'cursor', appName: 'Cursor', count: 1 });

		// Another account's list never counts
		runInAction(() => {
			h.auth.account = { id: 'acc-2' };
		});
		expect(nudgeCandidate()).toBeNull();
	});

	test('a removed record still counts as a connection: no nudge', async () => {
		signIn();
		h.existing({ removed: true, revokePending: [ 'hash-old' ] });
		await flow.load();
		expect(nudgeCandidate()).toBeNull();

		const { api, env } = makeEnv();

		expect(await tryNudge(api)).toBe('skipped');
		expect(env.notify).not.toHaveBeenCalled();
		expect(h.calls('aiConnectClaimNudge')).toEqual([]);
	});

	test('nothing is minted, written or connected by the nudge', async () => {
		const { api, env } = makeEnv();

		start(api);
		signIn();
		await until(() => env.notify.mock.calls.length == 1);

		expect(h.heart.state.creates).toBe(0);
		expect(h.cmds().filter(c => ![ 'aiConnectList', 'aiConnectCheck', 'aiConnectClaimNudge' ].includes(c))).toEqual([]);
	});
});

describe('Z4: self-heal with the live state', () => {
	test('Z4: a check refused while the tab was in the background runs when it becomes active, with the port of that moment', async () => {
		const { api } = makeEnv();

		runInAction(() => {
			common.isActiveTab = false;
		});
		h.main.m.denied = true;
		start(api);
		signIn();
		await until(() => h.calls('aiConnectList').length >= 2);
		runInAction(() => h.listening(true, 31010));
		await until(() => h.calls('aiConnectList').length >= 3);
		await flush();
		expect(h.calls('aiConnectCheck')).toEqual([]);

		h.main.m.denied = false;
		runInAction(() => {
			common.isActiveTab = true;
		});
		await aiConnectTabActivated();
		expect(h.calls('aiConnectCheck').length).toBe(1);
		expect(h.calls('aiConnectCheck')[0].param).toMatchObject({ accountId: 'acc-1', apiListening: true, port: 31010 });

		// Done: switching tabs again doesn't repeat it
		await aiConnectTabActivated();
		expect(h.calls('aiConnectCheck').length).toBe(1);
	});

	test('Z4: detection that answers after disposal starts no check', async () => {
		const { api } = makeEnv();
		const held = h.main.holdNext('aiConnectList');
		const dispose = start(api);

		signIn();
		await until(() => h.calls('aiConnectList').length == 1);
		dispose();
		held.resolve();
		await flush();
		await flush();
		expect(h.calls('aiConnectCheck')).toEqual([]);
	});

	test('Z4: detection that answers after an account switch starts no check of its own', async () => {
		const { api } = makeEnv();
		const held = h.main.holdNext('aiConnectList');

		start(api);
		signIn('acc-1');
		await until(() => h.calls('aiConnectList').length == 1);
		signIn('acc-2');
		await until(() => h.calls('aiConnectCheck').length == 1);
		held.resolve();
		await flush();
		await flush();
		expect(h.calls('aiConnectCheck').map(c => c.param.accountId)).toEqual([ 'acc-2' ]);
	});
});

describe('Z9: nudge eligibility at display time', () => {
	test('Z9: a popup opened while the claim was pending holds the nudge; it shows once the popup closes', async () => {
		const { api, env } = makeEnv();
		const claim = h.main.holdNext('aiConnectClaimNudge');

		start(api);
		signIn();
		await until(() => h.calls('aiConnectClaimNudge').length == 1);
		popupOpen = true;
		claim.resolve();
		await until(() => env.listeners.size == 1);
		expect(env.notify).not.toHaveBeenCalled();

		popupOpen = false;
		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
		expect(h.calls('aiConnectClaimNudge').length).toBe(1);
		expect(env.listeners.size).toBe(0);
	});

	test('Z9: focus lost while the claim was pending: held, shown on the next focus', async () => {
		const { api, env } = makeEnv();
		const claim = h.main.holdNext('aiConnectClaimNudge');

		start(api);
		signIn();
		await until(() => h.calls('aiConnectClaimNudge').length == 1);
		env.isFocused = false;
		claim.resolve();
		await until(() => env.listeners.size == 1);
		expect(env.notify).not.toHaveBeenCalled();

		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
	});

	test('Z9: a connection made in another window meanwhile: the try reloads the list and claims nothing', async () => {
		const { api, env } = makeEnv(false);

		start(api);
		signIn();
		await until(() => env.listeners.size == 1);

		// Window B connected Cursor; this window's store still has the old empty list
		h.main.m.records.set('cursor', record());
		expect(h.store.connectionList).toEqual([]);
		env.focus();
		await until(() => h.store.connectionList.length == 1);
		await flush();

		expect(h.calls('aiConnectClaimNudge')).toEqual([]);
		expect(env.notify).not.toHaveBeenCalled();
	});

	test('Z9: a connection that appears after the claim drops the held nudge', async () => {
		const { api, env } = makeEnv();
		const claim = h.main.holdNext('aiConnectClaimNudge');

		start(api);
		signIn();
		await until(() => h.calls('aiConnectClaimNudge').length == 1);
		popupOpen = true;
		claim.resolve();
		await until(() => env.listeners.size == 1);

		h.existing();
		popupOpen = false;
		env.focus();
		await until(() => env.listeners.size == 0);
		expect(env.notify).not.toHaveBeenCalled();
	});

	test('Z9: disposed while the claim was pending: nothing is shown', async () => {
		const { api, env } = makeEnv();
		const claim = h.main.holdNext('aiConnectClaimNudge');
		const dispose = start(api);

		signIn();
		await until(() => h.calls('aiConnectClaimNudge').length == 1);
		dispose();
		claim.resolve();
		await flush();
		await flush();
		expect(env.notify).not.toHaveBeenCalled();
	});

	test('Z9: with a connection in the profile (made in another window) the try claims nothing', async () => {
		signIn();
		h.main.m.records.set('cursor', record());

		const { api, env } = makeEnv();

		// This window's store is stale (empty) until the try reloads it
		expect(h.store.connectionList).toEqual([]);
		expect(await tryNudge(api)).toBe('skipped');
		expect(h.store.connectionList.length).toBe(1);
		expect(h.calls('aiConnectClaimNudge')).toEqual([]);
		expect(env.notify).not.toHaveBeenCalled();
	});
});

describe('A4: activation retries under the production scheduler', () => {
	beforeEach(() => {
		// The app's reaction scheduler: an inactive tab's reactions are paused (isActiveTabSet)
		configure({ reactionScheduler: f => scheduleReaction(f) });
		vi.stubGlobal('S', { Auth: h.auth, AiConnect: h.store, Popup: { isOpen: () => popupOpen }, Common: CommonStore, Block: { flushDeferredUpdates: () => {} } });
		CommonStore.isActiveTabSet(true);
	});

	afterEach(() => {
		setReactionsPaused(false);
		configure({ reactionScheduler: f => f() });
	});

	/** What app.tsx's `set-active-tab` handler does for this tab */
	const setActiveTab = (active: boolean) => {
		CommonStore.isActiveTabSet(active);
		if (active) {
			return aiConnectTabActivated();
		};
		return Promise.resolve();
	};

	test('A4: a start pass refused after switching away runs again when the tab comes back', async () => {
		const { api } = makeEnv();
		const held = h.main.holdNext('aiConnectList');

		start(api);
		signIn();
		await until(() => h.calls('aiConnectList').length == 1);

		await setActiveTab(false);
		h.main.m.denied = true;
		held.resolve(null);
		await until(() => h.calls('aiConnectList').length >= 2);
		await flush();
		expect(h.calls('aiConnectCheck')).toEqual([]);
		expect(h.store.isLoaded).toBe(false);

		h.main.m.denied = false;
		await setActiveTab(true);
		expect(h.calls('aiConnectCheck').length).toBe(1);
		expect(h.calls('aiConnectCheck')[0].param).toMatchObject({ accountId: 'acc-1', apiListening: true, port: 31009 });
		expect(h.store.isLoaded).toBe(true);
		expect(h.store.loadFailed).toBe(false);
	});

	test('A4: an activation that arrives while the refused check is still settling retries once it settled', async () => {
		const { api } = makeEnv();
		const held = h.main.holdNext('aiConnectCheck');

		start(api);
		signIn();
		await until(() => h.calls('aiConnectCheck').length == 1);

		await setActiveTab(false);
		const back = setActiveTab(true);

		held.resolve(null);
		await back;
		expect(h.calls('aiConnectCheck').length).toBe(2);
		expect(h.store.loadFailed).toBe(false);
	});
});

describe('A10: a held nudge re-checks everything', () => {
	const holdWithPopup = async (env: any) => {
		const claim = h.main.holdNext('aiConnectClaimNudge');

		await until(() => h.calls('aiConnectClaimNudge').length == 1);
		popupOpen = true;
		claim.resolve();
		await until(() => env.listeners.size == 1);
	};

	test('A10: another window connected (only main\'s records changed): the held nudge is dropped', async () => {
		const { api, env } = makeEnv();

		start(api);
		signIn();
		await holdWithPopup(env);

		h.main.m.records.set('cursor', record());
		expect(h.store.connectionList).toEqual([]);
		popupOpen = false;
		env.focus();
		await until(() => env.listeners.size == 0);
		expect(env.notify).not.toHaveBeenCalled();
		expect(h.store.connectionList.length).toBe(1);
	});

	test('A10: the API turned off while held: not shown; shown once it listens again', async () => {
		const { api, env } = makeEnv();

		start(api);
		signIn();
		await holdWithPopup(env);

		runInAction(() => h.listening(false));
		popupOpen = false;
		env.focus();
		await flush();
		await flush();
		expect(env.notify).not.toHaveBeenCalled();
		expect(env.listeners.size).toBe(1);

		runInAction(() => h.listening(true));
		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
		expect(h.calls('aiConnectClaimNudge').length).toBe(1);
	});

	test('A10: a failed list refresh shows nothing', async () => {
		const { api, env } = makeEnv();

		start(api);
		signIn();
		await holdWithPopup(env);

		h.main.m.listFails = true;
		popupOpen = false;
		env.focus();
		await flush();
		await flush();
		expect(env.notify).not.toHaveBeenCalled();

		h.main.m.listFails = false;
		env.focus();
		await until(() => env.notify.mock.calls.length == 1);
	});
});
