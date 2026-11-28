import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AiConnectController, type AiConnectPopupData } from './controller';
import * as flow from './flow';
import { connectionState } from './gallery';
import { isValidLinkGrant } from '../linkApprovalGrant';
import { BASE_PLAN, GRANT, installHarness, READ_ONE, record, until, type Harness } from './testHarness';

let h: Harness;
let ui: { close: () => void; toast: (msg: any) => void };
const live: AiConnectController[] = [];

const FUTURE = Math.floor(Date.now() / 1000) + 30 * 86400;

const open = async (data: AiConnectPopupData, name = 'Cursor', pristine = false): Promise<AiConnectController> => {
	await flow.load();

	const ctrl = new AiConnectController(data, ui, name);

	live.push(ctrl);
	ctrl.init();
	await until(() => !ctrl.get().planLoading && !ctrl.get().manual.loading);
	// A new connection starts with no spaces chosen: tests choose All spaces explicitly, as a user would
	if (!pristine && !isValidLinkGrant(ctrl.get().form.grant)) {
		ctrl.setForm({ grant: { ...GRANT } });
	};
	return ctrl;
};

const settled = async (ctrl: AiConnectController) => {
	await until(() => !ctrl.get().busy);
	await new Promise(r => setTimeout(r, 0));
};

beforeEach(() => {
	h = installHarness();
	ui = { close: vi.fn(), toast: vi.fn() };
});

afterEach(async () => {
	for (const c of live.splice(0)) {
		await c.dispose();
	};
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	(window as any).Electron = {};
	flow.resetFlowForTests();
});

describe('reconnect continuations (V2, V3)', () => {
	test('a reconnect that meets a foreign entry returns to a form prefilled from the old key, not the defaults', async () => {
		const replace = { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) };

		h.heart.add('hash-old', READ_ONE, FUTURE);
		h.existing({ grant: READ_ONE, expireAt: FUTURE, tier: 'full', name: 'Cursor work' });
		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace };

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		ctrl.reconnect();
		await settled(ctrl);

		const s = ctrl.get();

		expect(s.view).toBe('connect');
		expect(s.form).toMatchObject({ grant: READ_ONE, fixedExpireAt: FUTURE, tier: 'full', name: 'Cursor work' });
		expect(h.heart.state.creates).toBe(0);

		// Replace and connect: the access shown, the replace shown, a re-read before the mint
		ctrl.submit();
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ grant: READ_ONE, expireAt: FUTURE, tier: 'full', replace, expectedHash: 'hash-old' });
		expect(h.heart.state.order.indexOf('ListApps')).toBeLessThan(h.heart.state.order.indexOf('CreateApp'));
	});

	test('a reconnect paused for the quit consent continues as the same reconnect', async () => {
		h.heart.add('hash-old', READ_ONE, FUTURE);
		h.existing({ grant: READ_ONE, expireAt: FUTURE });
		h.main.m.plans.cursor = { ...BASE_PLAN, preflight: 'quitApp' };

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		ctrl.reconnect();
		await settled(ctrl);
		expect(ctrl.get().phase).toBe('needsQuit');

		ctrl.consent('allowQuit');
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ allowQuit: true, grant: READ_ONE, expireAt: FUTURE, expectedHash: 'hash-old' });
	});

	test('Manage ▸ Replace shows the fresh preview first; a different entry before the consent needs a new Replace', async () => {
		const shown = { targetPath: BASE_PLAN.targetPath, foreignDigest: 'a'.repeat(64) };

		h.heart.add('hash-old');
		h.existing();
		h.main.m.statuses.set('cursor', 'conflict');
		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace: shown, preflight: 'quitApp' };

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		ctrl.replace();
		await until(() => !!ctrl.get().plan && (ctrl.get().view == 'connect'));
		expect(ctrl.get().plan.replace).toEqual(shown);
		expect(h.heart.state.creates).toBe(0);

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get().phase).toBe('needsQuit');

		h.main.m.plans.cursor = { ...BASE_PLAN, existing: 'foreign', replace: { ...shown, foreignDigest: 'c'.repeat(64) }, preflight: 'quitApp' };
		ctrl.consent('allowQuit');
		await settled(ctrl);
		expect(ctrl.get().view).toBe('connect');
		expect(h.calls('aiConnectApply')).toHaveLength(0);
	});
});

describe('moved location (V4)', () => {
	test('Reconnect on an old Codex row opens ChatGPT\'s record at the new place: no key, no delivery, no revoke', async () => {
		const path = '/Users/me/.codex/config.toml';

		h.main.m.detections = [
			{ appId: 'codex', installed: true, targetId: 'codex', targetPaths: [ path ], canRestart: false },
			{ appId: 'chatgpt', installed: true, targetId: 'codex', targetPaths: [ path ], canRestart: true },
		];
		h.heart.add('hash-old');
		h.heart.add('hash-gpt');
		h.existing({ id: 'codex-home-11111111', appId: 'codex', targetPath: '/Users/me/a/config.toml' });
		h.existing({ id: 'codex', appId: 'chatgpt', appHash: 'hash-gpt', targetPath: path });

		const ctrl = await open({ appId: 'codex', connectionId: 'codex-home-11111111', view: 'manage' }, 'Codex');

		ctrl.reconnect();
		await until(() => ctrl.get().connectionId == 'codex');

		expect(ctrl.get().view).toBe('manage');
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectApply')).toHaveLength(0);
		expect(h.heart.state.revokes).toEqual([]);
	});
});

describe('H2: a forbidden place for Hermes\' key', () => {
	test('H2: .env outside home: the manual plan has no key-bearing step, so Create key mints nothing', async () => {
		h.main.m.plans.hermes = { ...BASE_PLAN, appId: 'hermes', canApply: false, method: 'manual', error: { stage: 'read', category: 'outsideHome' }, steps: [] };

		const ctrl = await open({ appId: 'hermes', view: 'manual' }, 'Hermes');

		await ctrl.createKey();
		expect(h.heart.state.creates).toBe(0);
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);
	});
});

describe('disconnect (V5, V22, V27)', () => {
	test('H7: Hermes\' key line that stayed in .env is named after disconnect', async () => {
		h.heart.add('hash-old');
		h.existing({ left: 'envKey' });

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await ctrl.disconnect();
		expect(ctrl.get().result.lines.map((it: any) => it.key)).toEqual([ 'aiConnectLeftEnvKey', 'aiConnectKeyDeleted' ]);
	});

	test('a failed revoke never says the key is deleted; a leftover is described on its own', async () => {
		h.heart.add('hash-old');
		h.heart.state.revokeFails.add('hash-old');
		h.existing({ left: 'entry' });

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await ctrl.disconnect();
		expect(ctrl.get().result.lines.map((it: any) => it.key)).toEqual([ 'aiConnectLeftEntry', 'aiConnectRevokeFailed' ]);
	});

	test('revoked with an extension left: the leftover, then that the key is deleted', async () => {
		h.heart.add('hash-old');
		h.existing({ left: 'extension' });

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await ctrl.disconnect();
		expect(ctrl.get().result.lines.map((it: any) => it.key)).toEqual([ 'aiConnectLeftExtension', 'aiConnectKeyDeleted' ]);
	});

	test('a conflict found by Disconnect shows the conflict actions; a key main found ended shows Access ended without a key lookup (D1S-15)', async () => {
		h.heart.add('hash-old');
		h.existing();
		h.main.m.removeConflict = true;

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		expect(ctrl.get().override).toBeNull();
		await ctrl.disconnect();
		expect(ctrl.get().override).toBe('conflict');

		// Main's check found the key gone: the record says Access ended, and Manage reads no key list for it
		h.heart.rows.delete('hash-old');
		h.main.m.statuses.set('cursor', 'accessEnded');

		const lists = h.heart.state.lists;
		const again = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await until(() => !!again.get().access);
		expect(connectionState(again.connection())).toBe('accessEnded');
		expect(again.get().access).toMatchObject({ ok: true, present: false });
		expect(h.heart.state.lists).toBe(lists);

		// Replace reads heart's access when clicked: a failed lookup is shown as such, with Try again (the view's
		// lookupFailed), never as Access ended
		h.main.m.statuses.delete('cursor');
		h.heart.state.listFails = true;

		const failing = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		await until(() => !!failing.get().access);
		expect(failing.get().access.ok).toBe(true);
		await failing.replace();
		expect(failing.get().override).toBeNull();
		expect(failing.get()).toMatchObject({ view: 'manage', access: { ok: false } });
	});
});

describe('Claude Desktop manual fallback (V6)', () => {
	test('after a failed automatic delivery, manual setup is the settings file\'s entry with the pending key, recorded by "I\'ve updated" as a command setup', async () => {
		const entry = '{"mcpServers":{"anytype":{"command":"/Users/me/.anytype/bin/anytype-mcp","args":["serve","--tier","full"],"env":{"ANYTYPE_API_KEY":"<KEY>"}}}}';

		h.main.m.plans['claude-desktop'] = {
			...BASE_PLAN, appId: 'claude-desktop', targetId: 'claude-desktop', route: 'stdio', method: 'config', targetPath: '/Users/me/Library/Application Support/Claude/claude_desktop_config.json',
			steps: [ { textKey: 'aiConnectManualMerge', snippet: entry, lang: 'json' }, { textKey: 'aiConnectManualKeepPrivate' } ],
		};
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'permission' } });

		const ctrl = await open({ appId: 'claude-desktop' }, 'Claude Desktop');

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ phase: 'error', canManual: true });

		// The key the automatic attempt minted stays pending and is the one shown (masked) for the entry
		await ctrl.enterManual('create');
		expect(ctrl.get().manual).toMatchObject({ mode: 'confirm', keyHash: 'hash-1' });
		expect(h.calls('aiConnectPlan').slice(-1)[0].param.method).toBe('config');

		await ctrl.confirmManual();
		expect(h.calls('aiConnectApply')).toHaveLength(1);
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-1', setup: 'command', route: 'stdio' });
		expect(h.heart.state.creates).toBe(1);
	});
});

describe('manual setup (V7, V8, V24, V25)', () => {
	test('Create key for a file: the key waits; "I\'ve updated" records it with the previewed target; a loose file warns', async () => {
		h.main.m.recordManual = (p: any) => ({ ok: true, fileMode: 'loose', connection: h.main.view(record({ appHash: p.appHash, method: 'manual' })) });

		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		expect(ctrl.get().manual.mode).toBe('create');
		await ctrl.createKey();
		expect(ctrl.get().manual).toMatchObject({ mode: 'confirm', keyHash: 'hash-1' });
		// The view knows the key by its hash only (tokens-plan §3.2)
		expect(JSON.stringify(ctrl.get())).not.toContain('SENTINEL');
		expect(h.calls('aiConnectRecordManual')).toHaveLength(0);

		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param).toMatchObject({ appHash: 'hash-1', previewTarget: BASE_PLAN.targetPath });
		expect(ctrl.get().manual).toMatchObject({ mode: 'done', notice: { key: 'aiConnectManualFileLoose' } });
	});

	test('J5: "I\'ve updated" answered `changed`: the notice and fresh instructions, the key kept; the next confirm records it, nothing revoked', async () => {
		let changed = true;

		h.main.m.recordManual = (p: any) => {
			if (changed) {
				changed = false;
				return { ok: false, error: { stage: 'validate', category: 'changed' } };
			};
			return { ok: true, connection: h.main.view(record({ appHash: p.appHash, method: 'manual' })) };
		};

		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		await ctrl.createKey();

		const keyHash = ctrl.get().manual.keyHash;
		const plans = h.calls('aiConnectPlan').length;

		await ctrl.confirmManual();
		await until(() => !ctrl.get().manual.loading && (h.calls('aiConnectPlan').length > plans));
		expect(ctrl.get().manual).toMatchObject({ mode: 'confirm', keyHash, notice: { key: 'aiConnectManualChanged' } });

		// Recorded: the popup closes with its toast; the key it holds is the one created before
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')).toHaveLength(2);
		expect(h.calls('aiConnectRecordManual')[1].param.appHash).toBe('hash-1');
		expect(h.heart.state.revokes).toEqual([]);
	});

	test('no previewed file: the empty target, so main changes no file\'s mode', async () => {
		h.main.m.plans.cursor = { ...BASE_PLAN, targetPath: undefined };

		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		await ctrl.createKey();
		await ctrl.confirmManual();
		expect(h.calls('aiConnectRecordManual')[0].param.previewTarget).toBe('');
	});

	test('a prerequisite-only plan: Check again, never a key', async () => {
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', canApply: false, steps: [ { textKey: 'aiConnectManualUpdateCli', args: [ 'Claude Code', '2.1.327' ] } ] };

		const ctrl = await open({ appId: 'claude-code', view: 'manual' }, 'Claude Code');

		expect(ctrl.get().manual.mode).toBe('prerequisite');

		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code' };
		await ctrl.recheck();
		expect(ctrl.get().manual.mode).toBe('create');
		expect(h.heart.state.creates).toBe(0);
	});

	test('a stale reply to "I\'ve updated" released the key: it is no longer shown; the record now there opens (W7)', async () => {
		const ctrl = await open({ appId: 'cursor', view: 'manual' });

		await ctrl.createKey();
		h.existing({ appHash: 'hash-someone' });
		await ctrl.confirmManual();
		expect(ctrl.get().manual).toMatchObject({ keyHash: '', mode: 'create' });
		expect(ctrl.get()).toMatchObject({ view: 'manage', connectionId: 'cursor', manageNotice: { error: { category: 'stale' } } });
		expect(h.heart.state.revokes).toEqual([ 'hash-1' ]);
	});

	test('the steps end with the instruction that loads the settings; Reveal only for the card\'s own file', async () => {
		const ctrl = await open({ appId: 'cursor', view: 'manual' });
		const steps = ctrl.get().manual.steps;

		expect(steps[steps.length - 1]).toEqual({ textKey: 'aiConnectStepRestartSelf', args: [ 'Cursor' ] });
		expect(ctrl.canReveal(steps[0])).toBe(true);
		expect(ctrl.canReveal({ textKey: 'aiConnectManualSaveFile', path: '/Users/me/.claude/skills/anytype-api/SKILL.md' })).toBe(false);
		expect(ctrl.canReveal({ textKey: 'aiConnectManualInstallFile', path: '/x/Anytype.mcpb' })).toBe(true);
	});
});

describe('delivery snapshot (V15)', () => {
	test('a 7-day expiry resolved once: the second apply after the quit consent reuses the same key and expiry', async () => {
		let now = 1_900_000_000_000;

		vi.spyOn(Date, 'now').mockImplementation(() => now);
		h.main.m.apply = (p: any) => ((h.calls('aiConnectApply').length == 1) ? { ok: false, needs: 'quitApp' } : { ok: true, connection: h.main.view(record({ appHash: p.appHash, nextStep: 'restart' })) });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.setForm({ days: 7 });
		ctrl.submit();
		await until(() => ctrl.get().phase == 'needsQuit');

		now += 5000;
		ctrl.consent('allowQuit');
		await until(() => h.calls('aiConnectApply').length == 2);
		await settled(ctrl);

		const [ a, b ] = h.calls('aiConnectApply').map(it => it.param);

		expect(b.expireAt).toBe(a.expireAt);
		expect(b.appHash).toBe(a.appHash);
		expect(h.heart.state.creates).toBe(1);
	});

	test('Continue → the settings-file fallback delivers the record\'s key with the record\'s tier, access, name and expiry', async () => {
		h.heart.add('hash-lm', READ_ONE, FUTURE, 'LM work');
		h.existing({ id: 'lmstudio', appId: 'lmstudio', appHash: 'hash-lm', name: 'LM work', tier: 'full', grant: READ_ONE, expireAt: FUTURE, method: 'deeplink', nextStep: 'confirmInApp', observedInstalled: false });

		const ctrl = await open({ appId: 'lmstudio', connectionId: 'lmstudio', view: 'finish' }, 'LM Studio');

		expect(ctrl.fileRouteKind()).toBe('lmstudio');
		ctrl.useFileRoute();
		await settled(ctrl);
		expect(h.calls('aiConnectApply')[0].param).toMatchObject({ method: 'config', tier: 'full', grant: READ_ONE, expireAt: FUTURE, name: 'LM work', appHash: 'hash-lm', expectedHash: 'hash-lm' });
		expect(h.heart.state.creates).toBe(0);
	});

	test('LM Studio\'s link didn\'t open: the error offers the settings file, with the same pending key', async () => {
		h.main.m.plans.lmstudio = { ...BASE_PLAN, appId: 'lmstudio', method: 'deeplink', nextStep: 'confirmInApp' };
		h.main.m.apply = (p: any) => (p.method ? { ok: true, connection: h.main.view(record({ id: 'lmstudio', appId: 'lmstudio', appHash: p.appHash })) } : { ok: false, error: { stage: 'open', category: 'unknown' } });

		const ctrl = await open({ appId: 'lmstudio' }, 'LM Studio');

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ phase: 'error', fileRouteFromError: true });

		ctrl.useFileRoute();
		await settled(ctrl);
		expect(h.calls('aiConnectApply').map(it => [ it.param.method, it.param.appHash ])).toEqual([ [ undefined, 'hash-1' ], [ 'config', 'hash-1' ] ]);
		expect(h.heart.state.creates).toBe(1);
	});
});

describe('finishing (V16, V17, V18, V19, V23)', () => {
	test('an unconfirmed CLI write waits and checks until main settles it; then its step', async () => {
		h.main.m.plans['claude-code'] = { ...BASE_PLAN, appId: 'claude-code', method: 'cli', nextStep: 'newSession' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'claude-code', appId: 'claude-code', appHash: p.appHash, nextStep: 'newSession', unconfirmed: [ { appHash: p.appHash, running: false } ] });

			h.main.m.records.set('claude-code', rec);
			return { ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' }, connection: h.main.view(rec) };
		};

		let checks = 0;

		h.main.m.onCheck = () => {
			if (++checks == 2) {
				const rec = h.main.m.records.get('claude-code');

				delete rec.unconfirmed;
			};
		};

		const ctrl = await open({ appId: 'claude-code' }, 'Claude Code');

		ctrl.submit();
		await until(() => ctrl.get().phase == 'unconfirmed');
		await until(() => ctrl.get().phase == 'step');
		expect(ctrl.get().step).toBe('newSession');
		expect(checks).toBeGreaterThanOrEqual(2);
	});

	test('the install poll follows main: a disabled server is the toggle step, not Added', async () => {
		h.main.m.plans.lmstudio = { ...BASE_PLAN, appId: 'lmstudio', targetId: 'lmstudio', method: 'deeplink', nextStep: 'confirmInApp', targetPath: '/Users/me/.lmstudio/mcp.json' };
		h.main.m.apply = (p: any) => {
			const rec = record({ id: 'lmstudio', appId: 'lmstudio', appHash: p.appHash, method: 'deeplink', nextStep: 'confirmInApp', observedInstalled: false });

			h.main.m.records.set('lmstudio', rec);
			return { ok: true, connection: h.main.view(rec) };
		};
		h.main.m.onCheck = () => {
			const rec = h.main.m.records.get('lmstudio');

			if (rec) {
				h.main.m.records.set('lmstudio', { ...rec, observedInstalled: true, nextStep: 'toggle' });
			};
		};

		const ctrl = await open({ appId: 'lmstudio' }, 'LM Studio');

		ctrl.submit();
		await until(() => ctrl.get().step == 'toggle');
		expect(ctrl.get().phase).toBe('step');
	});

	test('a step whose save fails stays, with Try again that only saves (the restart is not repeated)', async () => {
		const restart = vi.fn(() => ({ ok: true }));
		const send = h.main.send.getMockImplementation();

		h.main.send.mockImplementation(async (cmd: string, p: any) => ((cmd == 'aiConnectRestartApp') ? restart() : send(cmd, p)));

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await until(() => ctrl.get().phase == 'step');
		h.main.m.stepDoneFails = true;
		await ctrl.restart();
		expect(ctrl.get()).toMatchObject({ phase: 'step', ackFailed: true });

		h.main.m.stepDoneFails = false;
		await ctrl.stepDone();
		expect(ctrl.get().phase).toBe('afterRestart');
		expect(restart).toHaveBeenCalledTimes(1);
	});

	test('a delivery whose registry save failed shows it, and Save again retries it', async () => {
		h.main.m.apply = (p: any) => ({ ok: true, recordSaved: false, connection: h.main.view(record({ appHash: p.appHash })) });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get().unsaved).toBe(true);

		h.main.m.checkUnsaved = true;
		await ctrl.retrySave();
		expect(ctrl.get().unsaved).toBe(true);
		h.main.m.checkUnsaved = false;
		await ctrl.retrySave();
		expect(ctrl.get().unsaved).toBe(false);
	});

	test('the shared Codex file is ChatGPT\'s to reload: its restart goes to ChatGPT', async () => {
		const path = '/Users/me/.codex/config.toml';

		h.main.m.detections = [
			{ appId: 'codex', installed: true, targetId: 'codex', targetPaths: [ path ], canRestart: false },
			{ appId: 'chatgpt', installed: true, targetId: 'codex', targetPaths: [ path ], canRestart: true },
		];
		h.existing({ id: 'codex', appId: 'codex', targetPath: path, nextStep: 'restart' });

		const ctrl = await open({ appId: 'codex', connectionId: 'codex', view: 'finish' }, 'Codex');

		expect(ctrl.restartTarget()).toBe('chatgpt');
		await ctrl.restart();
		expect(h.calls('aiConnectRestartApp')[0].param).toEqual({ appId: 'chatgpt' });
	});

	test('a relaunch failure stays visible on the restart step; a changed write shows what it left', async () => {
		h.main.m.apply = (p: any) => ({ ok: true, openFailed: true, connection: h.main.view(record({ appHash: p.appHash, nextStep: 'restart' })) });

		const ctrl = await open({ appId: 'cursor' });

		ctrl.submit();
		await settled(ctrl);
		expect(ctrl.get()).toMatchObject({ phase: 'step', step: 'restart', openFailed: true });

		await flow.releasePendingKey();
		h.main.m.records.clear();
		h.main.m.apply = () => ({ ok: false, error: { stage: 'write', category: 'changed', left: 'entry', openFailed: true } });

		const other = await open({ appId: 'cursor' });

		other.submit();
		await settled(other);
		expect(other.get().view).toBe('connect');
		expect(other.get().formErrors.map((it: any) => it.key || it.error?.category)).toEqual([ 'changed', 'aiConnectErrorLeftEntry', 'aiConnectErrorReopen' ]);
	});
});

describe('closing (V1)', () => {
	test('a popup closed during Reconnect\'s first lookup mints nothing', async () => {
		h.heart.add('hash-old');
		h.existing();

		const ctrl = await open({ appId: 'cursor', connectionId: 'cursor', view: 'manage' });

		h.heart.gate.holdList = true;
		ctrl.reconnect();
		await until(() => !!h.heart.gate.releaseList);

		const closing = ctrl.dispose();

		h.heart.gate.releaseList();
		await closing;
		expect(h.heart.state.creates).toBe(0);
		expect(GRANT).toBeTruthy();
	});
});
