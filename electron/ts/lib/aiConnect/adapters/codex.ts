/**
 * ChatGPT and Codex (`[mcp_servers.anytype]` in config.toml). ChatGPT always reads ~/.codex/config.toml;
 * Codex reads <Codex home>/config.toml. A card maps to a record by canonical path, so both cards share
 * one record when the files are the same (targetId `codex`), and a custom Codex home gets its own.
 *
 * Next step: `restart` only when the ChatGPT app is installed and the changed file is the one it reads;
 * otherwise a new Codex session. Restart only on macOS (no verified executable elsewhere).
 */
import type { Adapter, AiNextStep, AiPlan, AiRecord, ApplyOutcome, Ctx, Detected } from '../types';
import { canonicalPath, pathOf } from '../fsSafe';
import { bearer, err, keyOfBearer, manualPlan, mcpUrl, parseMcpUrl } from './common';
import { fileEntry, tomlFormat } from './jsonEntry';

const spec = (nextStep: AiNextStep) => fileEntry({
	format: tomlFormat(),
	entry: (port, tier, key) => ({ url: mcpUrl(port, tier), http_headers: { Authorization: bearer(key) } }),
	address: v => parseMcpUrl(v?.url),
	keyOf: v => keyOfBearer(v?.http_headers?.Authorization),
	nextStep,
	sentenceKey: (nextStep == 'restart') ? 'aiConnectPlanConfigRestart' : 'aiConnectPlanConfigSession',
});

const file = (det: Detected): string | null => det.targetPaths[0] || null;

/** The ChatGPT app reads this file: it is ~/.codex/config.toml and ChatGPT is installed */
const chatgptReads = (ctx: Ctx, real: string | null): boolean => {
	const chatgpt = ctx.detections.find(d => d.appId == 'chatgpt');
	const defaultFile = canonicalPath(ctx.env, pathOf(ctx.env).join(ctx.env.home, '.codex', 'config.toml'));

	return !!chatgpt?.installed && !!real && (real == defaultFile);
};

const engineFor = (ctx: Ctx, real: string | null) => spec(chatgptReads(ctx, real) ? 'restart' : 'newSession');

const instructions = (ctx: Ctx, nextStep: AiNextStep): AiPlan['instructions'] => {
	const chatgpt = ctx.detections.find(d => d.appId == 'chatgpt');
	const ret: AiPlan['instructions'] = {
		restart: ((ctx.env.platform == 'darwin') && !!chatgpt?.appPath) ? 'aiConnectStepRestart' : 'aiConnectStepRestartSelf',
		newSession: 'aiConnectStepNewSession',
	};

	if (ctx.appId == 'chatgpt') {
		ret.added = 'aiConnectChatgptModes';
	};
	return (nextStep == 'restart') ? ret : { ...ret, restart: undefined };
};

export const codex: Adapter = {
	ids: [ 'chatgpt', 'codex' ],
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx, det, rec) => {
		const engine = engineFor(ctx, file(det));
		const plan = engine.plan(ctx, file(det), rec);

		// A CODEX_HOME that can't be used: manual, never ChatGPT's file instead
		if ((ctx.appId == 'codex') && ctx.homes.rejected.includes('CODEX_HOME')) {
			return { ...manualPlan(plan, err('detect', 'outsideHome'), []), instructions: {} };
		};
		return { ...plan, instructions: instructions(ctx, plan.nextStep) };
	},
	apply: async (ctx, det, rec): Promise<ApplyOutcome> => {
		if ((ctx.appId == 'codex') && ctx.homes.rejected.includes('CODEX_HOME')) {
			return { ok: false, error: err('detect', 'outsideHome') };
		};
		return engineFor(ctx, file(det)).apply(ctx, file(det), rec);
	},
	remove: (ctx, rec: AiRecord) => engineFor(ctx, rec.targetPath).remove(ctx, rec),
	check: (ctx, rec) => engineFor(ctx, rec.targetPath).check(ctx, rec),
	update: (ctx, rec, change) => engineFor(ctx, rec.targetPath).update(ctx, rec, change),
	installedFp: (ctx, rec) => engineFor(ctx, rec.targetPath).installedFp(ctx, rec),
	// The ChatGPT app on macOS; the Codex CLI has nothing to restart
	canRestart: (env, det) => (det.appId == 'chatgpt') && det.installed && (env.platform == 'darwin') && !!det.appPath,
};
