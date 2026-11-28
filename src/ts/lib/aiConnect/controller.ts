/**
 * Connect to AI apps: the popup's state and transitions (§5.2–§5.6), without React and without text. The
 * popup renders `get()` and calls the methods; every call to main or heart goes through `flow`. A test
 * drives this class with deferred replies exactly as the popup does.
 *
 * It holds no key (tokens-plan §3.2): the manual view knows its key only by hash (`manual.keyHash`,
 * `manual.oldHash`) and shows it masked; every Copy goes through `flow.copySecret`, which fetches the key for
 * that one call. Messages are text keys with arguments, or errors; the popup translates them.
 */
import type {
	AiAppId, AiConnection, AiError, AiNextStep, AiPlan, AiProbeResult, AiRoute, AiSetup, AiStep, AiTier,
} from '../../interface/aiConnect';
import type { LinkAppGrant } from '../../interface/linkApproval';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { DEFAULT_GRANT, getCatalogItem, KEY_PLACEHOLDER } from './catalog';
import { track } from './events';
import * as flow from './flow';
import { isMovedRecord, movedConnection } from './gallery';
import { withFinishingStep } from './steps';

export type AiConnectView = 'connect' | 'finish' | 'manage' | 'manual' | 'unsupported' | 'remote';

/** `bundle`: Claude's extension, from the record's save until heart says Claude uses the key (§3.3) */
export type AiFinishPhase =
	| 'delivering' | 'needsQuit' | 'needsQuitSelf' | 'bundle' | 'step' | 'afterRestart' | 'added' | 'connected'
	| 'stalled' | 'unconfirmed' | 'error';

/**
 * create: no key yet, Create key mints one. confirm: a new key waits for "I've updated <App>". done: the key in
 * place. restoreOld: the previous entry was removed (Claude Code): the old key, or the new one. prerequisite:
 * the instructions have nothing to deliver yet (install or update a CLI first): Recheck, no key.
 */
export type AiManualMode = 'create' | 'confirm' | 'done' | 'restoreOld' | 'prerequisite';

/** A message for the popup to translate: a text key with arguments, or an error (with the file it concerns) */
export type AiMsg = { key: string; args?: string[] } | { error: AiError; target?: string };

/** `data` of the aiConnect popup (§5.2) */
export interface AiConnectPopupData {
	appId: AiAppId;
	connectionId?: string;
	view?: AiConnectView;
	prefill?: flow.Prefill;
};

export interface AiConnectForm {
	grant: LinkAppGrant;
	name: string;
	/** Expiry choice in days (0 = never), when no absolute expiry is fixed */
	days: number;
	/** A reconnect's absolute expiry, shown as a date */
	fixedExpireAt?: number;
	route: AiRoute;
	tier: AiTier;
};

/** A reconnect continued through the form: the record, and the access its old key has (V2) */
export interface AiReconnectInput {
	connection: AiConnection;
	grant: LinkAppGrant;
	expireAt: number;
	/** The old key is gone: no re-read, the user confirms the stored values */
	keyGone: boolean;
};

export interface AiManualState {
	mode: AiManualMode;
	/** The hash of the key this view sets up (pending or recorded); '' before Create key. The key itself is never here */
	keyHash: string;
	/** restoreOld: the previous key's hash */
	oldHash: string;
	plan: AiPlan | null;
	steps: AiStep[];
	loading: boolean;
	notice: AiMsg | null;
	error: AiMsg | null;
	existing: AiConnection | null;
	/** Absolute expiry for a key minted here, resolved once (V15) */
	expireAt: number;
	/** The port the plan (and its key-bearing snippets) was made for (W13) */
	planPort: number;
	/** The key was recorded but its probe failed: Retry check (W14) */
	probeFailed: boolean;
	/** Other app: the setups this computer offers, and the one chosen (`command`: the app starts Anytype's connector, the key in its `env`) */
	setups: AiSetup[];
	setup: AiSetup;
};

/** Claude's extension after the record's save: what main could and couldn't do (§3.3, step 4) */
export interface AiBundleState {
	copyFailed: boolean;
	openFailed: boolean;
	/** The installed extension takes the key in Claude's Configure; the bundle wasn't opened */
	configure: boolean;
	/** The 10-minute watch for heart's isActive ran out: Check again */
	stopped: boolean;
	/** The sheet's key is on the clipboard: main copied it and hasn't cleared it yet (the deadline, another copy, …) */
	copied: boolean;
};

export interface AiConnectState {
	appId: AiAppId;
	view: AiConnectView;
	connectionId: string;
	busy: boolean;

	form: AiConnectForm;
	plan: AiPlan | null;
	planLoading: boolean;
	formNotice: 'reconnect' | 'grantChanged' | null;
	formErrors: AiMsg[];
	reconnect: AiReconnectInput | null;
	/** The sheet previews a same-key delivery (a Replace on the settings-file fallback): its values can't change (W3) */
	formLocked: boolean;
	/** The record's file moved under the same target id: the sheet shows this new place to approve (X3) */
	movedTo: string;
	/** The place the same connection moves from (its old key stops working there), named with `movedTo` (Y7) */
	movedFrom: string;

	phase: AiFinishPhase;
	step: AiNextStep;
	restartFailed: boolean;
	openFailed: boolean;
	probeOk: boolean;
	errors: AiMsg[];
	canManual: boolean;
	/** The settings-file route can continue from the error (LM Studio's link didn't open) */
	fileRouteFromError: boolean;
	/** A step was done in the app but Anytype couldn't save that; Try again only saves it (V18) */
	ackFailed: boolean;
	/** Delivered, but main couldn't save its list yet (V18) */
	unsaved: boolean;
	/** The wait for an unconfirmed CLI write ran out: Check again (W12) */
	pollStopped: boolean;
	lastError: AiError | null;
	/** Phase `bundle` */
	bundle: AiBundleState | null;

	manual: AiManualState;

	access: flow.LiveAccess | null;
	manageNotice: AiMsg | null;
	/** What Manage learned now (V22): the key is gone, or the entry belongs to someone else */
	override: 'accessEnded' | 'conflict' | null;
	/** After a disconnect: what is left; `path` the leftover file, revealed only where main reveals that file (W19) */
	result: { lines: AiMsg[]; reveal: boolean; path: string } | null;
};

export interface AiConnectUi {
	close: () => void;
	toast: (msg: AiMsg) => void;
};

type Consent = { allowQuit?: boolean; quitConfirmed?: boolean };

/** A record with the key a sheet or a confirmation showed, under the account it was shown for (D1C-08) */
export type Shown = { accountId: string; id: string; appHash: string };

const accountNow = (): string => String(S.Auth.account?.id || '');

/** The approved delivery, resolved once on submit; a retry adds only its new consent (V15) */
type Attempt =
	| { kind: 'connect'; input: flow.ConnectInput }
	| { kind: 'reconnect'; connection: AiConnection; opts: flow.ReconnectOptions };

const copyGrant = (grant: LinkAppGrant): LinkAppGrant => ({ ...grant, spaceIds: [ ...(grant?.spaceIds || []) ] });
const daysToExpireAt = (days: number): number => days ? Math.floor(Date.now() / 1000) + days * 86400 : 0;
const isError = (m: any): m is { error: AiError } => !!m && ('error' in m);

const EMPTY_MANUAL: AiManualState = {
	mode: 'create', keyHash: '', oldHash: '', plan: null, steps: [], loading: false, notice: null, error: null, existing: null, expireAt: 0, planPort: 0, probeFailed: false,
	setups: [], setup: 'url',
};

/** Statuses that need the user's decision in Manage: a finishing step can't go on past them (W12) */
const ATTENTION: AiConnection['status'][] = [ 'removed', 'accessEnded', 'conflict', 'reconnect', 'unreadable', 'notInstalled', 'revokeFailed', 'disconnected' ];

/** What Retry check found, as a message (W15): a failed lookup is not a failed probe */
export const probeMessage = (res: flow.RetryProbeResult): AiMsg => {
	if (res.ok) {
		return { key: 'aiConnectProbeOk' };
	};
	if (('lookupFailed' in res) && res.lookupFailed) {
		return { key: 'aiConnectManageLookupFailed' };
	};
	return { error: { stage: 'probe', category: ('category' in res) ? res.category : 'unknown' } };
};

/**
 * The access Manage shows for a record: its own, as main's last check reconciled it with heart (no key lookup,
 * D1S-15). `present: false` for a key that ended (status `accessEnded`) or a retired one (appHash '')
 */
const recordAccess = (c: AiConnection): flow.LiveAccess => ({
	ok: true, present: !!c.appHash && (c.status != 'accessEnded') && !c.removed, grant: c.grant, expireAt: c.expireAt,
});

export class AiConnectController {

	private state: AiConnectState;
	private listeners = new Set<() => void>();
	private disposed = false;
	/** The popup is closing (its onClose ran): nothing new starts (W11) */
	private closing = false;
	private attempt: Attempt | null = null;
	private method: flow.AiSetupMethod | undefined = undefined;
	private pollToken = 0;
	/** Only the latest preview request may replace the plan and enable submit (W13) */
	private planSeq = 0;
	private manualSeq = 0;
	/** The hash of the record the shown preview would replace: a submit never switches it silently (W7) */
	private formExisting: string | null | undefined = undefined;
	/** The hash of the key this attempt delivered: its finishing follows that key (W12) */
	private followed = '';
	/**
	 * The record and key the Finish sheet of Claude's extension stands for, as shown (D1C-08): its watch, Copy key
	 * and Cancel setup act on that key only; another key there now ends the sheet
	 */
	private sheet: Shown | null = null;
	/** The keys the manual view put on the clipboard (by hash): closing the popup takes them off (D1S-11) */
	private copied = new Set<string>();
	/** The Finish sheet's copied key reaches main's clipboard deadline (§3.4) */
	private clipTimer: ReturnType<typeof setTimeout> | null = null;
	/** Manage's load in flight (its plan): Replace waits for it (W2) */
	private manageLoad: Promise<void> | null = null;
	/** The expiry choice the connect attempt was submitted with (X1) */
	private submitted: { days: number; fixedExpireAt?: number } | null = null;
	private readonly data: AiConnectPopupData;
	private readonly ui: AiConnectUi;
	private readonly appName: string;

	constructor (data: AiConnectPopupData, ui: AiConnectUi, appName: string) {
		this.data = data;
		this.ui = ui;
		this.appName = appName;

		const item = getCatalogItem(data.appId);
		const prefill = data.prefill;
		const start = this.initial();
		const reconnectOf = (prefill && data.connectionId) ? S.AiConnect.getById(data.connectionId) : null;

		this.state = {
			appId: data.appId,
			view: start.view,
			connectionId: start.connectionId,
			busy: false,
			form: {
				grant: copyGrant(prefill?.grant || DEFAULT_GRANT),
				name: prefill?.name || appName,
				days: 0,
				fixedExpireAt: prefill?.expireAt,
				route: prefill?.route || item?.defaultRoute || item?.routes[0] || 'http',
				tier: prefill?.tier || this.recommended(),
			},
			plan: null,
			planLoading: false,
			formNotice: prefill ? 'reconnect' : null,
			formErrors: [],
			reconnect: reconnectOf ? { connection: reconnectOf, grant: prefill.grant, expireAt: prefill.expireAt || 0, keyGone: true } : null,
			formLocked: false,
			movedTo: '',
			movedFrom: '',
			phase: 'delivering',
			step: 'none',
			restartFailed: false,
			openFailed: false,
			probeOk: false,
			errors: [],
			canManual: false,
			fileRouteFromError: false,
			ackFailed: false,
			unsaved: false,
			pollStopped: false,
			lastError: null,
			bundle: null,
			manual: { ...EMPTY_MANUAL },
			access: null,
			manageNotice: null,
			override: null,
			result: null,
		};
	};

	// ---------------------- plumbing ---------------------- //

	get = (): AiConnectState => this.state;

	subscribe = (fn: () => void): (() => void) => {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	};

	private set (patch: Partial<AiConnectState>): void {
		if (this.disposed) {
			return;
		};
		this.state = { ...this.state, ...patch };
		this.listeners.forEach(fn => fn());
	};

	private setManual (patch: Partial<AiManualState>): void {
		this.set({ manual: { ...this.state.manual, ...patch } });
	};

	/**
	 * The popup closed (any path): polls stop, the flow's pending key is released (§5.2) and what the manual view
	 * copied leaves the clipboard (D1S-11); idempotent
	 */
	dispose (): Promise<void> {
		const copied = [ ...this.copied ];

		this.copied.clear();
		this.closing = true;
		this.disposed = true;
		this.pollToken++;
		this.clipboardTimer(false);
		this.listeners.clear();
		return Promise.all([ flow.releasePendingKey(), ...copied.map(appHash => flow.clearCopied({ appHash })) ]).then(() => {});
	};

	/**
	 * The popup's onClose, synchronously, before its close animation ends and it unmounts (W11): polls stop,
	 * no delivery starts, and the flow stops before its next side effect. `dispose` follows on unmount.
	 */
	cancel (): void {
		this.closing = true;
		this.pollToken++;
		flow.requestCancel();
	};

	get isDisposed (): boolean {
		return this.disposed;
	};

	private initial (): { view: AiConnectView; connectionId: string } {
		const { appId, view } = this.data;
		const connectionId = this.data.connectionId || '';
		const item = getCatalogItem(appId);

		if (view) {
			return { view, connectionId };
		};
		if (!item || (item.kind == 'unsupported')) {
			return { view: 'unsupported', connectionId };
		};
		if (connectionId) {
			return { view: 'manage', connectionId };
		};
		if (item.kind == 'manual') {
			return { view: 'manual', connectionId };
		};

		const mapped = S.AiConnect.getByApp(appId);

		return mapped ? { view: 'manage', connectionId: mapped.id } : { view: 'connect', connectionId };
	};

	/** The effective recommended tier: the record's, the card's */
	recommended (): AiTier {
		const c = this.connection();
		return c?.recommendedTier || getCatalogItem(this.data.appId)?.defaultTier || 'full';
	};

	connection (): AiConnection | null {
		const id = this.state?.connectionId || this.data.connectionId;
		return id ? S.AiConnect.getById(id) : null;
	};

	/** The record a delivery for this card replaces: a reconnect's, else the one at its target id unless it is being removed */
	private existingRecord (): AiConnection | null {
		if (this.state.reconnect) {
			return this.state.reconnect.connection;
		};

		const rec = S.AiConnect.atTarget(this.data.appId);
		return (rec && !rec.removed) ? rec : null;
	};

	/** The route the plan uses (it may differ from the one asked for) */
	private route (): AiRoute {
		return this.state.plan?.route || this.state.form.route;
	};

	/**
	 * The app whose restart loads the settings (V19): ChatGPT when the Codex card's shared file is the one the
	 * ChatGPT app reads (that is why the adapter asked for a restart), else the card itself.
	 */
	restartTarget (step: AiNextStep = this.state.step): AiAppId {
		const c = this.connection();
		const appId = c?.appId || this.data.appId;

		if ((step == 'restart') && ((appId == 'codex') || (this.data.appId == 'codex')) && S.AiConnect.isInstalled('chatgpt')) {
			return 'chatgpt';
		};
		return appId;
	};

	/** The name of the app a step concerns: the restart target's for a restart (the preview, manual steps, Manage, W16) */
	restartName (step: AiNextStep): string {
		const id = this.restartTarget(step);
		return (id == this.data.appId) ? this.appName : (getCatalogItem(id)?.name || this.appName);
	};

	/**
	 * Which settings-file route the finishing view offers: LM Studio's mcp.json, or none. Claude's settings file
	 * is chosen on the sheet, before a key is minted (`useConfigRoute`, §3.3)
	 */
	fileRouteKind (): 'lmstudio' | null {
		const { plan } = this.state;
		const c = this.connection();

		if ((this.data.appId == 'lmstudio') && (this.method != 'config') && ((plan?.method == 'deeplink') || (c?.method == 'deeplink'))) {
			return 'lmstudio';
		};
		return null;
	};

	// ---------------------- start ---------------------- //

	init (): void {
		const { view, connectionId } = this.state;

		switch (view) {
			case 'connect': {
				this.loadPlan();
				break;
			};
			case 'manual': {
				this.enterManual('create', connectionId ? S.AiConnect.getById(connectionId) : undefined);
				break;
			};
			case 'manage': {
				if (!this.connection()) {
					// Another window disconnected it already: nothing to show
					this.ui.close();
					return;
				};
				this.loadManage();
				break;
			};
			case 'finish': {
				this.resumeFinish();
				break;
			};
			case 'unsupported': {
				track.unsupportedShown(this.data.appId);
				break;
			};
		};
	};

	// ---------------------- the connect sheet ---------------------- //

	setForm (patch: Partial<AiConnectForm>): void {
		const before = this.state.form;

		this.set({ form: { ...before, ...patch } });
		if ((this.state.view == 'connect') && (((patch.route !== undefined) && (patch.route != before.route)) || ((patch.tier !== undefined) && (patch.tier != before.tier)))) {
			this.loadPlan();
		};
	};

	async loadPlan (): Promise<void> {
		const item = getCatalogItem(this.data.appId);

		if (!item || (item.kind != 'app')) {
			return;
		};

		const seq = ++this.planSeq;

		this.set({ planLoading: true });

		const { form } = this.state;
		// Claude's extension always gets the Full tool set (§3.3)
		const tier = (this.method == 'package') ? 'full' : form.tier;
		const res = await flow.plan({ appId: this.data.appId, route: form.route, tier, method: this.method });

		// A reply to an older request (another route or tier asked since) changes nothing (W13)
		if (this.disposed || (seq != this.planSeq)) {
			return;
		};
		if ('error' in res) {
			this.set({ planLoading: false, plan: null, formErrors: [ { error: res.error } ] });
			return;
		};
		// The extension's plan: the sheet shows "Tool set: Full", and that is what is delivered
		if ((res.plan.method == 'package') && (form.tier != 'full')) {
			this.set({ form: { ...form, tier: 'full' } });
		};
		this.showPlan(res.plan);
	};

	/** Claude Desktop, Advanced: its settings file instead of the extension, chosen before a key is minted (§3.3) */
	useConfigRoute (): void {
		if ((this.data.appId != 'claude-desktop') || this.state.busy || (this.method == 'config')) {
			return;
		};
		this.method = 'config';
		this.loadPlan();
	};

	/** The sheet's plan is Claude's extension route (Full only) */
	bundlePlan (): boolean {
		return (this.data.appId == 'claude-desktop') && (this.state.plan?.method == 'package');
	};

	/** The preview shown, and the record it would replace as of now (W7) */
	private showPlan (p: AiPlan): void {
		this.formExisting = this.existingRecord()?.appHash ?? null;
		this.set({ planLoading: false, plan: p });
	};

	/** The sheet, refreshed, with messages; a reconnect keeps its record, access, expiry, name, route and tier (V2) */
	private backToForm (p: AiPlan | null, errors: AiMsg[]): void {
		this.set({ view: 'connect', formErrors: errors, busy: false });
		if (p) {
			this.planSeq++;
			this.showPlan(p);
		} else {
			this.loadPlan();
		};
	};

	/** The form takes a reconnect's values: the record's name, route and tier, the old key's access and absolute expiry */
	private prefillReconnect (r: AiReconnectInput, notice: 'reconnect' | 'grantChanged' | null): void {
		const c = r.connection;

		// S2: a Command connection stays one on the form too, and Claude's config route keeps its method
		const method = flow.planMethodOf(c);

		if ((method == 'command') || (method == 'config')) {
			this.method = method;
		};

		this.set({
			reconnect: r,
			formNotice: notice,
			formLocked: false,
			movedTo: '',
			movedFrom: '',
			form: { grant: copyGrant(r.grant), name: c.name, days: 0, fixedExpireAt: r.expireAt || undefined, route: c.route, tier: c.tier },
		});
	};

	/**
	 * Connect / Replace and connect / Connect this location. The approved input is resolved once here,
	 * including the absolute expiry and the replace the user saw (V3, V15).
	 */
	submit (): void {
		const { plan, form, reconnect, formLocked } = this.state;
		const a = this.attempt;

		// Only the latest preview's reply enables submit (W13)
		if (!plan || this.state.busy || this.state.planLoading) {
			return;
		};
		// A same-key delivery that met a foreign entry: Replace adds only the consent to the entry shown (W3)
		if (formLocked && (a?.kind == 'connect') && a.input.sameKey) {
			a.input = { ...a.input, shown: plan, replace: plan.replace ? { ...plan.replace } : undefined };
			this.deliver({});
			return;
		};
		// Spaces are an explicit choice: nothing is preselected for a new connection
		if (!isValidLinkGrant(form.grant)) {
			return;
		};
		if (!plan.canApply && plan.steps.length) {
			this.enterManual('create');
			return;
		};

		const existing = this.existingRecord();

		// Another record arrived at this place since the preview: its Manage, never a silent takeover (W7)
		if ((this.formExisting !== undefined) && ((existing?.appHash ?? null) !== this.formExisting)) {
			this.afterStale();
			return;
		};

		const bundle = (plan.method == 'package');
		const input: flow.ConnectInput = {
			appId: this.data.appId,
			route: plan.route,
			tier: bundle ? 'full' : form.tier,
			recommendedTier: this.recommended(),
			grant: copyGrant(form.grant),
			name: form.name.trim(),
			expireAt: form.fixedExpireAt || daysToExpireAt(form.days),
			method: bundle ? 'package' : ((this.method == 'config') ? 'config' : undefined),
			existing,
			shown: plan,
			replace: plan.replace ? { ...plan.replace } : undefined,
			reread: (reconnect && !reconnect.keyGone) ? { hash: reconnect.connection.appHash, grant: reconnect.grant, expireAt: reconnect.expireAt } : undefined,
		};

		this.attempt = { kind: 'connect', input };
		this.submitted = { days: form.days, fixedExpireAt: form.fixedExpireAt };
		track.start(this.data.appId, plan.route);
		this.deliver({});
	};

	/** Runs the approved attempt with one more consent; the finishing view shows its progress */
	async deliver (consent: Consent): Promise<void> {
		const attempt = this.attempt;

		if (!attempt || this.disposed || this.closing) {
			return;
		};

		if (attempt.kind == 'connect') {
			attempt.input = { ...attempt.input, ...consent };
		} else {
			attempt.opts = { ...attempt.opts, ...consent };
		};

		this.pollToken++;
		this.set({ busy: true, view: 'finish', phase: 'delivering', formErrors: [], errors: [], ackFailed: false });

		const res = (attempt.kind == 'connect') ? await flow.connect(attempt.input) : await flow.reconnect(attempt.connection, attempt.opts);

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });
		this.handle(res);
	};

	consent (which: 'allowQuit' | 'quitConfirmed'): void {
		this.deliver({ [which]: true });
	};

	/**
	 * The record's attempt as a reconnect (V2): the form, when it returns there, keeps its values. Claude's
	 * extension whose key this flow retired (D1C-04) continues on the record as it is now, keyless, with the access
	 * it stored
	 */
	private reconnectContinuation (): AiReconnectInput | null {
		const a = this.attempt;
		let r = this.state.reconnect;

		if (a?.kind == 'reconnect') {
			const shown = a.opts.shown;

			r = { connection: a.connection, grant: shown?.grant || a.connection.grant, expireAt: shown ? shown.expireAt : a.connection.expireAt, keyGone: false };
		};

		const now = r ? S.AiConnect.getById(r.connection.id) : null;

		if (now && !now.removed && (now.method == 'package') && !now.appHash && r.connection.appHash) {
			return { connection: now, grant: now.grant, expireAt: now.expireAt, keyGone: true };
		};
		return r;
	};

	/** A manual record stays on the manual path through every reconnect continuation (W4) */
	private manualRecord (): AiConnection | null {
		const a = this.attempt;
		const c = (a?.kind == 'reconnect') ? a.connection : this.state.reconnect?.connection;

		return (c?.method == 'manual') ? c : null;
	};

	/** The record an attempt was for (its expected hash) */
	private attemptRecord (): AiConnection | null {
		const a = this.attempt;

		if (a?.kind == 'reconnect') {
			return a.connection;
		};
		return ((a?.kind == 'connect') ? a.input.existing : null) || this.state.reconnect?.connection || null;
	};

	/** Manage of a record, freshly looked up */
	private openManage (id: string, notice: AiMsg | null = null): void {
		this.attempt = null;
		this.set({
			view: 'manage', connectionId: id, reconnect: null, formLocked: false, movedTo: '', movedFrom: '', busy: false, access: null, override: null, result: null,
			manageNotice: notice,
		});
		this.loadManage();
	};

	/**
	 * The record changed under the attempt (`stale`, W7): nothing is adopted. A reconnect reloads its record's
	 * Manage (or closes when it is gone); a first connect that now finds a record at the place opens that one's
	 * Manage. Either way the user decides again.
	 */
	private afterStale (): void {
		const tried = this.attemptRecord();
		const notice: AiMsg = { error: { stage: 'validate', category: 'stale' } };

		this.attempt = null;
		if (tried) {
			const now = S.AiConnect.getById(tried.id);

			if (!now || now.removed) {
				this.ui.toast(notice);
				this.ui.close();
				return;
			};
			this.openManage(now.id, notice);
			return;
		};

		const found = this.existingRecord();

		if (found) {
			this.openManage(found.id, notice);
			return;
		};
		this.set({ reconnect: null, formLocked: false });
		this.backToForm(null, [ notice ]);
	};

	private handle (res: flow.ReconnectResult): void {
		const app = this.appName;

		switch (res.kind) {
			case 'busy':
			case 'cancelled': {
				return;
			};

			case 'stillSaving': {
				const c = this.attemptRecord();

				this.attempt = null;
				if (c) {
					this.openManage(c.id, { key: 'aiConnectStillSaving', args: [ app ] });
				} else {
					this.set({ phase: 'error', errors: [ { key: 'aiConnectStillSaving', args: [ app ] } ], canManual: false });
				};
				return;
			};

			case 'plan': {
				const a = this.attempt;
				const sameKey = (a?.kind == 'connect') && !!a.input.sameKey;
				const r = this.reconnectContinuation();
				const rec = this.attemptRecord();
				const to = res.plan.targetPath || '';
				const lastShown = (a?.kind == 'connect') ? a.input.shown : ((a?.kind == 'reconnect') ? a.opts.plan : null);
				// Another destination than the record's or the one last shown is a move, always named on the sheet (X3, Y6)
				const moved = (res.reason == 'moved') || ((res.reason == 'changed') && !!to && (flow.movedFile(rec, res.plan) || (!!lastShown?.targetPath && (lastShown.targetPath != to))));
				// The same connection moves with a new key (the old one stops working): both places are named (Y7); the
				// same key moving leaves the old entry working
				const place = moved ? { movedTo: res.plan.displayTarget || to, movedFrom: (!sameKey && rec?.targetPath) ? (rec.displayTarget || rec.targetPath) : '' } : null;

				// The manual sheet shows what the reconnect would mint: the live access and absolute expiry (W1)
				if (r && !sameKey) {
					this.prefillReconnect(r, this.state.formNotice);
				};
				if ((res.reason == 'manual') || this.manualRecord()) {
					this.set({ plan: res.plan });
					this.enterManual('create', this.manualRecord() || undefined);
					return;
				};

				// A same-key delivery that met a foreign entry or a moved file: the preview keeps that key and the
				// record's values; the approval adds only the place and any Replace (W3, Y8)
				if (sameKey && (moved || (res.reason == 'needsReplace'))) {
					this.set({
						formLocked: true, formNotice: null,
						form: { grant: copyGrant(a.input.grant), name: a.input.name, days: 0, fixedExpireAt: a.input.expireAt || undefined, route: a.input.route, tier: a.input.tier },
					});
					this.backToForm(res.plan, []);
					if (place) {
						this.set(place);
					};
					return;
				};
				// The record's file moved: the sheet with the new place, nothing written until it is approved (X3)
				if (place) {
					this.backToForm(res.plan, []);
					this.set(place);
					return;
				};
				this.backToForm(res.plan, (res.reason == 'changed') ? [ { key: 'aiConnectErrorChanged', args: [ app ] } ] : []);
				return;
			};

			case 'needsQuit': {
				this.set({ plan: res.plan, phase: (res.preflight == 'quitApp') ? 'needsQuit' : 'needsQuitSelf' });
				return;
			};

			case 'grantChanged': {
				const r = this.reconnectContinuation();
				const manual = this.manualRecord();

				if (r) {
					this.prefillReconnect({ ...r, grant: res.grant, expireAt: res.expireAt, keyGone: false }, 'grantChanged');
				};
				if (manual) {
					this.enterManual('create', manual, null, { key: 'aiConnectManualGrantChanged' });
					return;
				};
				this.backToForm(res.plan, []);
				return;
			};

			case 'needsForm': {
				const r = this.reconnectContinuation();
				const manual = this.manualRecord();
				const p = res.prefill;

				if (r) {
					this.prefillReconnect({ connection: r.connection, grant: p.grant, expireAt: p.expireAt || 0, keyGone: true }, 'reconnect');
				};
				this.set({ form: { ...this.state.form, days: 0, fixedExpireAt: p.expireAt } });
				// The old key is gone: a manual record is set up by hand again, with its stored values (W4)
				if (manual) {
					this.enterManual('create', manual, null, { key: 'aiConnectManualReconnectConfirm' });
					return;
				};
				this.backToForm(null, []);
				return;
			};

			case 'bundle': {
				this.followed = res.connection.appHash;
				this.sheet = { accountId: accountNow(), id: res.connection.id, appHash: res.connection.appHash };
				this.set({
					connectionId: res.connection.id, plan: res.plan, unsaved: !res.recordSaved, phase: 'bundle',
					bundle: { copyFailed: res.copyFailed, openFailed: res.openFailed, configure: res.configure, stopped: false, copied: !res.copyFailed },
				});
				this.clipboardTimer(!res.copyFailed);
				this.pollBundle();
				return;
			};

			case 'unconfirmed': {
				this.followed = flow.heldKey()?.appHash || '';
				this.set({ connectionId: res.connection.id, phase: 'unconfirmed', pollStopped: false });
				this.pollUnconfirmed();
				return;
			};

			case 'manual': {
				// The new key was minted for this plan, with the old key's access (re-read before it is recorded, W4)
				this.prefillReconnect({ connection: res.connection, grant: res.access.grant, expireAt: res.access.expireAt, keyGone: false }, null);
				this.enterManual('confirm', res.connection, { plan: res.plan, port: res.port });
				return;
			};

			case 'error': {
				const { error } = res;
				const lines: AiMsg[] = [ { error, target: res.plan?.displayTarget }, ...this.extras(error) ];

				if (error.category == 'stale') {
					this.afterStale();
					return;
				};
				if (((error.stage == 'write') && (error.category == 'changed')) || (error.category == 'apiOff')) {
					const r = this.reconnectContinuation();

					if (r) {
						this.prefillReconnect(r, this.state.formNotice);
					};
					this.backToForm(null, lines);
					return;
				};
				// A replace whose entry changed since the preview: show the new one
				if ((error.stage == 'validate') && (error.category == 'conflict') && ((res.plan?.existing == 'foreign') || !!res.plan?.replace)) {
					this.backToForm(null, []);
					return;
				};
				this.set({
					phase: 'error', errors: lines, lastError: error,
					canManual: res.hasKey && !!res.plan?.steps?.length,
					fileRouteFromError: (error.stage == 'open') && (this.data.appId == 'lmstudio') && res.hasKey,
				});
				return;
			};

			case 'ok': {
				this.followed = res.connection.appHash;
				this.afterDelivery(res.connection, res.plan, res.probe, res.openFailed, res.recordSaved);
				return;
			};
		};
	};

	/** What a failed delivery left behind (V23) */
	private extras (error: AiError): AiMsg[] {
		const ret: AiMsg[] = [];

		if (error?.left == 'entry') {
			ret.push({ key: 'aiConnectErrorLeftEntry', args: [ this.appName ] });
		};
		if (error?.openFailed) {
			ret.push({ key: 'aiConnectErrorReopen', args: [ this.appName ] });
		};
		return ret;
	};

	private afterDelivery (c: AiConnection, p: AiPlan | null, probe: AiProbeResult, openFailed: boolean, recordSaved: boolean): void {
		this.set({ connectionId: c.id, openFailed, unsaved: !recordSaved, plan: p || this.state.plan });

		if (!probe.ok) {
			this.set({ phase: 'error', errors: [ { key: 'aiConnectErrorProbe' } ], canManual: false, fileRouteFromError: false });
			return;
		};
		// The delivery and its probe are reported by flow where it settles (Z13); the step shown is the sheet's
		if (!this.waiting(c) && (c.nextStep != 'none')) {
			track.nextStep(this.data.appId, c.nextStep);
		};
		this.set({ probeOk: true });
		this.routeTo(c);
	};

	/**
	 * The followed delivery still waits for its CLI: the key this attempt delivered is one of the record's
	 * unconfirmed candidates. An older candidate kept by main doesn't hold up a confirmed retry (W12). Without
	 * an attempt (Continue from the gallery): main's `pending` status with candidates.
	 */
	private waiting (c: AiConnection): boolean {
		const list = c.unconfirmed || [];

		if (this.followed) {
			return list.some(it => it.appHash == this.followed);
		};
		return !!list.length && (c.status == 'pending');
	};

	/**
	 * The screen for a record as main reports it (V16, V17): an unconfirmed delivery waits; an outstanding step
	 * is shown (and an install is polled); nothing outstanding is Added.
	 */
	private routeTo (c: AiConnection): void {
		if (this.waiting(c)) {
			this.set({ phase: 'unconfirmed', pollStopped: false });
			this.pollUnconfirmed();
			return;
		};
		if (c.nextStep == 'none') {
			this.set({ phase: 'added' });
			return;
		};
		this.set({ phase: 'step', step: c.nextStep });
		if (c.nextStep == 'confirmInApp') {
			this.pollInstall();
		};
	};

	/** Continue from the gallery: the finishing view at the outstanding step */
	private async resumeFinish (): Promise<void> {
		const c = this.connection();

		if (!c) {
			this.ui.close();
			return;
		};

		// Claude's extension, not "Connected" yet: its Finish view, watching heart's isActive again
		if ((c.method == 'package') && (c.status != 'ok') && !c.removed && c.appHash) {
			this.sheet = { accountId: accountNow(), id: c.id, appHash: c.appHash };
			// Whether its key is still on the clipboard is main's to say (a copy made before the sheet was closed)
			this.set({ phase: 'bundle', bundle: { copyFailed: false, openFailed: false, configure: false, stopped: false, copied: !!c.keyCopied } });
			this.pollBundle();
		} else {
			this.routeTo(c);
		};

		const res = await flow.plan({ appId: c.appId, route: c.route, tier: c.tier, connectionId: c.id, method: flow.planMethodOf(c) });

		if (!this.disposed && !('error' in res)) {
			this.set({ plan: res.plan });
		};
	};

	// ---------------------- polls ---------------------- //

	private alivePoll (token: number): () => boolean {
		return () => this.disposed || this.closing || (token != this.pollToken);
	};

	/**
	 * The app's own confirm, until main sees the entry or reports another step; stalled after 2 minutes. Only a
	 * successful check counts, and its current status first: a record that needs a decision (access ended, a
	 * conflict, removed…) goes to Manage with its actions; only a valid install is acknowledged (W12).
	 */
	private async pollInstall (): Promise<void> {
		const token = ++this.pollToken;
		const id = this.state.connectionId;
		const res = await flow.pollUntil(async () => {
			if ((await flow.check('poll')) != 'ok') {
				return false;
			};

			const c = S.AiConnect.getById(id);
			return !c || c.removed || ATTENTION.includes(c.status) || c.observedInstalled || (c.nextStep != 'confirmInApp');
		}, this.alivePoll(token));

		if (this.alivePoll(token)()) {
			return;
		};
		if (res == 'timeout') {
			this.set({ phase: 'stalled' });
			return;
		};

		const c = S.AiConnect.getById(id);

		if (!c) {
			this.ui.close();
			return;
		};
		if (c.removed || ATTENTION.includes(c.status)) {
			this.openManage(c.id);
			return;
		};
		// Installed, the confirm done: acknowledged; anything main still asks for (enable, restart) comes next
		if (c.nextStep == 'confirmInApp') {
			await this.acknowledge(c);
			return;
		};
		this.routeTo(c);
	};

	/**
	 * Claude's extension (§3.3): heart's isActive, read through a check every 5 s while the Finish view is open,
	 * for at most 10 minutes. "Connected" ends it (main clears the clipboard then); a record that needs the user
	 * goes to Manage; one that is gone closes the view. A watch that runs out offers Check again.
	 */
	private async pollBundle (): Promise<void> {
		const token = ++this.pollToken;
		const shown = this.sheet;
		const id = shown?.id || this.state.connectionId;
		// Another account, or another key on the record (another window's Reconnect): not this sheet's key any more (D1C-08)
		const changed = (): boolean => !!shown && ((accountNow() != shown.accountId) || (S.AiConnect.getById(id)?.appHash != shown.appHash));
		const settled = (c: AiConnection | null): boolean => !c || c.removed || changed() || (c.status == 'ok') || ATTENTION.includes(c.status);
		const res = await flow.pollUntil(async () => {
			if (changed()) {
				return true;
			};
			if ((await flow.check('finish')) != 'ok') {
				return false;
			};

			const c = S.AiConnect.getById(id);

			// Main cleared the key from the clipboard (its deadline, another copy, an account switch): the sheet says so
			if (this.state.bundle?.copied && c && !c.keyCopied && !this.alivePoll(token)()) {
				this.clipboardTimer(false);
				this.set({ bundle: { ...this.state.bundle, copied: false } });
			};
			return settled(c);
		}, this.alivePoll(token), {
			interval: flow.flowConfig.bundlePollInterval,
			timeout: flow.flowConfig.bundlePollTimeout,
		});

		if (this.alivePoll(token)()) {
			return;
		};
		if (res != 'done') {
			this.set({ bundle: { ...this.state.bundle, stopped: true } });
			return;
		};
		if (changed()) {
			this.recordChanged(shown);
			return;
		};

		const c = S.AiConnect.getById(id);

		if (!c) {
			this.ui.close();
			return;
		};
		if (c.removed || ATTENTION.includes(c.status)) {
			this.openManage(c.id);
			return;
		};
		this.set({ phase: 'connected' });
	};

	/**
	 * The Finish sheet's key reaches main's clipboard deadline (§3.4): from a copy (`on`) the sheet says it is on the
	 * clipboard until then, also when the watch has run out; a check that finds it cleared earlier says so sooner
	 */
	private clipboardTimer (on: boolean): void {
		if (this.clipTimer) {
			clearTimeout(this.clipTimer);
			this.clipTimer = null;
		};
		if (!on || this.disposed) {
			return;
		};
		this.clipTimer = setTimeout(() => {
			this.clipTimer = null;
			if (this.state.bundle?.copied) {
				this.set({ bundle: { ...this.state.bundle, copied: false } });
			};
		}, flow.flowConfig.clipboardTtl);
	};

	/** Finish view: the watch again after it ran out */
	checkBundleAgain (): void {
		if (this.state.phase == 'bundle') {
			this.set({ bundle: { ...this.state.bundle, stopped: false } });
			this.pollBundle();
		};
	};

	/**
	 * The Finish sheet's record, only while it still has the key the sheet showed under the same account (D1C-08);
	 * none once the sheet ended
	 */
	private sheetRecord (): AiConnection | null {
		const shown = this.sheet;

		if (!shown) {
			return null;
		};

		const c = (accountNow() == shown.accountId) ? S.AiConnect.getById(shown.id) : null;

		return (c && !c.removed && (c.appHash == shown.appHash)) ? c : null;
	};

	/**
	 * The record a sheet or a confirmation stood for has another key now (another window replaced it), is gone, or
	 * another account signed in: that operation ends, and Manage shows the record as it is now (or the popup closes)
	 */
	private recordChanged (shown: Shown): void {
		const notice: AiMsg = { error: { stage: 'validate', category: 'stale' } };
		const now = (accountNow() == shown.accountId) ? S.AiConnect.getById(shown.id) : null;

		this.pollToken++;
		this.sheet = null;
		if (!now || now.removed) {
			this.attempt = null;
			this.ui.toast(notice);
			this.ui.close();
			return;
		};
		this.openManage(now.id, notice);
	};

	/** "Copy key" / "Copy key again": the sheet's key from heart's list onto the clipboard through main (§3.4) */
	async copyKey (): Promise<void> {
		if (this.state.busy) {
			return;
		};

		const c = this.sheetRecord();

		if (!c?.appHash) {
			if (this.sheet) {
				this.recordChanged(this.sheet);
			};
			return;
		};

		const ok = await flow.copySecret({ template: KEY_PLACEHOLDER, appHash: c.appHash, connectionId: c.id });

		if (this.disposed) {
			return;
		};
		if (ok && this.state.bundle) {
			this.set({ bundle: { ...this.state.bundle, copyFailed: false, copied: true } });
			this.clipboardTimer(true);
		};
		this.ui.toast({ key: ok ? 'aiConnectKeyCopied' : 'aiConnectKeyCopyFailed' });
	};

	/** "Open again": the bundle copy in Claude (no new key; an installed extension is updated) */
	async openBundle (): Promise<void> {
		const ok = await flow.openBundle();

		if (this.disposed) {
			return;
		};
		if (this.state.bundle) {
			this.set({ bundle: { ...this.state.bundle, openFailed: !ok } });
		};
		if (!ok) {
			this.ui.toast({ key: 'aiConnectOpenAppFailed', args: [ this.appName ] });
		};
	};

	/**
	 * "Cancel setup" in the Finish view: Disconnect of the key the sheet showed (the key is revoked, main clears the
	 * clipboard); another key there now is never removed: Manage shows the record instead (D1C-08)
	 */
	async cancelSetup (): Promise<void> {
		const shown = this.sheet;
		const c = this.sheetRecord();

		if (shown && !c && !this.state.busy) {
			this.recordChanged(shown);
			return;
		};
		if (!c || this.state.busy) {
			this.ui.close();
			return;
		};

		this.pollToken++;
		this.set({ busy: true });

		const res = await flow.disconnect(c);

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });
		if ('error' in res) {
			if (res.stale && shown) {
				await flow.load();
				if (!this.disposed) {
					this.recordChanged(shown);
				};
				return;
			};
			this.set({ phase: 'error', errors: [ { error: res.error } ], canManual: false });
			return;
		};
		this.ui.toast({ key: res.revoked ? 'aiConnectDisconnected' : 'aiConnectRevokeFailed', args: [ this.appName ] });
		this.ui.close();
	};

	/**
	 * A CLI write whose end was unknown: checks until main settles the followed key (V16, W12). Then the key it
	 * retired is already revoked by that check (W9) and the promoted key is probed before the next step shows.
	 * A wait that runs out offers Check again.
	 */
	private async pollUnconfirmed (): Promise<void> {
		const token = ++this.pollToken;
		const id = this.state.connectionId;
		const followed = this.followed;
		// Its analytics belong to the account that delivered (A13)
		const account = String(S.Auth.account?.id || '');
		const here = () => (String(S.Auth.account?.id || '') == account);
		const res = await flow.pollUntil(async () => {
			if ((await flow.check('unconfirmed')) != 'ok') {
				return false;
			};

			const c = S.AiConnect.getById(id);
			return !c || !this.waiting(c);
		}, this.alivePoll(token));

		if (this.alivePoll(token)()) {
			return;
		};
		if (res != 'done') {
			this.set({ pollStopped: true });
			return;
		};

		const c = S.AiConnect.getById(id);

		if (!c || c.removed || (followed && (c.appHash != followed))) {
			this.set({ phase: 'error', errors: [ { error: { stage: 'cli', category: 'cliFailed' } } ], canManual: false });
			return;
		};

		// A CLI write that settled while the sheet watched it: delivered now (its own wait is the sheet's)
		if (here()) {
			track.delivered(this.data.appId, c.method);
		};
		this.set({ busy: true });

		const probe = await flow.retryProbe(c);

		if (this.alivePoll(token)()) {
			return;
		};
		this.set({ busy: false });
		// Another account signed in meanwhile: nothing of this delivery is reported or shown under it (A13)
		if (!here()) {
			return;
		};
		if (probe.ok) {
			track.probeOk(this.data.appId);
		} else
		if (('category' in probe) && !('lookupFailed' in probe)) {
			track.failed(this.data.appId, { stage: 'probe', category: probe.category });
		};
		this.afterDelivery(S.AiConnect.getById(id) || c, null, probe, this.state.openFailed, !this.state.unsaved);
	};

	/** Check again, after the wait for an unconfirmed CLI write ran out (W12) */
	checkAgain (): void {
		this.set({ pollStopped: false });
		this.pollUnconfirmed();
	};

	// ---------------------- finishing ---------------------- //

	/** Saves that the step is done; the screen advances only when it was saved (V18) */
	private async acknowledge (c: AiConnection): Promise<boolean> {
		this.set({ busy: true });

		const ok = await flow.stepDone(c);

		if (this.disposed) {
			return false;
		};
		this.set({ busy: false, ackFailed: !ok });
		if (!ok) {
			this.set({ phase: 'step' });
			return false;
		};

		const fresh = S.AiConnect.getById(c.id) || c;

		if ((fresh.nextStep != 'none') && (fresh.nextStep != this.state.step)) {
			this.routeTo(fresh);
			return true;
		};
		this.followUp();
		return true;
	};

	/** The same follow-up as the automatic path (R2-30): the adapter's after-restart hint, else Added */
	private followUp (): void {
		const instructions = this.state.plan?.instructions || {};

		this.set({ phase: ((this.state.step == 'restart') && instructions.afterRestart) ? 'afterRestart' : 'added' });
	};

	/** Done on a step, "I've restarted it", or Try again after a failed save (saving only, never another restart) */
	async stepDone (): Promise<void> {
		const c = this.connection();

		if (!c) {
			this.followUp();
			return;
		};
		if (this.state.restartFailed && !this.state.ackFailed) {
			await flow.check('restart');
		};
		await this.acknowledge(c);
	};

	async restart (): Promise<void> {
		this.set({ busy: true });

		const ok = await flow.restartApp(this.restartTarget());

		if (this.disposed) {
			return;
		};
		if (!ok) {
			this.set({ busy: false, restartFailed: true });
			return;
		};

		const c = this.connection();

		if (c) {
			await this.acknowledge(c);
		} else {
			this.set({ busy: false });
			this.followUp();
		};
	};

	async openApp (): Promise<void> {
		const ok = await flow.openApp(this.data.appId);

		if (!ok && !this.disposed) {
			this.ui.toast({ key: 'aiConnectOpenAppFailed', args: [ this.appName ] });
		};
	};

	async retrySave (): Promise<void> {
		this.set({ busy: true });

		const ok = await flow.retrySave();

		this.set({ busy: false, unsaved: !ok });
	};

	/**
	 * The settings-file route instead of the app's own install (LM Studio's link). The key: this flow's pending
	 * one with the approved input, or the record's delivered key with the record's own values (V15).
	 */
	useFileRoute (): void {
		const held = flow.heldKey();
		const c = this.connection();
		const a = this.attempt;

		this.method = 'config';

		if (held && !held.committed && a) {
			if (a.kind == 'connect') {
				a.input = { ...a.input, method: 'config', shown: null, replace: undefined, allowQuit: undefined, quitConfirmed: undefined };
			} else {
				a.opts = { ...a.opts, method: 'config', plan: null, replace: undefined, allowQuit: undefined, quitConfirmed: undefined };
			};
			this.deliver({});
			return;
		};
		if (!c) {
			return;
		};

		this.attempt = {
			kind: 'connect',
			input: {
				appId: c.appId, route: c.route, tier: c.tier, recommendedTier: c.recommendedTier, grant: copyGrant(c.grant), name: c.name,
				expireAt: c.expireAt, method: 'config', existing: c, sameKey: true,
			},
		};
		this.submitted = null;
		this.deliver({});
	};

	// ---------------------- manual ---------------------- //

	/**
	 * The input for a key minted or recorded in the manual view: the access, name and expiry the view shows
	 * (W1), the record it replaces with its id (W10), the port its instructions name (W13) and, for a
	 * reconnect, the old key's access to re-read (W4)
	 */
	private manualInput (): flow.ManualInput {
		const { manual, form, reconnect } = this.state;
		const rec = manual.existing;
		const a = this.attempt;
		const base = (a?.kind == 'connect') ? a.input : null;
		const p = manual.plan;

		const command = this.commandSetup();

		return {
			appId: this.data.appId,
			route: command ? 'stdio' : (base?.route || rec?.route || this.route()),
			tier: base?.tier || rec?.tier || form.tier,
			recommendedTier: base?.recommendedTier || rec?.recommendedTier || this.recommended(),
			grant: copyGrant(form.grant),
			name: form.name.trim(),
			expireAt: manual.expireAt,
			method: this.method,
			...(command ? { setup: 'command' as const } : {}),
			existing: rec,
			connectionId: rec?.id,
			shown: p,
			port: manual.planPort || undefined,
			reread: (reconnect && !reconnect.keyGone && rec && (reconnect.connection.id == rec.id)) ? { hash: rec.appHash, grant: reconnect.grant, expireAt: reconnect.expireAt } : undefined,
		};
	};

	/**
	 * The manual view (§5.6): the steps with the key this flow holds (pending → "I've updated"), the record's
	 * key from Manage (done), or none until Create key — always masked, by hash only: opening the view looks up
	 * no key (tokens-plan §3.2). Claude Desktop by hand is its settings file's command entry, with the key in
	 * the entry's `env` (`setup: 'command'`).
	 * `preset`: the plan a key was just minted for (a manual reconnect), shown as it is.
	 */
	async enterManual (mode: 'create' | 'confirm' | 'done', record?: AiConnection | null, preset?: { plan: AiPlan; port: number } | null, notice: AiMsg | null = null): Promise<void> {
		const a = this.attempt;
		let release = false;

		// A reconnect continued by hand, from any of its screens (an error too): the old key's access and
		// absolute expiry, which the manual sheet can't change (X2), read again now: another access (or no answer)
		// releases the replacement minted before (Y5)
		if ((a?.kind == 'reconnect') && (this.state.reconnect?.connection?.id != a.connection.id)) {
			let r = this.reconnectContinuation();
			const live = await flow.liveAccess(a.connection);

			if (this.disposed) {
				return;
			};
			if (!live.ok) {
				release = true;
			} else
			if (!live.present || !flow.sameGrant(live.grant, r.grant) || (live.expireAt != r.expireAt)) {
				release = true;
				r = { ...r, grant: live.present ? live.grant : a.connection.grant, expireAt: live.present ? live.expireAt : a.connection.expireAt, keyGone: !live.present };
				notice = notice || { key: live.present ? 'aiConnectManualGrantChanged' : 'aiConnectManualReconnectConfirm' };
			};
			this.prefillReconnect(r, this.state.formNotice);
		};

		const rec = (record !== undefined) ? record : (this.connection() || this.existingRecord());

		// A Command connection stays one: its setup text and its reconnect are asked with its method. Claude
		// Desktop by hand is always its settings file's entry (the config route's steps)
		if (flow.isCommand(rec) && (this.data.appId == 'other')) {
			this.method = 'command';
		};
		if (this.data.appId == 'claude-desktop') {
			this.method = 'config';
		};

		// The expiry an attempt resolved stays while the choice is the one submitted (its pending key fits as it
		// is); a choice edited since is resolved from the latest form (V15, X1)
		const expiry = (): number => {
			const { form } = this.state;
			const submitted = this.submitted;
			const same = (a?.kind == 'connect') && !!submitted && (submitted.days == form.days) && (submitted.fixedExpireAt == form.fixedExpireAt);

			return same ? a.input.expireAt : (form.fixedExpireAt || daysToExpireAt(form.days));
		};
		let held = flow.heldKey();

		// A key minted with other values than the sheet shows now is released, never shown (X1)
		if (held && !held.committed && (release || !flow.pendingFits({ name: this.state.form.name.trim(), grant: this.state.form.grant, expireAt: expiry() }))) {
			await flow.releasePending();
			if (this.disposed) {
				return;
			};
			held = flow.heldKey();
		};

		// The choice as it is after that wait (the form stays editable meanwhile, Y3)
		const expireAt = expiry();

		let next: AiManualMode = mode;
		let keyHash = held?.appHash || '';

		if (mode == 'create') {
			next = held ? (held.committed ? 'done' : 'confirm') : 'create';
		};
		// The record's own key (Manage ▸ Set up manually): by its hash, nothing is looked up now
		if ((next == 'done') && rec && !keyHash) {
			keyHash = rec.appHash || '';
		};
		if (this.state.lastError?.removedOld && rec && held && !held.committed) {
			next = 'restoreOld';
		};

		this.set({
			view: 'manual', busy: false,
			manual: {
				...EMPTY_MANUAL, mode: next, keyHash, oldHash: (next == 'restoreOld') ? (rec?.appHash || '') : '', existing: rec, loading: !preset, expireAt, notice,
				setup: this.commandSetup() ? 'command' : 'url', setups: this.state.manual.setups,
			},
		});

		if (preset) {
			this.manualSeq++;
			this.applyManualPlan(preset.plan, preset.port);
			return;
		};
		await this.loadManualPlan();
	};

	/** The manual instructions, fresh; with no key to deliver they are a prerequisite (V8), with the finishing step (V24) */
	async loadManualPlan (): Promise<void> {
		const { manual } = this.state;
		const rec = manual.existing;
		const useRecord = !!rec && ((manual.mode == 'done') || (rec.method == 'manual'));
		const seq = ++this.manualSeq;

		this.setManual({ loading: true });

		const res = await flow.plan({
			appId: this.data.appId,
			route: this.commandSetup() ? 'stdio' : (useRecord ? rec.route : this.route()),
			tier: useRecord ? rec.tier : this.state.form.tier,
			method: this.method,
			// The same record Create key plans and records for (W10)
			connectionId: rec?.id,
		});

		if (this.disposed || (seq != this.manualSeq)) {
			return;
		};
		if ('error' in res) {
			this.setManual({ loading: false, error: { error: res.error } });
			return;
		};
		this.applyManualPlan(res.plan, res.port);
	};

	/**
	 * The instructions for the port they were made for (W13). A plan that can't deliver a key (a prerequisite,
	 * a refused place) offers Check again only: no Create key, no "I've updated" (V8, W4).
	 */
	private applyManualPlan (p: AiPlan, port: number): void {
		const { manual } = this.state;
		const usable = flow.manualUsable(p);
		let mode = manual.mode;
		let keyHash = manual.keyHash;

		if (((mode == 'create') || (mode == 'confirm')) && !usable) {
			mode = 'prerequisite';
			keyHash = '';
		} else
		if ((mode == 'prerequisite') && usable) {
			mode = 'create';
		};
		this.setManual({ loading: false, plan: p, planPort: port, steps: withFinishingStep(p, this.restartName(p.nextStep)), mode, keyHash, setups: p.setups || [] });
	};

	/**
	 * The command setup (the app starts Anytype's connector with the key in its `env`): Other app's Command, or
	 * Claude Desktop by hand (its settings file's entry)
	 */
	private commandSetup (): boolean {
		return (this.method == 'command') || ((this.data.appId == 'claude-desktop') && (this.method == 'config'));
	};

	/**
	 * Other app, before a connection exists: "URL and key" (the key goes into the app's settings) or "Command"
	 * (the app starts Anytype's connector, the key in the entry's `env`). Nothing is minted by the choice.
	 */
	async setSetup (setup: AiSetup): Promise<void> {
		const { manual } = this.state;

		if (this.state.busy || (this.data.appId != 'other') || manual.existing || ![ 'create', 'prerequisite' ].includes(manual.mode) || !manual.setups.includes(setup) || (manual.setup == setup)) {
			return;
		};

		this.method = (setup == 'command') ? 'command' : undefined;
		this.setManual({ setup, error: null, notice: null });
		await this.loadManualPlan();
	};

	/** Recheck after installing or updating a CLI: the instructions again */
	recheck (): Promise<void> {
		return this.loadManualPlan();
	};

	/**
	 * The instructions on screen name the port the API listens on now (W13, X4). When it moved they are made
	 * again and the user looks at them before copying a snippet or saying "I've updated".
	 */
	portCurrent (): boolean {
		if (this.keyLive()) {
			return true;
		};
		// The API isn't listening (off, failed, another process on the port): no key goes out; the view says so (X4)
		if (flow.apiState() != 'listening') {
			return false;
		};
		this.setManual({ notice: { key: 'aiConnectManualChanged' } });
		this.loadManualPlan();
		return false;
	};

	/**
	 * A key may be shown, copied or confirmed in the manual view: the API listens on the port its instructions
	 * name, live (X4). Otherwise the view shows the instructions redacted.
	 */
	keyLive (): boolean {
		return flow.liveFor(this.state.manual.planPort);
	};

	/**
	 * "I've put it back" (Claude Code after its previous entry was removed, X8): the old entry and key stay as
	 * they are; the replacement is released and nothing is recorded
	 */
	async restoredOld (): Promise<void> {
		if (this.state.busy || (this.state.manual.mode != 'restoreOld')) {
			return;
		};
		this.set({ busy: true });
		await flow.releasePending();
		await flow.check('restore');
		if (this.disposed) {
			return;
		};
		this.set({ busy: false });
		this.ui.toast({ key: 'aiConnectManualRestoredToast', args: [ this.appName ] });
		this.ui.close();
	};

	/** The changed instructions are shown instead of what was asked for, nothing minted or recorded */
	private manualChanged (p: AiPlan, port: number): void {
		this.applyManualPlan(p, port);
		this.setManual({ notice: { key: 'aiConnectManualChanged' } });
	};

	/** The old key's access changed while the view was open: shown, and the user creates the key again (W4) */
	private manualGrantChanged (access: flow.AccessNow): void {
		const r = this.state.reconnect;

		if (r) {
			this.prefillReconnect({ ...r, grant: access.grant, expireAt: access.present ? access.expireAt : r.expireAt, keyGone: !access.present }, null);
		};
		this.setManual({
			mode: 'create', keyHash: '', expireAt: access.present ? access.expireAt : this.state.manual.expireAt,
			notice: { key: access.present ? 'aiConnectManualGrantChanged' : 'aiConnectManualReconnectConfirm' },
		});
	};

	async createKey (): Promise<void> {
		if (this.state.busy || !isValidLinkGrant(this.state.form.grant)) {
			return;
		};
		this.set({ busy: true });
		this.setManual({ error: null, notice: null });
		track.start(this.data.appId, this.state.manual.plan?.route || this.route());

		const res = await flow.createManual(this.manualInput());

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });

		switch (res.kind) {
			case 'plan': {
				// The place, the port or the instructions changed: the new ones first, nothing minted
				this.manualChanged(res.plan, res.port);
				break;
			};
			case 'pending': {
				this.applyManualPlan(res.plan, res.port);
				this.setManual({ keyHash: flow.heldKey()?.appHash || '', mode: 'confirm' });
				break;
			};
			case 'grantChanged': {
				this.manualGrantChanged(res);
				break;
			};
			case 'stillSaving': {
				this.setManual({ error: { key: 'aiConnectStillSaving', args: [ this.appName ] } });
				break;
			};
			case 'ok': {
				this.set({ connectionId: res.connection.id, unsaved: !res.recordSaved });
				// Other app: the fresh plan's steps, with the port the record got (W13)
				this.applyManualPlan(res.plan, res.port);
				this.setManual({
					keyHash: res.connection.appHash, mode: 'done', probeFailed: !res.probe.ok, existing: this.commandSetup() ? res.connection : this.state.manual.existing,
					notice: (res.fileMode == 'loose') ? { key: 'aiConnectManualFileLoose', args: [ this.appName ] } : null,
				});
				break;
			};
			case 'error': {
				this.setManual({ error: { error: res.error, target: this.state.manual.plan?.displayTarget } });
				break;
			};
		};
	};

	/**
	 * Copy of a step (or the key row) in the manual view: a snippet that needs the key goes through main with the
	 * key fetched for that call (§3.4); one without it is plain text. `which`: the new key, or the previous one
	 * (restoreOld)
	 */
	async copyStep (template: string, which: 'new' | 'old' = 'new'): Promise<boolean> {
		const { manual } = this.state;
		const appHash = (which == 'old') ? manual.oldHash : manual.keyHash;

		if (!appHash || !this.keyLive()) {
			return false;
		};

		this.copied.add(appHash);

		const ok = await flow.copySecret({ template, appHash });

		if (!this.disposed) {
			this.ui.toast({ key: ok ? 'aiConnectManualCopied' : 'aiConnectKeyCopyFailed' });
		};
		return ok;
	};

	/** "I've updated <App>": records the key with the previewed file (or none), then the old key goes (V7) */
	async confirmManual (): Promise<void> {
		const { manual } = this.state;

		// Only with the current instructions on screen, ones that deliver the key, for the API's port (V8, W4, W13)
		if (!manual.plan || manual.loading || this.state.busy || !flow.manualUsable(manual.plan) || !this.portCurrent()) {
			return;
		};

		this.set({ busy: true });
		this.setManual({ error: null, notice: null });

		const input = this.manualInput();

		if (this.data.appId != 'other') {
			input.previewTarget = manual.plan.targetPath || '';
		};

		const res = await flow.confirmManual(input);

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });

		if (res.ok === false) {
			switch (res.reason) {
				case 'cancelled': {
					return;
				};
				case 'stillSaving': {
					this.setManual({ error: { key: 'aiConnectStillSaving', args: [ this.appName ] } });
					return;
				};
				case 'changed': {
					// The place or the instructions changed: say so and show fresh ones; the pending key stays (J5)
					if (this.portCurrent()) {
						this.setManual({ notice: { key: 'aiConnectManualChanged' } });
						this.loadManualPlan();
					};
					return;
				};
				case 'grantChanged': {
					this.manualGrantChanged(res.access);
					return;
				};
			};
			if (res.error.category == 'stale') {
				// The key was released: never shown again; the record as it is now decides (W7)
				this.setManual({ keyHash: '', mode: 'create' });
				this.afterStale();
				return;
			};
			this.setManual({ error: { error: res.error } });
			return;
		};

		const loose = (res.fileMode == 'loose');

		this.set({ connectionId: res.connection.id, unsaved: !res.recordSaved });
		// Something to look at (a file others can read, an unsaved list, a failed check): each on its own (W14)
		if (loose || !res.recordSaved || !res.probe.ok) {
			this.setManual({ mode: 'done', probeFailed: !res.probe.ok, notice: loose ? { key: 'aiConnectManualFileLoose', args: [ this.appName ] } : null });
			return;
		};
		this.ui.toast({ key: 'aiConnectAdded', args: [ this.appName ] });
		this.ui.close();
	};

	/**
	 * Reveal is offered only where main reveals that very file (V25): Claude's bundle, or the card's own
	 * settings file. Another path (a skill file) is shown to copy.
	 */
	canReveal (step: AiStep): boolean {
		if (!step?.path) {
			return false;
		};
		if (step.textKey == 'aiConnectManualInstallFile') {
			return true;
		};
		return step.path == S.AiConnect.detection(this.data.appId)?.targetPaths?.[0];
	};

	async revealStep (step: AiStep): Promise<void> {
		const ok = await flow.reveal({ appId: this.data.appId, what: (step.textKey == 'aiConnectManualInstallFile') ? 'bundle' : 'target' });

		if (!ok && !this.disposed) {
			this.ui.toast({ key: 'aiConnectRevealFailed' });
		};
	};

	async revealBundle (): Promise<void> {
		const ok = await flow.reveal({ appId: this.data.appId, what: 'bundle' });

		if (!ok && !this.disposed) {
			this.ui.toast({ key: 'aiConnectRevealFailed' });
		};
	};

	// ---------------------- manage ---------------------- //

	/**
	 * Manage shows the record's access as main's last check reconciled it: opening it looks up no key (ListApps
	 * returns every key, D1S-15). An action that needs heart's access now (Replace, Reconnect) reads it then
	 */
	loadManage (): Promise<void> {
		const run = this.loadManageIn();

		this.manageLoad = run;
		run.finally(() => {
			if (this.manageLoad === run) {
				this.manageLoad = null;
			};
		});
		return run;
	};

	private async loadManageIn (): Promise<void> {
		const c = this.connection();

		if (!c) {
			return;
		};

		// The plan Reconnect delivers with (Claude's config route keeps its method)
		const planned = await flow.plan({ appId: c.appId, route: c.route, tier: c.tier, connectionId: c.id, method: flow.planMethodOf(c) });
		const now = this.connection();

		if (this.disposed || (now?.id != c.id)) {
			return;
		};
		this.set({ access: recordAccess(now), override: null, plan: ('error' in planned) ? this.state.plan : planned.plan });
	};

	/** Try again after a failed key lookup */
	retryLookup (): Promise<void> {
		this.set({ access: null });
		return this.loadManage();
	};

	/**
	 * The key's access as heart has it now, for Replace: read on the action (D1S-15), after Manage's load in
	 * flight; a failed lookup is no answer (Try again), never "the key is gone" (W2)
	 */
	private async knownAccess (c: AiConnection): Promise<flow.LiveAccess | null> {
		if (this.manageLoad) {
			await this.manageLoad;
		};
		if (this.disposed) {
			return null;
		};

		const access = await flow.liveAccess(c);

		if (this.disposed) {
			return null;
		};
		if (!access.ok) {
			this.set({ access });
			return null;
		};
		return access;
	};

	async saveAccess (grant: LinkAppGrant): Promise<void> {
		const c = this.connection();

		this.set({ busy: true, manageNotice: null });

		const ok = await flow.updateAccess(c, grant);

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });
		if (ok) {
			this.ui.toast({ key: 'aiConnectAccessSaved' });
			this.loadManage();
		} else {
			this.set({ manageNotice: { key: 'aiConnectErrorUnknown' } });
		};
	};

	async saveTier (tier: AiTier): Promise<void> {
		const c = this.connection();

		this.set({ busy: true, manageNotice: null });

		const res = await flow.updateTier(c, tier);

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });
		if ('error' in res) {
			if (res.reconnect) {
				this.reconnect({ tier });
				return;
			};
			this.set({ manageNotice: (res.error.category == 'changed') ? { key: 'aiConnectAttentionReconnect', args: [ this.appName ] } : { error: res.error, target: c.displayTarget } });
			return;
		};

		const next = res.connection.nextStep;
		const key = this.state.plan?.instructions?.[next];

		this.ui.toast({ key: 'aiConnectTierSaved' });
		// The app whose restart loads it: ChatGPT for the shared Codex file (W16)
		this.set({ manageNotice: key ? { key, args: [ this.restartName(next) ] } : null });
	};

	/**
	 * Reconnect from Manage. A record whose card now reads another place (a moved Codex home, R3-7, also a
	 * manual one, W10): an owned record there is opened as it is (no key, V4); otherwise the card's sheet
	 * connects that place. Otherwise the access Manage shows goes with it, and the flow compares it with heart's
	 * before it mints (V2). `confirmed`: Claude's extension, the record and key its confirmation showed (D1C-08).
	 */
	async reconnect (opts: { tier?: AiTier; confirmed?: Shown } = {}): Promise<void> {
		if (this.state.busy) {
			return;
		};
		if (this.manageLoad) {
			await this.manageLoad;
			if (this.disposed) {
				return;
			};
		};

		const c = this.connection();

		if (!c || this.state.busy) {
			return;
		};
		// The confirmation stood for this record with this key: another one there now is never retired (D1C-08)
		if (opts.confirmed && ((accountNow() != opts.confirmed.accountId) || (c.id != opts.confirmed.id) || (c.appHash != opts.confirmed.appHash))) {
			await flow.load();
			if (!this.disposed) {
				this.recordChanged(opts.confirmed);
			};
			return;
		};

		const moved = movedConnection(this.data.appId, S.AiConnect.detectionMap, S.AiConnect.connectionList);

		if ((moved && (moved.id == c.id)) || isMovedRecord(c, S.AiConnect.detectionMap)) {
			const owned = S.AiConnect.getByApp(this.data.appId);

			if (owned && (owned.id != c.id)) {
				this.openManage(owned.id);
				return;
			};
			this.set({ connectionId: '', reconnect: null, formLocked: false, movedTo: '', movedFrom: '', view: 'connect' });
			this.loadPlan();
			return;
		};

		// The access Manage shows (the record's, as reconciled, D1S-15): the flow reads heart's right before it mints,
		// and another one goes back to the form (grantChanged)
		const access = recordAccess(c);
		const displayed = this.state.plan;

		// Its file moved under the same target id (an LM Studio or Copilot home): the new place on the sheet,
		// approved there before anything is minted, written or rotated (X3)
		if (flow.movedFile(c, displayed)) {
			const present = access.present;

			this.attempt = null;
			this.prefillReconnect({ connection: c, grant: c.grant, expireAt: c.expireAt, keyGone: !present }, present ? null : 'reconnect');
			this.backToForm(displayed, []);
			this.set({ movedTo: displayed.displayTarget || displayed.targetPath, movedFrom: c.displayTarget || c.targetPath });
			return;
		};

		const shown = access.present ? { grant: access.grant, expireAt: access.expireAt } : undefined;

		// The plan Manage showed: the delivery goes only where it said (W4 for manual records, X3 for the rest)
		this.attempt = { kind: 'reconnect', connection: c, opts: { tier: opts.tier, shown, method: flow.planMethodOf(c) || this.method, plan: displayed } };
		track.start(this.data.appId, displayed?.route || c.route);
		this.deliver({});
	};

	/**
	 * Replace from Manage (conflict): the fresh preview first, with this record's values; the user then agrees to
	 * replace exactly the entry shown there (V3). Only with heart's access for the key, read on the click: the
	 * revoked-key form only after a successful lookup found it gone (W2).
	 */
	async replace (): Promise<void> {
		const c = this.connection();

		if (!c || this.state.busy) {
			return;
		};

		const access = await this.knownAccess(c);

		if (!access || this.disposed) {
			return;
		};

		const present = access.present;

		this.attempt = null;
		this.prefillReconnect({ connection: c, grant: present ? access.grant : c.grant, expireAt: present ? access.expireAt : c.expireAt, keyGone: !present }, present ? null : 'reconnect');
		this.set({ view: 'connect', formErrors: [] });
		this.loadPlan();
	};

	/**
	 * Disconnect, after its confirm: the record the confirm showed (W21), with the messages from the two
	 * separate results (V5). Another record there now → Manage reloaded, the user confirms again.
	 */
	async disconnect (forgetOnly = false, shown?: { id: AiConnection['id']; appHash: string }): Promise<void> {
		const current = this.connection();

		if (!current || this.state.busy) {
			return;
		};

		const c = shown ? { ...current, id: shown.id, appHash: shown.appHash } : current;

		this.set({ busy: true, manageNotice: null });

		const res = forgetOnly ? await flow.forget(c) : await flow.disconnect(c);

		if (this.disposed) {
			return;
		};
		this.set({ busy: false });

		if ('error' in res) {
			if (res.stale) {
				await flow.load();
				if (this.disposed) {
					return;
				};

				const now = S.AiConnect.getById(c.id);

				if (!now || now.removed) {
					this.ui.toast({ error: res.error });
					this.ui.close();
					return;
				};
				this.openManage(now.id, { error: res.error });
				return;
			};
			// A conflict found now: the Replace / Forget actions, not only text (V22)
			this.set(res.conflict ? { override: 'conflict', manageNotice: null } : { manageNotice: { error: res.error, target: c.displayTarget } });
			return;
		};

		const lines: AiMsg[] = [];
		const path = res.connection.targetPath || '';

		if (res.left == 'extension') {
			lines.push({ key: 'aiConnectLeftExtension' });
		};
		if (res.left == 'entry') {
			lines.push({ key: 'aiConnectLeftEntry', args: [ res.connection.displayTarget || this.appName ] });
		};
		// Hermes: the entry is gone, its key line in the profile's .env stayed (H7)
		if (res.left == 'envKey') {
			lines.push({ key: 'aiConnectLeftEnvKey' });
		};
		if (!res.revoked) {
			lines.push({ key: 'aiConnectRevokeFailed', args: [ this.appName ] });
		} else
		if (lines.length) {
			lines.push({ key: 'aiConnectKeyDeleted', args: [ this.appName ] });
		};

		if (!lines.length) {
			this.ui.toast({ key: 'aiConnectDisconnected', args: [ this.appName ] });
			this.ui.close();
			return;
		};
		// The leftover file is revealed only where main reveals the card's file and that is this file; else its path is copied (W19)
		const reveal = (res.left == 'entry') && !!path && (path == S.AiConnect.detection(this.data.appId)?.targetPaths?.[0]);

		this.set({ result: { lines, reveal, path: (res.left == 'entry') ? path : '' } });
	};

	async retryRevoke (): Promise<void> {
		const id = this.connection()?.id;

		this.set({ busy: true });
		await flow.retryRevoke();
		if (this.disposed) {
			return;
		};
		this.set({ busy: false });
		if (!S.AiConnect.getById(id)) {
			this.ui.toast({ key: 'aiConnectDisconnected', args: [ this.appName ] });
			this.ui.close();
		};
	};

	/** Retry check (probe only): in Manage, or in the manual view after a recorded key's probe failed (W14) */
	async retryCheck (): Promise<void> {
		const c = this.connection();

		if (!c) {
			return;
		};
		this.set({ busy: true });

		const res = await flow.retryProbe(c);

		if (this.disposed) {
			return;
		};

		const msg = probeMessage(res);

		this.set({ busy: false });
		if (this.state.view == 'manual') {
			this.setManual({ probeFailed: !res.ok, notice: res.ok ? msg : null, error: res.ok ? null : msg });
			return;
		};
		this.set({ manageNotice: msg });
	};

	async revealConnection (): Promise<void> {
		const c = this.connection();
		const ok = c ? await flow.reveal({ connectionId: c.id }) : await flow.reveal({ appId: this.data.appId, what: 'target' });

		if (!ok && !this.disposed) {
			this.ui.toast({ key: 'aiConnectRevealFailed' });
		};
	};

	/** The leftover file of a disconnect, when main's reveal of the card's file is that very file (W19) */
	async revealLeftover (): Promise<void> {
		if (!this.state.result?.reveal) {
			return;
		};

		const ok = await flow.reveal({ appId: this.data.appId, what: 'target' });

		if (!ok && !this.disposed) {
			this.ui.toast({ key: 'aiConnectRevealFailed' });
		};
	};

};

export const isErrorMsg = isError;
