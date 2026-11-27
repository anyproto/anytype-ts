/**
 * Connect to AI apps at app level (Phase 4): the self-heal triggers (§6 task 2) and the discovery nudge (§5.9).
 * `startAiConnect` runs once per tab (app.tsx) and returns its disposer. Desktop only: nothing is installed in
 * web mode or the extension. A check rewrites nothing while the API is off or failed (main heals only while its
 * own copy of the setting says the API listens on that port); the nudge only suggests, once per profile.
 *
 * Uses the app's globals `S`, `Renderer` (through `flow`) and `translate` (tests stub them).
 */
import { comparer, reaction } from 'mobx';
import { NotificationStatus, NotificationType, type Notification } from '../../interface/notification';
import { CATALOG } from './catalog';
import * as flow from './flow';

/** Timings, adjustable by tests */
export const startupConfig = {
	/** The self-heal reaction's throttle */
	delay: 2000,
	/** From the start check to the nudge's first try */
	nudgeDelay: 15000,
};

export const NUDGE_ID = 'aiConnectNudge';

export interface StartupEnv {
	/** The window has focus and this tab is the one on screen */
	focused: () => boolean;
	/** No popup is open */
	idle: () => boolean;
	/** Calls `fn` when the nudge may have become possible (window focus, tab shown, popups closed); returns the unsubscribe */
	onChance: (fn: () => void) => () => void;
	/** Adds the local notification to the stack */
	notify: (item: Notification) => void;
};

/** The tab's window; `notify` comes from app.tsx (it owns the notification model) */
export const windowEnv = (): Omit<StartupEnv, 'notify'> => ({
	focused: () => document.hasFocus() && (document.visibilityState == 'visible'),
	idle: () => !S.Popup.isOpen(),
	onChance: (fn: () => void) => {
		const onVisible = () => {
			if (document.visibilityState == 'visible') {
				fn();
			};
		};
		const offPopup = reaction(() => S.Popup.isOpen(), open => {
			if (!open) {
				fn();
			};
		});

		window.addEventListener('focus', fn);
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			window.removeEventListener('focus', fn);
			document.removeEventListener('visibilitychange', onVisible);
			offPopup();
		};
	},
});

export interface NudgePayload {
	appId: string;
	appName: string;
	/** Installed app cards */
	count: number;
};

const accountId = (): string => String(S.Auth.account?.id || '');

/** This account's list is loaded and has no record at all */
const noConnection = (account: string): boolean => S.AiConnect.isLoaded && (S.AiConnect.accountId == account) && !S.AiConnect.connectionList.length;

/**
 * What the nudge suggests when every data condition holds, else null: this account's list is loaded, the API
 * listens, there is no connection at all, and at least one installed `app` card (the first one is named).
 */
export const nudgeCandidate = (): NudgePayload | null => {
	const account = accountId();

	if (!account || !noConnection(account) || (flow.apiState() != 'listening')) {
		return null;
	};

	const installed = CATALOG.filter(it => (it.kind == 'app') && S.AiConnect.isInstalled(it.id));

	if (!installed.length) {
		return null;
	};

	const first = installed[0];

	return { appId: first.id, appName: first.name || translate(first.nameKey), count: installed.length };
};

/** A nudge this tab claimed (main gives the claim to one caller, ever) */
export interface ClaimedNudge {
	payload: NudgePayload;
	account: string;
};

/** `skipped`: not now (try again later); `done`: claimed before or elsewhere, or no longer wanted */
export type NudgeTry = 'skipped' | 'done' | ClaimedNudge;

/**
 * One try: the window conditions, this account's list as it is now (another window may have connected), the
 * data conditions, then main's claim. `alive` is the caller's disposal check.
 */
export const tryNudge = async (env: StartupEnv, alive: () => boolean = () => true): Promise<NudgeTry> => {
	if (!flow.isDesktop() || !env.focused() || !env.idle()) {
		return 'skipped';
	};

	const account = accountId();

	await flow.load();
	if (!alive() || (accountId() != account)) {
		return 'skipped';
	};

	const payload = nudgeCandidate();

	if (!payload) {
		return 'skipped';
	};

	const claimed = await flow.claimNudge();

	// No answer: main's gate refused this tab (not the active one, or the window lost focus)
	if (claimed === null) {
		return 'skipped';
	};
	return claimed ? { payload, account } : 'done';
};

/**
 * Shows a claimed nudge if this tab may now (`shown`), keeps it for later (`held`), or drops it (`done`: another
 * account, or a connection exists now). Every condition is evaluated again on this account's list as it is now
 * (another window may have connected): no successful refresh, no show (A10).
 */
export const showNudge = async (env: StartupEnv, claim: ClaimedNudge, alive: () => boolean = () => true): Promise<'shown' | 'held' | 'done'> => {
	if (accountId() != claim.account) {
		return 'done';
	};
	if (!env.focused() || !env.idle()) {
		return 'held';
	};
	if (!(await flow.load()) || !alive()) {
		return 'held';
	};
	if ((accountId() != claim.account) || !noConnection(claim.account)) {
		return 'done';
	};

	// The API listens and an app card is installed, now; the window shows this tab with no popup, now
	const payload = nudgeCandidate();

	if (!payload || !env.focused() || !env.idle()) {
		return 'held';
	};

	env.notify({
		id: NUDGE_ID,
		type: NotificationType.AiConnect,
		status: NotificationStatus.Created,
		createTime: Math.floor(Date.now() / 1000),
		isLocal: true,
		payload,
	});
	return 'shown';
};

/** The running tab's activation handler (one `startAiConnect` per tab) */
let activated: (() => Promise<void>) | null = null;

/**
 * The tab became the active one (app.tsx `set-active-tab`). Main answers only the active tab, so a pass refused
 * while this one was in the background runs now — also one still settling when the tab came back (A4). Called
 * from the handler, not a reaction: an inactive tab's reactions are paused and may never see the change.
 */
export const aiConnectTabActivated = (): Promise<void> => activated ? activated() : Promise.resolve();

/**
 * Self-heal: a reaction on the account and the API's address and state (throttled). When the account changes:
 * detection (`load(true)`), a check, and ~15 s later the nudge's first try (again on each chance while it was
 * skipped or held). Any other change: a check. A check that didn't go through (this tab wasn't the active one)
 * runs again when the tab becomes active. Logout clears the store (store/auth.ts).
 */
export const startAiConnect = (env: StartupEnv): (() => void) => {
	// Web mode and the extension: nothing to observe
	if (!flow.isDesktop()) {
		return () => {};
	};

	let account = '';
	let token = 0;
	let timer = 0;
	let busy = false;
	let held: ClaimedNudge | null = null;
	let offChance: (() => void) | null = null;
	/** The last check of this account didn't go through: run it again on activation */
	let checkPending = false;
	/** The pass under way (detection and check, or a check) */
	let running: Promise<void> | null = null;

	const stopNudge = () => {
		token++;
		window.clearTimeout(timer);
		timer = 0;
		held = null;
		offChance?.();
		offChance = null;
	};

	const check = async (reason: string, t: number) => {
		const status = await flow.check(reason);

		if (t == token) {
			checkPending = (status == 'failed') || (status == 'unsaved');
		};
	};

	const attempt = async (t: number) => {
		if ((t != token) || busy) {
			return;
		};

		busy = true;

		const alive = () => (t == token);
		let res: NudgeTry | 'shown' | 'held' = 'skipped';

		try {
			if (!held) {
				res = await tryNudge(env, alive);
				if (alive() && (typeof res == 'object')) {
					held = res;
				};
			};
			if (alive() && held) {
				res = await showNudge(env, held, alive);
			};
		} catch (e) {
			res = 'skipped';
		};
		busy = false;

		if (!alive()) {
			return;
		};
		if ((res == 'shown') || (res == 'done')) {
			stopNudge();
			return;
		};
		if (!offChance) {
			offChance = env.onChance(() => attempt(t));
		};
	};

	const run = async (id: string) => {
		if (!id) {
			account = '';
			checkPending = false;
			stopNudge();
			return;
		};
		if (id == account) {
			await check('auto', token);
			return;
		};

		account = id;
		stopNudge();

		const t = token;

		await flow.load(true);
		// Disposed, or another account signed in meanwhile: that one's own pass runs
		if ((t != token) || (accountId() != id)) {
			return;
		};
		await check('start', t);

		if (t == token) {
			timer = window.setTimeout(() => {
				timer = 0;
				attempt(t);
			}, startupConfig.nudgeDelay);
		};
	};

	const dispose = reaction(
		() => [ String(S.Auth.account?.id || ''), String(S.Auth.jsonApiStatus?.listenAddr || ''), !!S.Auth.jsonApiStatus?.success ],
		([ id ]) => {
			const pass = run(id as string);

			running = pass;
			pass.finally(() => {
				if (running == pass) {
					running = null;
				};
			});
		},
		{ delay: startupConfig.delay, equals: comparer.structural, fireImmediately: true },
	);

	const onActivated = async () => {
		// A pass still settling decides first: refused while in the background, it is run again now
		while (running) {
			await running;
		};
		if (!checkPending || !account || (accountId() != account)) {
			return;
		};

		const t = token;
		const pass = (async () => {
			if (!S.AiConnect.isLoaded) {
				await flow.load(true);
			};
			if ((t == token) && (accountId() == account)) {
				await check('activate', t);
			};
		})();

		running = pass;
		await pass;
		if (running == pass) {
			running = null;
		};
	};

	activated = onActivated;

	return () => {
		dispose();
		if (activated == onActivated) {
			activated = null;
		};
		stopNudge();
		account = '';
	};
};
