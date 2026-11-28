/**
 * Gemini CLI (targetId `gemini-cli`): `mcpServers.anytype = { httpUrl, headers }` merged into the user's
 * ~/.gemini/settings.json, a file Gemini shares with its own settings (never a project's .gemini/settings.json).
 * The key header is there from the first request, so Gemini never starts its OAuth flow. Next: a new session.
 */
import type { Adapter, Detected } from '../types';
import { bearer, keyOfBearer, mcpUrl, parseMcpUrl } from './common';
import { fileEntry, jsonFormat } from './jsonEntry';

const engine = fileEntry({
	format: jsonFormat([ 'mcpServers', 'anytype' ]),
	entry: (port, tier, key) => ({ httpUrl: mcpUrl(port, tier), headers: { Authorization: bearer(key) } }),
	address: v => parseMcpUrl(v?.httpUrl),
	keyOf: v => keyOfBearer(v?.headers?.Authorization),
	nextStep: 'newSession',
	sentenceKey: 'aiConnectPlanConfigSession',
});

const INSTRUCTIONS = { newSession: 'aiConnectStepNewSession' };

const file = (det: Detected): string | null => det.targetPaths[0] || null;

export const geminiCli: Adapter = {
	ids: [ 'gemini-cli' ],
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx, det, rec) => ({ ...engine.plan(ctx, file(det), rec), instructions: INSTRUCTIONS }),
	apply: (ctx, det, rec) => engine.apply(ctx, file(det), rec),
	remove: (ctx, rec) => engine.remove(ctx, rec),
	check: (ctx, rec) => engine.check(ctx, rec),
	update: (ctx, rec, change) => engine.update(ctx, rec, change),
	installedFp: (ctx, rec) => engine.installedFp(ctx, rec),
	canRestart: () => false,
};
