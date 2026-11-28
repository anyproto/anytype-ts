/**
 * Antigravity, app, IDE and `agy` CLI (targetId `antigravity`): `mcpServers.anytype = { serverUrl, headers }` in
 * ~/.gemini/config/mcp_config.json (antigravity.google/docs/mcp: Streamable HTTP only, no `httpUrl`, no SSE).
 * Next: reload the servers in the MCP manager (`/mcp` in the CLI, the server's menu in the app) or restart.
 */
import type { Adapter, Detected } from '../types';
import { bearer, keyOfBearer, mcpUrl, parseMcpUrl } from './common';
import { fileEntry, jsonFormat } from './jsonEntry';

const engine = fileEntry({
	format: jsonFormat([ 'mcpServers', 'anytype' ]),
	entry: (port, tier, key) => ({ serverUrl: mcpUrl(port, tier), headers: { Authorization: bearer(key) } }),
	address: v => parseMcpUrl(v?.serverUrl),
	keyOf: v => keyOfBearer(v?.headers?.Authorization),
	nextStep: 'reloadServer',
	sentenceKey: 'aiConnectPlanConfigMcpReload',
});

const INSTRUCTIONS = { reloadServer: 'aiConnectStepAntigravityReload' };

const file = (det: Detected): string | null => det.targetPaths[0] || null;

export const antigravity: Adapter = {
	ids: [ 'antigravity' ],
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx, det, rec) => ({ ...engine.plan(ctx, file(det), rec), instructions: INSTRUCTIONS }),
	apply: (ctx, det, rec) => engine.apply(ctx, file(det), rec),
	remove: (ctx, rec) => engine.remove(ctx, rec),
	check: (ctx, rec) => engine.check(ctx, rec),
	update: (ctx, rec, change) => engine.update(ctx, rec, change),
	installedFp: (ctx, rec) => engine.installedFp(ctx, rec),
	canRestart: () => false,
};
