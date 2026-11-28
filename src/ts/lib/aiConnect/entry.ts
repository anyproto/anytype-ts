/**
 * Connect to AI apps: the ways into Settings ▸ AI apps (§5.8) — a link (`link.ts`), Help ▸ Connect to AI…, the
 * nudge and the API Keys backlink. They all open the page with a one-shot target in its route
 * (`Action.openAiApps`). The page takes the target off its history entry at once, keeps it for that visit, and
 * opens the popup once the list is loaded. A link never carries or creates a key.
 *
 * Uses the app's globals `S`, `U` and `analytics` (tests stub them).
 */
import * as I from 'Interface';
import type { AiConnection } from '../../interface/aiConnect';
import { getCatalogItem, isCatalogId, searchCatalog } from './catalog';
import type { AiConnectPopupData } from './controller';
import { CONNECTION_ID_RE, OPEN_ROUTES } from './deeplink';
import { track } from './events';
import * as flow from './flow';

/** The route keys the target uses; the page removes all of them */
const TARGET_KEYS = [ 'app', 'connection', 'route' ];

export interface AiRouteTarget {
	/** A catalog id: the card's default view */
	app: string;
	/** A connection id: its Manage (the only way to address an Other-app record) */
	connection: string;
	/** An analytics route from OPEN_ROUTES */
	route: string;
};

/** The target in route params; anything not valid is '' */
export const routeTarget = (params: any): AiRouteTarget => {
	const p = params || {};
	const app = String(p.app || '');
	const connection = String(p.connection || '');
	const route = String(p.route || '');

	return {
		app: isCatalogId(app) ? app : '',
		connection: CONNECTION_ID_RE.test(connection) ? connection : '',
		route: OPEN_ROUTES.includes(route) ? route : '',
	};
};

/** Route params for the page: a connection wins over an app; empty values are left out */
export const targetParam = (target?: { app?: string; connection?: string }, route?: string): Record<string, string> => {
	const ret: Record<string, string> = {};

	if (target?.connection) {
		ret.connection = target.connection;
	} else
	if (target?.app) {
		ret.app = target.app;
	};
	if (route) {
		ret.route = route;
	};
	return ret;
};

/** The settings object `U.Object.route` / `openRoute` take for the page with a target */
export const aiAppsObject = (target?: { app?: string; connection?: string }, route?: string) => ({
	id: 'aiApps',
	layout: I.ObjectLayout.Settings,
	_routeParam_: targetParam(target, route),
});

/**
 * `route` without the target keys. A route without a space gets the active one: the page then matches the same
 * keyed route before and after, so the gallery holding the target isn't remounted (A6).
 */
export const withoutTarget = (route: string): string => {
	const param = U.Router.getParam(route);

	TARGET_KEYS.forEach(k => delete param[k]);
	if (!param.spaceId && S.Common.space) {
		param.spaceId = S.Common.space;
	};
	return U.Router.build(param);
};

/** An app's row is hidden by the gallery's search: the search is cleared, visibly, to show it (A12) */
export const revealClearsQuery = (appId: string, query: string, nameOf: (item: any) => string): boolean => {
	return !!String(query || '').trim() && !searchCatalog(query, nameOf).some(it => it.id == appId);
};

/**
 * What a target opens, with this account's list and detections: popup data, `'wait'` (an app the scan
 * couldn't see: after a successful Scan again) or null (nothing: a record that is gone or being removed, or
 * an app that isn't installed, whose row offers Get app and Set up manually).
 */
export const resolveTarget = (target: { app?: string; connection?: string }): AiConnectPopupData | 'wait' | null => {
	if (target.connection) {
		const c = S.AiConnect.getById(target.connection);
		return (c && !c.removed) ? { appId: c.appId, connectionId: c.id } : null;
	};

	const item = target.app ? getCatalogItem(target.app) : null;

	if (!item || (item.onlyInstalled && !S.AiConnect.isInstalled(item.id))) {
		return null;
	};
	// A connected card opens its connection with the owner's identity, as its row does (ChatGPT for Codex's shared
	// file, A11); other and unsupported cards have views of their own
	const mapped = S.AiConnect.getByApp(item.id);

	if (mapped) {
		return { appId: mapped.appId, connectionId: mapped.id };
	};
	if ((item.kind != 'app') || S.AiConnect.isInstalled(item.id)) {
		return { appId: item.id };
	};
	return S.AiConnect.scanOk ? null : 'wait';
};

export interface GalleryDeps {
	/** Opens the popup */
	open: (data: AiConnectPopupData) => void;
	/** Shows the card of an app that isn't installed (its Get app / Set up manually row) */
	show: (appId: string) => void;
};

const accountId = (): string => String(S.Auth.account?.id || '');
const entryKey = (): string => String(U.Router.history?.location?.key || '');

/**
 * One visit of the page. `arrive` takes a route's target (first open, or a new one while open), takes it off the
 * history entry at once (Back, Forward and a restored tab never replay it) and binds it to that cleaned entry and
 * account (A6). It opens once this account's list loaded — a record only after a successful check (A7) — and a
 * failed load or check keeps it for Scan again. Leaving the entry drops the target and closes the sheet it opened.
 */
export class GalleryVisit {

	private pending: { target: AiRouteTarget; account: string; key: string } | null = null;
	/** The cleaned entry this visit's target and sheet belong to ('' while it is being cleaned) */
	private key = '';
	/** This visit opened the sheet now showing */
	private opened = false;
	private seq = 0;
	private disposed = false;
	private unlisten: (() => void) | null = null;
	private readonly deps: GalleryDeps;

	constructor (deps: GalleryDeps) {
		this.deps = deps;
		this.unlisten = U.Router.history?.listen?.(() => this.onLocation()) || null;
	};

	arrive (first: boolean, target: AiRouteTarget): void {
		const hasTarget = !!(target.app || target.connection || target.route);

		if (this.disposed) {
			return;
		};
		if (first || target.route) {
			track.open(target.route || 'Settings');
		};
		if (!first && !hasTarget) {
			return;
		};
		if (hasTarget) {
			this.key = '';
			U.Router.replaceCurrent(withoutTarget(U.Router.getRoute()));
		};
		this.key = entryKey();
		this.pending = (target.app || target.connection) ? { target: { ...target }, account: accountId(), key: this.key } : null;
		this.refresh(first ? 'open' : '', false);
	};

	/** Loads (with detection for Scan again), checks when asked or for a record, and opens a pending target */
	async refresh (reason: string, detect: boolean): Promise<void> {
		if (this.disposed) {
			return;
		};
		if (!flow.isDesktop()) {
			this.pending = null;
			return;
		};

		const seq = ++this.seq;
		const byRecord = !!this.pending?.target.connection;

		// A failed load stops here: the target waits for Scan again (A7)
		if (!(await flow.load(detect)) || this.disposed) {
			return;
		};
		if (!byRecord) {
			this.openPending(seq);
		};
		if (reason || byRecord) {
			const status = await flow.check(reason || 'open');

			// A record opens only on a reconciled list; a failed check keeps it for Scan again (A7)
			if (byRecord && (status == 'ok')) {
				this.openPending(seq);
			};
		};
	};

	dispose (): void {
		this.disposed = true;
		this.pending = null;
		this.unlisten?.();
		this.unlisten = null;
	};

	/** History moved: leaving this visit's entry drops its target and closes the sheet it opened (A6) */
	private onLocation (): void {
		if (!this.key || (entryKey() == this.key)) {
			return;
		};

		this.key = '';
		this.pending = null;
		if (this.opened) {
			this.opened = false;
			if (S.Popup.isOpen('aiConnect')) {
				S.Popup.close('aiConnect');
			};
		};
	};

	private openPending (seq: number): void {
		const p = this.pending;

		if (!p || this.disposed || (seq != this.seq)) {
			return;
		};
		// This visit only: still on the entry it arrived on, under the same account
		if ((entryKey() != p.key) || (accountId() != p.account)) {
			this.pending = null;
			return;
		};

		const res = resolveTarget(p.target);

		if (res == 'wait') {
			return;
		};

		this.pending = null;
		if (res) {
			this.opened = true;
			this.deps.open(res);
		} else
		if (p.target.app) {
			this.deps.show(p.target.app);
		};
	};

};

/** The connection an API key row belongs to (the API Keys backlink), Other-app records included */
export const connectionForKey = (hash: string, list: AiConnection[] = S.AiConnect.connectionList): AiConnection | null => {
	if (!hash) {
		return null;
	};
	return (list || []).find(c => c.appHash == hash) || null;
};
