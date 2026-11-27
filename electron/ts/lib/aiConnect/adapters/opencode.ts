/**
 * OpenCode (targetId `opencode`): a remote entry in ~/.config/opencode/opencode.json(c), a JSONC file edited in
 * place (comments kept). Two layouts: v1 `mcp.anytype = { …, enabled: true }`, v2 `mcp.servers.anytype`. The file
 * decides when it already uses one; else `opencode --version`; else nothing is written (set up by hand).
 * Always `oauth: false` with the key header, so OpenCode never probes for OAuth. Next: restart OpenCode.
 * Not the v2 `opencode mcp add … --header`: it would put the key in argv, and the file merge works for both.
 */
import type { Adapter, AiRecord, Ctx, Detected } from '../types';
import { readSnapshot, resolveTarget } from '../fsSafe';
import { getJsonPath, type JsonPath } from '../jsonFile';
import { runCli } from '../exec';
import { bearer, err, keyOfBearer, manualPlan, mcpUrl, parseMcpUrl, protectedTarget } from './common';
import { fileEntry, jsonFormat } from './jsonEntry';

export type OpencodeLayout = 1 | 2;

const spec = (path: JsonPath, extra: Record<string, boolean>) => fileEntry({
	format: jsonFormat(path),
	entry: (port, tier, key) => ({ type: 'remote', url: mcpUrl(port, tier), ...extra, oauth: false, headers: { Authorization: bearer(key) } }),
	address: v => (v?.type == 'remote') ? parseMcpUrl(v?.url) : null,
	keyOf: v => keyOfBearer(v?.headers?.Authorization),
	nextStep: 'restart',
	sentenceKey: 'aiConnectPlanConfigRestart',
});

const ENGINES = {
	1: spec([ 'mcp', 'anytype' ], { enabled: true }),
	2: spec([ 'mcp', 'servers', 'anytype' ], {}),
};

const INSTRUCTIONS = { restart: 'aiConnectStepRestartSelf' };

const isObject = (v: any): boolean => !!v && (typeof v == 'object') && !Array.isArray(v);

const file = (det: Detected): string | null => det.targetPaths[0] || null;

/** The layout a config already uses: a `servers` map under `mcp` (v2), or server entries right under it (v1); 0 when it doesn't tell */
export const fileLayout = (text: string | null): OpencodeLayout | 0 => {
	const mcp = getJsonPath(text, [ 'mcp' ]);

	if (!isObject(mcp)) {
		return 0;
	};
	// A v1 server is an object whose `type` is "local" or "remote"; `servers` is v2's map when its own `type` isn't a string (J6)
	if (isObject(mcp.servers) && (typeof mcp.servers.type != 'string')) {
		return 2;
	};
	return Object.keys(mcp).some(k => isObject(mcp[k]) && [ 'local', 'remote' ].includes(mcp[k].type)) ? 1 : 0;
};

/** The layout of the installed OpenCode: `opencode --version` major 2+ → v2, below → v1; 0 when it can't run */
export const versionLayout = (stdout: string): OpencodeLayout | 0 => {
	const m = /(\d+)\.\d+/.exec(String(stdout || ''));
	return m ? ((Number(m[1]) >= 2) ? 2 : 1) : 0;
};

const readText = (ctx: Ctx, path: string | null): string | null => {
	const t = path ? resolveTarget(ctx.env, path) : null;
	const snap = (t && !('error' in t)) ? readSnapshot(ctx.env, t.real) : null;

	return (snap && !('error' in snap)) ? snap.text : null;
};

/** The layout that already holds an anytype entry (v2 `mcp.servers.anytype`, v1 `mcp.anytype`), or 0 */
const entryLayout = (text: string | null): OpencodeLayout | 0 => {
	if (getJsonPath(text, [ 'mcp', 'servers', 'anytype' ]) !== undefined) {
		return 2;
	};
	return (getJsonPath(text, [ 'mcp', 'anytype' ]) !== undefined) ? 1 : 0;
};

const layoutFor = async (ctx: Ctx, path: string | null): Promise<OpencodeLayout | 0> => {
	const text = readText(ctx, path);
	// An entry already there decides first: a rotation writes where the owned entry is (J6)
	const known = entryLayout(text) || fileLayout(text);

	if (known || !ctx.homes.cli.opencode) {
		return known;
	};

	const res = await runCli(ctx.env, ctx.homes, 'opencode', [ '--version' ], { timeout: 5000 });
	return ((res.code == 0) && !res.timedOut) ? versionLayout(res.stdout) : 0;
};

/** An existing record's engine: where its entry is (v2 when under `mcp.servers`) */
const engineOf = (ctx: Ctx, rec: AiRecord) => {
	const text = readText(ctx, rec.targetPath);
	return ENGINES[(entryLayout(text) || fileLayout(text) || 1) as OpencodeLayout];
};

export const opencode: Adapter = {
	ids: [ 'opencode' ],
	strictPreview: true,
	target: (env, det) => (det.targetId && file(det)) ? { targetId: det.targetId, path: file(det) } : null,
	plan: async (ctx, det, rec) => {
		const layout = await layoutFor(ctx, file(det));
		const plan = { ...ENGINES[layout || 2].plan(ctx, file(det), rec), instructions: INSTRUCTIONS };

		// A file that doesn't parse still names the place, so "I've updated" can be confirmed after a repair (J5)
		if (!plan.targetPath && file(det)) {
			const t = resolveTarget(ctx.env, file(det));

			if (!('error' in t) && !protectedTarget(ctx.env, t.real)) {
				plan.targetPath = t.real;
			};
		};

		if (layout) {
			return plan;
		};

		// The version can't be told: nothing is written; the steps show both layouts, labelled (H11)
		const v1 = ENGINES[1].plan(ctx, file(det), rec).steps;
		const v2 = plan.steps;
		const merge = (steps: any[]) => steps.find(s => s.snippet);
		const steps = (v1.length && v2.length) ? [
			{ textKey: 'aiConnectManualOpencodeVersion', snippet: 'opencode --version', lang: 'sh' },
			...v2.filter(s => !s.snippet),
			{ ...merge(v1), textKey: 'aiConnectManualOpencodeV1' },
			{ ...merge(v2), textKey: 'aiConnectManualOpencodeV2' },
		] : v2;

		return manualPlan(plan, err('cli', 'cliTooOld'), steps);
	},
	apply: async (ctx, det, rec) => {
		const layout = await layoutFor(ctx, file(det));
		return layout ? ENGINES[layout].apply(ctx, file(det), rec) : { ok: false, error: err('cli', 'cliTooOld') };
	},
	remove: (ctx, rec) => engineOf(ctx, rec).remove(ctx, rec),
	check: (ctx, rec) => engineOf(ctx, rec).check(ctx, rec),
	update: (ctx, rec, change) => engineOf(ctx, rec).update(ctx, rec, change),
	installedFp: (ctx, rec) => engineOf(ctx, rec).installedFp(ctx, rec),
	canRestart: () => false,
};
