/**
 * VS Code + GitHub Copilot (targetId `copilot`): `mcpServers.anytype` in <Copilot home>/mcp-config.json,
 * read by VS Code's Copilot chat, Copilot CLI and the GitHub Copilot app. No restart: a new chat (or the
 * CLI's next turn) picks it up.
 */
import type { Adapter, Ctx, Detected } from '../types';
import { bearer, err, keyOfBearer, manualPlan, mcpUrl, parseMcpUrl } from './common';
import { fileEntry, jsonFormat } from './jsonEntry';

const engine = fileEntry({
	format: jsonFormat([ 'mcpServers', 'anytype' ]),
	entry: (port, tier, key) => ({ type: 'http', url: mcpUrl(port, tier), headers: { Authorization: bearer(key) }, tools: [ '*' ] }),
	address: v => parseMcpUrl(v?.url),
	keyOf: v => keyOfBearer(v?.headers?.Authorization),
	nextStep: 'reloadServer',
	sentenceKey: 'aiConnectPlanConfigReload',
});

const file = (det: Detected): string | null => det.targetPaths[0] || null;

/** VS Code found → the chat instruction; only the Copilot CLI → its own */
const instructions = (ctx: Ctx, det: Detected) => {
	const vscode = !!det.appPath || !!det.exePath || !!ctx.homes.cli.code;
	return { reloadServer: (vscode || !ctx.homes.cli.copilot) ? 'aiConnectStepReloadServer' : 'aiConnectStepCopilotCli' };
};

export const copilot: Adapter = {
	ids: [ 'vscode' ],
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx, det, rec) => {
		const plan = { ...engine.plan(ctx, file(det), rec), instructions: instructions(ctx, det) };

		// A COPILOT_HOME that can't be used: manual, never the default location instead
		return ctx.homes.rejected.includes('COPILOT_HOME') ? manualPlan(plan, err('detect', 'outsideHome'), []) : plan;
	},
	apply: async (ctx, det, rec) => ctx.homes.rejected.includes('COPILOT_HOME') ? { ok: false, error: err('detect', 'outsideHome') } : engine.apply(ctx, file(det), rec),
	remove: (ctx, rec) => engine.remove(ctx, rec),
	check: (ctx, rec) => engine.check(ctx, rec),
	update: (ctx, rec, change) => engine.update(ctx, rec, change),
	installedFp: (ctx, rec) => engine.installedFp(ctx, rec),
	canRestart: () => false,
};
