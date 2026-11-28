/**
 * Connect to AI apps: the incoming `anytype://ai/connect?app=<id>` link, as the route main forwards
 * (`/ai/connect?app=<id>`), and the Settings ▸ AI apps route. Pure; shared with Electron main (relative
 * import), so it uses no path aliases and touches no globals. Only a catalog id survives a link; every other
 * field is dropped, and a link never carries or creates a key.
 */
import { isCatalogId } from './catalog';

const PATH_RE = /^\/?ai\/connect\/?$/;

/** Where Settings ▸ AI apps was opened from: the only values its `route` field (and AiConnectOpen's) may carry */
export const OPEN_ROUTES = [ 'Settings', 'Deeplink', 'Notification', 'MenuHelp', 'ScreenSettingsApi' ];

/** As main validates a connection id (`validate.ts`) */
export const CONNECTION_ID_RE = /^[a-z0-9-]{1,64}$/;

/** A space id in a settings route */
const SPACE_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

const split = (route: string): { path: string; query: string } => {
	const value = String(route || '');
	const hash = value.indexOf('#');
	const clean = (hash >= 0) ? value.slice(0, hash) : value;
	const q = clean.indexOf('?');

	return { path: (q >= 0) ? clean.slice(0, q) : clean, query: (q >= 0) ? clean.slice(q + 1) : '' };
};

const decode = (s: string): string => {
	try {
		return decodeURIComponent(s);
	} catch (e) {
		return s;
	};
};

/**
 * `{ app }` when `route` is exactly the AI-connect path (optional trailing slash): `app` is the catalog id
 * from the query, or '' when it is missing or unknown. null for any other path.
 */
export const parseAiConnectRoute = (route: string): { app: string } | null => {
	const { path, query } = split(route);

	if (!PATH_RE.test(path)) {
		return null;
	};

	let app = '';

	try {
		app = new URLSearchParams(query).get('app') || '';
	} catch (e) {
		app = '';
	};

	return { app: isCatalogId(app) ? app : '' };
};

/** The allowed fields of a Settings ▸ AI apps route, each validated; anything else is dropped */
const AI_APPS_FIELDS: Record<string, (v: string) => boolean> = {
	spaceId: v => SPACE_ID_RE.test(v),
	app: v => isCatalogId(v),
	connection: v => CONNECTION_ID_RE.test(v),
	route: v => OPEN_ROUTES.includes(v),
};

/**
 * The route's fields as `U.Router.getParam` resolves them: page / action / id, the path's key-value pairs, then
 * the query's fields over them, every key and value decoded (so an encoded or query-given page, action or id
 * counts). Mirrors the router's generic parse; the remaps it applies (object, invite, membership, hi) never
 * lead to an AI page.
 */
const resolveRoute = (route: string): Record<string, string> => {
	const parts = String(route || '').split('?');
	const path = String(parts[0] || '').split('/');
	const search = String(parts[1] || '');

	if (path[0] == '') {
		path.shift();
	};

	const param: any = { page: String(path[0] || 'index'), action: String(path[1] || 'index'), id: String(path[2] || '') };

	for (let i = 3; i < path.length; i += 2) {
		param[path[i]] = path[i + 1];
	};

	if (search) {
		try {
			new URLSearchParams(search).forEach((v, k) => {
				param[k] = v;
			});
		} catch (e) { /* no query */ };
	};

	const out: Record<string, string> = {};

	for (const k in param) {
		out[decode(String(k || ''))] = decode(String(param[k] || ''));
	};
	return out;
};

/**
 * The canonical form of a route that leads to an AI page, or null for any other route. A link (`/ai/connect`,
 * or the `main/aiConnect` page in any spelling) keeps only its catalog id: `/ai/connect?app=<id>`. The AI apps
 * page (`main/settings/aiApps` in any spelling) keeps only its allowed fields, each validated, as
 * `/main/settings/aiApps/<field>/<value>…` (`U.Router.build`'s shape). A `key`, or any other field, never
 * survives into history, a tab or a redirect.
 */
export const canonicalAiRoute = (route: string): string | null => {
	const link = (app: string) => (isCatalogId(app) ? `/ai/connect?app=${app}` : '/ai/connect');
	const ai = parseAiConnectRoute(route);

	if (ai) {
		return link(ai.app);
	};

	const fields = resolveRoute(route);

	if (fields.page != 'main') {
		return null;
	};
	if (fields.action == 'aiConnect') {
		return link(fields.app || '');
	};
	if ((fields.action != 'settings') || (fields.id != 'aiApps')) {
		return null;
	};

	const out = [ '', 'main', 'settings', 'aiApps' ];

	for (const k of Object.keys(AI_APPS_FIELDS)) {
		const v = fields[k];

		if ((typeof v == 'string') && AI_APPS_FIELDS[k](v)) {
			out.push(k, v);
		};
	};
	return out.map(it => encodeURIComponent(it)).join('/');
};

/** The catalog id of a route that is an AI link in any spelling (null for any other route) */
export const aiLinkOf = (route: string): { app: string } | null => {
	const canonical = canonicalAiRoute(route);

	return canonical ? parseAiConnectRoute(canonical) : null;
};

/**
 * The router's final resolved params (after its aliases and query overrides), kept to the allowed fields when they
 * lead to an AI page; any other params as they are (B1). The one filter every route passes before history,
 * `updateTab` or a redirect, whatever its spelling.
 */
export const allowAiParam = (param: Record<string, any>): Record<string, any> => {
	if (!param || (param.page != 'main')) {
		return param;
	};
	if (param.action == 'aiConnect') {
		const app = String(param.app || '');

		return { page: 'main', action: 'aiConnect', id: '', ...(isCatalogId(app) ? { app } : {}) };
	};
	if ((param.action != 'settings') || (param.id != 'aiApps')) {
		return param;
	};

	const ret: Record<string, any> = { page: 'main', action: 'settings', id: 'aiApps' };

	for (const k of Object.keys(AI_APPS_FIELDS)) {
		const v = param[k];

		if ((typeof v == 'string') && AI_APPS_FIELDS[k](v)) {
			ret[k] = v;
		};
	};
	return ret;
};

/** The params lead to an AI page */
export const isAiParam = (param: Record<string, any>): boolean => (param?.page == 'main') && ((param.action == 'aiConnect') || ((param.action == 'settings') && (param.id == 'aiApps')));
