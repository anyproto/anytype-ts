/**
 * Pieces every adapter shares: the MCP URL and bearer header, plan building, readable errors.
 * Pure; no file system.
 */
import type { AiAppId, AiError, AiMethod, AiNextStep, AiPlan, AiRoute, AiStep, AiTier, Ctx, Env } from '../types';
import { KEY_PLACEHOLDER, TIERS, getCatalogItem, isValidPort } from '../../../../../src/ts/lib/aiConnect/catalog';
import { canonicalPath, isInside, pathOf } from '../fsSafe';
import { anytypeHomeDir } from '../bundle';

/** The one URL form Anytype writes: loopback, a port, one of the three tiers */
export const mcpUrl = (port: number, tier: AiTier): string => `http://127.0.0.1:${port}/mcp/${tier}`;

/** The API base URL (the skill route) */
export const apiUrl = (port: number): string => `http://127.0.0.1:${port}`;

export const bearer = (key: string): string => `Bearer ${key}`;

/** The key of a `Bearer <key>` header value, or null */
export const keyOfBearer = (value: any): string | null => {
	const m = /^Bearer (\S+)$/.exec((typeof value == 'string') ? value : '');
	return m ? m[1] : null;
};

/** Port and tier of a URL Anytype could have written, or null */
export const parseMcpUrl = (url: any): { port: number; tier: AiTier } | null => {
	const m = /^http:\/\/127\.0\.0\.1:(\d{1,5})\/mcp\/(small|large|full)$/.exec((typeof url == 'string') ? url : '');
	const port = m ? Number(m[1]) : 0;

	return (m && isValidPort(port) && TIERS.includes(m[2] as AiTier)) ? { port, tier: m[2] as AiTier } : null;
};

/** Port of an API base URL Anytype could have written, or 0 */
export const parseApiUrl = (url: any): number => {
	const m = /^http:\/\/127\.0\.0\.1:(\d{1,5})$/.exec((typeof url == 'string') ? url : '');
	const port = m ? Number(m[1]) : 0;

	return isValidPort(port) ? port : 0;
};

export const err = (stage: AiError['stage'], category: AiError['category'], path?: string): AiError => ({ stage, category, ...(path ? { path } : {}) });

/** A heal may still write: the API listens on the check's port right now (B2). Called right before each heal write */
export const stillLive = (ctx: Ctx): boolean => !ctx.stillLive || ctx.stillLive();

/** A plain `{ ok: false, error }` */
export const fail = (stage: AiError['stage'], category: AiError['category'], path?: string): { ok: false; error: AiError } => ({ ok: false, error: err(stage, category, path) });

/** The card's display name (brand names only; cards with a name key aren't adapters' business) */
export const appName = (appId: AiAppId): string => getCatalogItem(appId)?.name || '';

/** targetPath with the home prefix replaced by '~' */
export const displayPath = (env: Env, p: string): string => {
	if (!p) {
		return '';
	};

	const P = pathOf(env);

	if (isInside(env, env.home, p)) {
		const rel = P.relative(env.home, p);
		return rel ? `~${P.sep}${rel}` : '~';
	};
	return p;
};

/** JSON for a manual step: 2-space indent, the key placeholder where the key goes */
export const snippet = (value: any): string => JSON.stringify(value, null, 2);

/**
 * The manual step for a JSON settings file: `doc` is a whole document (parent objects included) the user
 * merges into the file (`aiConnectManualMerge`); pasted into an empty file it is the file. Never "add
 * under X" with a snippet that already contains X.
 */
export const mergeStep = (doc: any, path?: string): AiStep => ({ textKey: 'aiConnectManualMerge', snippet: snippet(doc), lang: 'json', ...(path ? { path } : {}) });

/** Manual steps for a JSON settings file: open it, merge the document */
export const jsonFileSteps = (env: Env, file: string, doc: any): AiStep[] => [
	{ textKey: 'aiConnectManualOpen', args: [ displayPath(env, file) ], path: file },
	mergeStep(doc),
];

export type WriteMode = 'install' | 'owned';

/**
 * A writer's precondition, checked on EVERY attempt (a re-plan after `changed` included):
 * - `owned` (heal, update, skill refresh): our entry must still be there; gone → `gone` (never re-added).
 * - `install` (apply): a present entry must be ours or exactly the one the user agreed to replace; an absent
 *   one may be created only when it was absent from the start and no replace consent named this file (a
 *   previewed entry that disappeared, or one the user deleted meanwhile, stops the write).
 */
export const mayWrite = (p: { mode: WriteMode; present: boolean; owned: boolean; consent: boolean; consentHere: boolean; wasPresent: boolean }): 'ok' | 'conflict' | 'gone' => {
	if (p.present) {
		return (p.owned || ((p.mode == 'install') && p.consent)) ? 'ok' : 'conflict';
	};
	if (p.mode == 'owned') {
		return 'gone';
	};
	if (p.consentHere) {
		return 'conflict';
	};
	return p.wasPresent ? 'gone' : 'ok';
};

/** The error a `gone` verdict becomes: an owned rewrite finds nothing to rewrite; an install stops (the file changed under it) */
export const goneError = (mode: WriteMode, path: string): AiError => (mode == 'owned') ? err('read', 'notFound', path) : err('write', 'changed', path);

/**
 * POSIX: the file can be written by group or other. A key read back from it is not reused for a heal or an
 * update (someone else could have put it there); the connection needs attention instead.
 */
export const looseFile = (env: Env, mode: number | null): boolean => (env.platform != 'win32') && (mode !== null) && !!(mode & 0o022);

/** The plan fields every adapter fills the same way */
export const basePlan = (ctx: Ctx, p: {
	targetId: AiPlan['targetId'];
	method: AiMethod;
	nextStep: AiNextStep;
	displayTarget: string;
	sentenceKey: string;
	route?: AiRoute;
}): AiPlan => ({
	appId: ctx.appId,
	targetId: p.targetId,
	route: p.route || ctx.route,
	tier: ctx.tier,
	method: p.method,
	nextStep: p.nextStep,
	displayTarget: p.displayTarget,
	canApply: true,
	existing: 'none',
	sentenceKey: p.sentenceKey,
	instructions: {},
	steps: [],
});

/** A plan that can't be applied: manual steps only, with the reason */
export const manualPlan = (plan: AiPlan, error: AiError, steps: AiStep[]): AiPlan => ({
	...plan,
	canApply: false,
	method: 'manual',
	error,
	sentenceKey: 'aiConnectPlanManual',
	steps,
});

/** The entry with the key placeholder, for manual steps */
export const placeholder = KEY_PLACEHOLDER;

/**
 * `real` (a canonical target) lies in one of Anytype's own directories: its profile folder (registry, logs,
 * data) or `~/.anytype` (the connector, its items, the bundle copy). Another app's settings file there is
 * never written (its key would end up in Anytype's logs or registry, or next to the items).
 */
export const protectedTarget = (env: Env, real: string): boolean => [ ...(env.protectedDirs || []), anytypeHomeDir(env) ]
	.map(d => (d && canonicalPath(env, d)) || '')
	.some(d => !!d && isInside(env, d, real));

/** The refusal for a protected target */
export const protectedError = (path: string): AiError => err('write', 'permission', path);

/**
 * A destination the writer refuses as a place (outside home, or one of Anytype's own folders): the manual
 * steps then carry no key either (the user would put it exactly where Anytype must not)
 */
export const forbiddenPlace = (e: AiError): boolean => (e.category == 'outsideHome') || ((e.stage == 'write') && (e.category == 'permission'));
