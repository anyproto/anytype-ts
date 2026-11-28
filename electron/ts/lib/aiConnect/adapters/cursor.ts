/**
 * Cursor (targetId `cursor`): `mcpServers.anytype` in ~/.cursor/mcp.json. After the commit, best effort:
 * `agent mcp enable anytype` when a runnable `agent` CLI exists. Restart afterwards.
 */
import type { Adapter, AiRecord, Ctx, Detected } from '../types';
import { runCli } from '../exec';
import { bearer, keyOfBearer, mcpUrl, parseMcpUrl } from './common';
import { fileEntry, jsonFormat } from './jsonEntry';

const engine = fileEntry({
	format: jsonFormat([ 'mcpServers', 'anytype' ]),
	entry: (port, tier, key) => ({ url: mcpUrl(port, tier), headers: { Authorization: bearer(key) } }),
	address: v => parseMcpUrl(v?.url),
	keyOf: v => keyOfBearer(v?.headers?.Authorization),
	nextStep: 'restart',
	sentenceKey: 'aiConnectPlanConfigRestart',
});

const INSTRUCTIONS = { restart: 'aiConnectStepRestart', afterRestart: 'aiConnectHintCursor', added: 'aiConnectHintCursor' };

const file = (det: Detected): string | null => det.targetPaths[0] || null;

export const cursor: Adapter = {
	ids: [ 'cursor' ],
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx: Ctx, det: Detected, rec: AiRecord | null) => ({ ...engine.plan(ctx, file(det), rec), instructions: INSTRUCTIONS }),
	apply: async (ctx, det, rec) => {
		const res = await engine.apply(ctx, file(det), rec);

		// Post-commit, best effort: switch the server on where Cursor's agent CLI exists
		if (res.ok && ctx.homes.cli.agent) {
			await runCli(ctx.env, ctx.homes, 'agent', [ 'mcp', 'enable', 'anytype' ], { timeout: 5000 });
		};
		return res;
	},
	remove: (ctx, rec) => engine.remove(ctx, rec),
	check: (ctx, rec) => engine.check(ctx, rec),
	update: (ctx, rec, change) => engine.update(ctx, rec, change),
	installedFp: (ctx, rec) => engine.installedFp(ctx, rec),
	canRestart: (env, det) => det.installed && (((env.platform == 'darwin') && !!det.appPath) || ((env.platform == 'win32') && !!det.exePath)),
};
