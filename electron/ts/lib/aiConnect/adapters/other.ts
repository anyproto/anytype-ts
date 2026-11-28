/**
 * Other app. Two setups, both manual (no file writes, no installation check, no healing, no cleanup; the
 * connection is recorded through aiConnectRecordManual with its `setup`):
 * - URL and key (`url`): the address and the bearer header.
 * - Command (`command`, route stdio): the app starts the stable copy, `anytype-mcp serve --tier <t>`, with the
 *   key in the entry's `env` (never in `command` or `args`). The plan installs the stable copy and runs the
 *   preflight on it before any key exists; its steps hold only the placeholder.
 */
import type { Adapter, AiPlan, AiStep, Ctx } from '../types';
import { ensureInstalled, serveCommand, stdioSupported, usable } from '../forwarder';
import { preflight } from '../endpoint';
import { basePlan, bearer, err, manualPlan, mcpUrl, placeholder, snippet } from './common';

export const otherSteps = (ctx: Ctx): AiStep[] => {
	const url = mcpUrl(ctx.port, ctx.tier);

	return [
		{ textKey: 'aiConnectManualFormatMost', snippet: snippet({ mcpServers: { anytype: { url, headers: { Authorization: bearer(placeholder) } } } }), lang: 'json' },
		{ textKey: 'aiConnectManualUrl', snippet: url, lang: 'text' },
		{ textKey: 'aiConnectManualHeaderName', snippet: 'Authorization', lang: 'text' },
		{ textKey: 'aiConnectManualHeaderValue', snippet: bearer(placeholder), lang: 'text' },
	];
};

/** The Command setup is offered: other apps can start the forwarder this build ships */
export const commandOffered = (ctx: Ctx): boolean => stdioSupported(ctx.env) && usable(ctx.env).ok;

/** The setup text of the Command setup: the stable copy, the tier, and the key placeholder in `env` */
export const commandSteps = (ctx: Ctx): AiStep[] => [
	{ textKey: 'aiConnectManualCommandEntry', snippet: snippet({ mcpServers: { anytype: serveCommand(ctx.env, { tier: ctx.tier, key: placeholder }) } }), lang: 'json' },
	{ textKey: 'aiConnectManualKeepPrivate' },
	{ textKey: 'aiConnectManualCommandRestart' },
];

const setups = (ctx: Ctx): ('url' | 'command')[] => commandOffered(ctx) ? [ 'url', 'command' ] : [ 'url' ];

const manualOnly = { ok: false as const, error: err('validate', 'unknown') };

/** The Command setup's plan: the stable copy installed and judged safe by the forwarder first, else no key is minted */
const commandPlan = async (ctx: Ctx): Promise<AiPlan> => {
	const base: AiPlan = {
		...basePlan(ctx, { targetId: null, method: 'manual', nextStep: 'none', displayTarget: '', sentenceKey: 'aiConnectPlanManual', route: 'stdio' }),
		canApply: false,
		setups: setups(ctx),
		instructions: { restart: 'aiConnectManualCommandRestart' },
	};

	if (!stdioSupported(ctx.env)) {
		return { ...manualPlan(base, err('detect', 'unsupportedPackage'), []), note: 'aiConnectLinuxPackageLimit', needsKey: false };
	};

	const installed = await ensureInstalled(ctx.env);

	if (!('path' in installed)) {
		return { ...manualPlan(base, installed.error, []), needsKey: false };
	};

	const denied = await preflight(ctx, installed.path);

	if (denied) {
		return { ...manualPlan(base, denied, []), needsKey: false };
	};
	return { ...base, steps: commandSteps(ctx), needsKey: true };
};

export const other: Adapter = {
	ids: [ 'other' ],
	target: () => null,
	plan: async ctx => {
		if (ctx.method == 'command') {
			return commandPlan(ctx);
		};
		return {
			...basePlan(ctx, { targetId: null, method: 'manual', nextStep: 'none', displayTarget: '', sentenceKey: 'aiConnectPlanManual' }),
			canApply: false,
			steps: otherSteps(ctx),
			setups: setups(ctx),
			needsKey: true,
		};
	},
	// Both setups are recorded by aiConnectRecordManual
	apply: async () => manualOnly,
	remove: async () => ({ ok: true }),
	check: async () => ({ status: 'ok' }),
	update: async () => manualOnly,
	canRestart: () => false,
};
