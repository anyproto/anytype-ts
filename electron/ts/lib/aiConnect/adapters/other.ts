/**
 * Other app. Two setups:
 * - URL and key (manual): no file writes, no installation check, no healing, no cleanup. The plan is the
 *   ordered steps; the connection is recorded through aiConnectRecordManual.
 * - Command (`method: 'command'`, plan §7.2): a managed connection `other-<8 hex>`. The key goes into the
 *   forwarder's item for that id, and the user adds `anytype-mcp serve --connection <id>` (the stable copy;
 *   no key in it) to the app by hand. check = `key check`, update = `key retarget`, remove = `key delete`.
 *   The service routes these records by their own id, before any app detection.
 */
import type { Adapter, AiPlan, AiRecord, AiStep, ApplyOutcome, CheckOutcome, Ctx } from '../types';
import { ensureInstalled, itemLabel, serveCommand, stdioSupported, usable } from '../forwarder';
import { commitItem, deleteItem, itemState, retargetItem } from '../item';
import { basePlan, bearer, displayPath, err, manualPlan, mcpUrl, placeholder, snippet, stillLive } from './common';

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

/** The setup text of one Command connection: the stable copy and the connection's id, never a key */
export const commandSteps = (ctx: Ctx, id: string): AiStep[] => [
	{ textKey: 'aiConnectManualCommandAdd', snippet: snippet({ mcpServers: { anytype: serveCommand(ctx.env, id) } }), lang: 'json' },
	{ textKey: 'aiConnectManualCommandRestart' },
];

const setups = (ctx: Ctx): ('url' | 'command')[] => commandOffered(ctx) ? [ 'url', 'command' ] : [ 'url' ];

const manualOnly = { ok: false as const, error: err('validate', 'unknown') };

const isCommand = (rec: AiRecord | null): boolean => rec?.method == 'command';

/** The plan of the Command setup: before the connection exists only what will happen; for a record, its snippet */
const commandPlan = async (ctx: Ctx, rec: AiRecord | null): Promise<AiPlan> => {
	const base: AiPlan = {
		...basePlan(ctx, { targetId: rec?.id || null, method: 'command', nextStep: 'none', displayTarget: '', sentenceKey: 'aiConnectPlanCommand', route: 'stdio' }),
		setups: setups(ctx),
		// S13: a tier change answers `nextStep: 'restart'` — the running `serve` stays on the old tool set until then
		instructions: { restart: 'aiConnectManualCommandRestart' },
	};

	if (!stdioSupported(ctx.env)) {
		return { ...manualPlan(base, err('detect', 'unsupportedPackage'), []), note: 'aiConnectLinuxPackageLimit' };
	};

	const own = usable(ctx.env);

	if (!('path' in own)) {
		return manualPlan(base, own.error, []);
	};
	if (!rec) {
		return { ...base, steps: [ { textKey: 'aiConnectManualCommandPrepare' } ] };
	};

	const label = itemLabel(ctx.env, rec.id);
	return { ...base, existing: 'ours', displayTarget: displayPath(ctx.env, label), targetPath: label, steps: [ { textKey: 'aiConnectManualCommandPrepare' }, ...commandSteps(ctx, rec.id) ] };
};

/** `key set` for the connection `ctx.targetId` (allocated by the service), after the stable copy is in place */
const commandApply = async (ctx: Ctx, rec: AiRecord | null): Promise<ApplyOutcome> => {
	const installed = await ensureInstalled(ctx.env);

	if (!('path' in installed)) {
		return { ok: false, error: installed.error };
	};

	const res = await commitItem(ctx, ctx.targetId, rec, { method: 'command', route: 'stdio', nextStep: 'none' });
	const steps = commandSteps(ctx, ctx.targetId);

	if ('unconfirmed' in res) {
		return { ok: true, method: 'command', route: 'stdio', nextStep: 'none', targetPath: res.label, observedInstalled: false, createdDirs: [], unconfirmed: true, ...(res.running ? { running: true } : {}) };
	};
	if ('error' in res) {
		return { ok: false, error: res.error };
	};
	return { ok: true, method: 'command', route: 'stdio', nextStep: 'none', targetPath: res.label, observedInstalled: true, createdDirs: [], itemRev: res.rev, steps };
};

const commandCheck = async (ctx: Ctx, rec: AiRecord): Promise<CheckOutcome> => {
	const own = await itemState(ctx.env, rec.id, rec, rec.accountId);

	if ('error' in own) {
		return { status: 'unreadable' };
	};
	if (own.existing == 'foreign') {
		return { status: 'conflict' };
	};
	if (own.existing == 'none') {
		return { status: 'removed' };
	};

	let item = { rev: own.rev, port: own.port, tier: own.tier };
	let healed = false;
	// A retarget whose receipt was lost: the record follows the item, never the other way round
	const tier = rec.retarget ? own.tier : rec.tier;

	if (ctx.port && ((own.port != ctx.port) || (own.tier != tier))) {
		if (!stillLive(ctx)) {
			return { status: 'pending', item };
		};

		const res = await retargetItem(ctx, rec.id, rec, { port: ctx.port, tier });

		if ('unconfirmed' in res) {
			return { status: 'pending' };
		};
		if ('error' in res) {
			return ('gone' in res) ? { status: 'removed' } : { status: 'reconnect', item };
		};
		item = { rev: res.rev, port: ctx.port, tier };
		healed = true;
	};

	// The command in the app's settings starts the stable copy: kept installed by the running Anytype
	if (ctx.port && !('path' in (await ensureInstalled(ctx.env)))) {
		return { status: 'reconnect', item, ...(healed ? { healed: true } : {}) };
	};
	return { status: 'ok', observedInstalled: true, item, ...(healed ? { healed: true } : {}) };
};

export const other: Adapter = {
	ids: [ 'other' ],
	target: () => null,
	plan: async (ctx, det, rec) => {
		if (ctx.method == 'command') {
			return commandPlan(ctx, isCommand(rec) ? rec : null);
		};
		return {
			...basePlan(ctx, { targetId: null, method: 'manual', nextStep: 'none', displayTarget: '', sentenceKey: 'aiConnectPlanManual' }),
			canApply: false,
			steps: otherSteps(ctx),
			setups: setups(ctx),
		};
	},
	// URL and key is never automatic (recorded by aiConnectRecordManual); Command is `key set`
	apply: async (ctx, det, rec) => (ctx.method == 'command') ? commandApply(ctx, rec) : manualOnly,
	remove: async (ctx, rec) => {
		if (!isCommand(rec)) {
			return { ok: true };
		};

		const item = await deleteItem(ctx.env, rec.id, rec);
		return { ok: true, ...(item.done ? {} : { itemLeft: true }) };
	},
	check: async (ctx, rec) => isCommand(rec) ? commandCheck(ctx, rec) : { status: 'ok' },
	update: async (ctx, rec, change) => {
		if (!isCommand(rec)) {
			return manualOnly;
		};

		const res = await retargetItem(ctx, rec.id, rec, { port: change.port || rec.port, tier: change.tier || rec.tier });

		if ('unconfirmed' in res) {
			return { ok: false, unconfirmed: true, error: err('write', 'timeout') };
		};
		// A running `serve` pinned to the old tier stays not connected until the app restarts it
		return ('error' in res) ? { ok: false, error: res.error } : { ok: true, nextStep: (change.tier && (change.tier != rec.tier)) ? 'restart' : rec.nextStep };
	},
	installedFp: async (ctx, rec) => {
		const own = await itemState(ctx.env, rec.id, rec, rec.accountId);

		if ('error' in own) {
			return 'unreadable';
		};
		return (('fingerprint' in own) && (own.account == rec.accountId)) ? own.fingerprint : null;
	},
	canRestart: () => false,
};
