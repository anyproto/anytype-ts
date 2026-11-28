/**
 * LM Studio (targetId `lmstudio`), `<LM home>/mcp.json`.
 *
 * - Deeplink, first install only, macOS only: no record, no `anytype` entry in the file, not asked for
 *   the file route, and the `lmstudio:` handler is the detected LM Studio (its canonical path equals the
 *   detected app bundle). Commit = opening `lmstudio://add_mcp?…`. The record stays pending until check
 *   finds an entry with the expected fingerprint. Windows / Linux: detection has no verified LM Studio
 *   executable to compare the handler with, so they always take the file route.
 * - The file route in every other case (reconnect, tier / port change, an existing entry, method
 *   'config', no trusted handler).
 */
import type { Adapter, AiPlan, AiRecord, ApplyOutcome, Ctx, Detected } from '../types';
import { canonicalPath, resolveTarget } from '../fsSafe';
import { basePlan, bearer, err, keyOfBearer, mcpUrl, parseMcpUrl } from './common';
import { fileEntry, jsonFormat } from './jsonEntry';

const entry = (port: number, tier: any, key: string) => ({ url: mcpUrl(port, tier), headers: { Authorization: bearer(key) } });

const engine = fileEntry({
	format: jsonFormat([ 'mcpServers', 'anytype' ]),
	entry,
	address: v => parseMcpUrl(v?.url),
	keyOf: v => keyOfBearer(v?.headers?.Authorization),
	nextStep: 'toggle',
	sentenceKey: 'aiConnectPlanConfigReload',
});

const INSTRUCTIONS = { confirmInApp: 'aiConnectHintLmstudio', toggle: 'aiConnectStepToggle', added: 'aiConnectStepApproveFirstCall' };

const file = (det: Detected): string | null => det.targetPaths[0] || null;

/** The deeplink that adds the entry; the key is inside it, so it is only ever handed to openExternal */
export const deeplink = (port: number, tier: any, key: string): string => {
	const config = Buffer.from(JSON.stringify(entry(port, tier, key)), 'utf8').toString('base64');
	return `lmstudio://add_mcp?name=anytype&config=${encodeURIComponent(config)}`;
};

/** macOS: the `lmstudio:` handler is the LM Studio bundle detection found (same canonical path) */
const trustedHandler = async (ctx: Ctx, det: Detected): Promise<boolean> => {
	if ((ctx.env.platform != 'darwin') || !det.appPath) {
		return false;
	};

	const handler = await ctx.env.protocolHandler('lmstudio');
	const a = handler?.path ? canonicalPath(ctx.env, handler.path) : null;
	const b = canonicalPath(ctx.env, det.appPath);

	return !!a && !!b && (a == b);
};

/** Deeplink only for a first install into a file without our entry, through the detected LM Studio */
const useDeeplink = async (ctx: Ctx, det: Detected, rec: AiRecord | null, plan: AiPlan): Promise<boolean> => !rec && (ctx.method != 'config') && plan.canApply && (plan.existing == 'none') && (await trustedHandler(ctx, det));

export const lmstudio: Adapter = {
	ids: [ 'lmstudio' ],
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx, det, rec) => {
		const plan = { ...engine.plan(ctx, file(det), rec), instructions: INSTRUCTIONS };

		if (await useDeeplink(ctx, det, rec, plan)) {
			return { ...plan, ...basePlan(ctx, { targetId: ctx.targetId, method: 'deeplink', nextStep: 'confirmInApp', displayTarget: plan.displayTarget, sentenceKey: 'aiConnectPlanDeeplink' }), steps: plan.steps, instructions: INSTRUCTIONS };
		};
		return plan;
	},
	apply: async (ctx, det, rec): Promise<ApplyOutcome> => {
		const plan = engine.plan(ctx, file(det), rec);

		if (!(await useDeeplink(ctx, det, rec, plan))) {
			return engine.apply(ctx, file(det), rec);
		};

		const target = resolveTarget(ctx.env, file(det));

		if ('error' in target) {
			return { ok: false, error: target.error };
		};
		if (!(await ctx.env.openExternal(deeplink(ctx.port, ctx.tier, ctx.key)))) {
			return { ok: false, error: err('open', 'unknown') };
		};
		return { ok: true, method: 'deeplink', nextStep: 'confirmInApp', targetPath: target.real, observedInstalled: false, createdDirs: [] };
	},
	remove: (ctx, rec) => engine.remove(ctx, rec),
	check: (ctx, rec) => engine.check(ctx, rec),
	update: (ctx, rec, change) => engine.update(ctx, rec, change),
	installedFp: (ctx, rec) => engine.installedFp(ctx, rec),
	canRestart: () => false,
};
