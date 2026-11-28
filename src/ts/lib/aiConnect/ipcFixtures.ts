/**
 * Test data only (imported by tests, never by the app): one fixture per variant of every aiConnect* IPC
 * result type, checked with `satisfies` (no casts). It is compiled by a renderer test (tsconfig.json)
 * and a main-process test (tsconfig.electron.json). Two compile-time guards fail both typechecks:
 * a fixture that no longer fits its result type, and a result variant that has no fixture (COVERAGE).
 */
import type {
	AiApplyResult, AiBundleInfoResult, AiCheckResult, AiClaimNudgeResult, AiConnection, AiError, AiListResult, AiOpenAppResult,
	AiMintIntentResult, AiOrphanResult, AiPlanResult, AiProbeResult, AiRecordManualResult, AiRemoveResult, AiRestartResult, AiRevealResult,
	AiRevokedResult, AiStepDoneResult, AiUpdateResult, AiRetireResult, AiCopySecretResult,
} from '../../interface/aiConnect';

export const FIXTURE_CONNECTION: AiConnection = {
	id: 'cursor', appId: 'cursor', accountId: 'acc-1', appHash: 'hash-1', keyFp: '0123456789abcdef', name: 'Cursor',
	route: 'http', tier: 'large', recommendedTier: 'large', method: 'config', targetPath: '/Users/me/.cursor/mcp.json',
	port: 31009, createdAt: 1, grant: { spaceIds: [], allSpaces: true, perm: 1 }, expireAt: 0, nextStep: 'restart',
	observedInstalled: true, lastProbe: 'ok', revokePending: [], removed: false, createdDirs: [],
	status: 'ok', displayTarget: '~/.cursor/mcp.json',
};

export const FIXTURE_MANUAL_CONNECTION: AiConnection = {
	...FIXTURE_CONNECTION, id: 'other-0a1b2c3d', appId: 'other', keyFp: '', name: 'Other app', method: 'manual', targetPath: '',
	grant: { spaceIds: [ 'space-1' ], allSpaces: false, perm: 0 }, nextStep: 'none', observedInstalled: false, lastProbe: 'none', displayTarget: '',
};

const ERROR: AiError = { stage: 'validate', category: 'stale' };

export const LIST_RESULTS = {
	ok: { ok: true, scanOk: false, detections: [ { appId: 'cursor', installed: true, targetId: 'cursor', targetPaths: [ '/Users/me/.cursor/mcp.json' ], canRestart: false } ], connections: [ FIXTURE_CONNECTION, FIXTURE_MANUAL_CONNECTION ], orphanHashes: [ 'h-0' ] },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiListResult>;

export const PLAN_RESULTS = {
	// A foreign entry: the replace object the renderer echoes back to aiConnectApply unchanged
	foreign: {
		ok: true, appId: 'cursor', targetId: 'cursor', route: 'http', tier: 'large', method: 'config', nextStep: 'restart',
		displayTarget: '~/.cursor/mcp.json', canApply: true, existing: 'foreign',
		replace: { targetPath: '/Users/me/.cursor/mcp.json', foreignDigest: 'a'.repeat(64) }, targetPath: '/Users/me/.cursor/mcp.json',
		sentenceKey: 'aiConnectPlanConfigRestart', instructions: { restart: 'aiConnectStepRestart' }, steps: [],
	},
	manualOnly: {
		ok: true, appId: 'codex', targetId: null, route: 'http', tier: 'large', method: 'manual', nextStep: 'newSession',
		displayTarget: '', canApply: false, error: { stage: 'read', category: 'outsideHome' }, existing: 'none',
		sentenceKey: 'aiConnectPlanManual', instructions: {}, steps: [ { textKey: 'aiConnectStepOpenFile', args: [ '~/.codex/config.toml' ], snippet: 'url = "<KEY>"', lang: 'toml', path: '/Users/me/.codex/config.toml' } ],
		preflight: 'quitApp', note: 'aiConnectNoteRoute', bundleSigned: false,
	},
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiPlanResult>;

export const APPLY_RESULTS = {
	ok: { ok: true, connection: FIXTURE_CONNECTION, openFailed: true },
	// Delivered, but the registry couldn't be saved yet: still committed (the key is kept)
	okUnsaved: { ok: true, connection: FIXTURE_CONNECTION, recordSaved: false },
	needs: { ok: false, needs: 'quitApp' },
	// Claude's extension: the record saved (the commit), the key not copied, the bundle not opened
	bundle: { ok: true, connection: { ...FIXTURE_CONNECTION, method: 'package', status: 'pending', bundleState: 'finish' }, copyFailed: true, openFailed: true, configure: false },
	unconfirmed: {
		ok: false, unconfirmed: true, error: { stage: 'cli', category: 'timeout' },
		connection: {
			...FIXTURE_CONNECTION, method: 'cli', prior: { route: 'skill', targetPath: '/Users/me/.claude/settings.json', keyFp: '0123456789abcdef' },
			unconfirmed: [ {
				appHash: 'hash-2', keyFp: 'fedcba9876543210', route: 'http', method: 'cli', targetPath: '/Users/me/.claude.json', tier: 'large', recommendedTier: 'large', port: 31009,
				nextStep: 'newSession', name: 'Claude Code', grant: { spaceIds: [ 'space-1' ], allSpaces: false, perm: 0 }, expireAt: 1900000000, created: false, running: true,
			} ],
		},
	},
	fail: { ok: false, error: { stage: 'cli', category: 'cliFailed', removedOld: true } },
	// A rollback that couldn't put the previous config entry back; Claude (quit by Anytype) couldn't be reopened
	failLeft: { ok: false, error: { stage: 'write', category: 'permission', left: 'entry', openFailed: true } },
	// The registry can't be saved while an earlier committed connection waits in memory
	unsaved: { ok: false, error: { stage: 'write', category: 'unsaved' } },
} satisfies Record<string, AiApplyResult>;

export const RECORD_MANUAL_RESULTS = {
	ok: { ok: true, connection: FIXTURE_MANUAL_CONNECTION },
	okUnsaved: { ok: true, connection: FIXTURE_MANUAL_CONNECTION, recordSaved: false, fileMode: 'tightened' },
	okLoose: { ok: true, connection: FIXTURE_MANUAL_CONNECTION, fileMode: 'loose' },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiRecordManualResult>;

export const UPDATE_RESULTS = {
	ok: { ok: true, connection: FIXTURE_CONNECTION },
	fail: { ok: false, error: { stage: 'write', category: 'changed' } },
} satisfies Record<string, AiUpdateResult>;

export const REMOVE_RESULTS = {
	ok: { ok: true, connection: { ...FIXTURE_CONNECTION, removed: true, revokePending: [ 'hash-1' ], left: 'entry' } },
	fail: { ok: false, error: { stage: 'validate', category: 'conflict' } },
} satisfies Record<string, AiRemoveResult>;

export const REVOKED_RESULTS = {
	kept: { ok: true, connection: FIXTURE_CONNECTION },
	deleted: { ok: true, connection: null },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiRevokedResult>;

export const CHECK_RESULTS = {
	ok: { ok: true, connections: [ FIXTURE_CONNECTION ], healed: [ 'cursor' ] },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiCheckResult>;

export const PROBE_RESULTS = {
	ok: { ok: true },
	fail: { ok: false, category: 'unauthorized' },
} satisfies Record<string, AiProbeResult>;

export const STEP_DONE_RESULTS = {
	ok: { ok: true, connection: { ...FIXTURE_CONNECTION, nextStep: 'none' } },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiStepDoneResult>;

export const RESTART_RESULTS = {
	ok: { ok: true },
	fail: { ok: false, error: { stage: 'restart', category: 'timeout' } },
} satisfies Record<string, AiRestartResult>;

export const REVEAL_RESULTS = {
	shown: { ok: true },
} satisfies Record<string, AiRevealResult>;

export const OPEN_APP_RESULTS = {
	opened: { ok: false },
} satisfies Record<string, AiOpenAppResult>;

export const CLAIM_NUDGE_RESULTS = {
	claimed: { claimed: true },
} satisfies Record<string, AiClaimNudgeResult>;

export const BUNDLE_INFO_RESULTS = {
	present: { signed: true },
	missing: null,
} satisfies Record<string, AiBundleInfoResult>;

export const ORPHAN_RESULTS = {
	ok: { ok: true },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiOrphanResult>;

export const MINT_INTENT_RESULTS = {
	ok: { ok: true, id: '0123456789abcdef' },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiMintIntentResult>;

export const RETIRE_RESULTS = {
	ok: { ok: true, connection: { ...FIXTURE_CONNECTION, appHash: '', keyFp: '', status: 'disconnected' } },
	fail: { ok: false, error: ERROR },
} satisfies Record<string, AiRetireResult>;

export const COPY_SECRET_RESULTS = {
	ok: { ok: true },
	fail: { ok: false },
} satisfies Record<string, AiCopySecretResult>;

type Values<T> = T[keyof T];

/** true when every member of the union U has a fixture in F that fits it */
type Covers<U, F> = (U extends unknown ? ([ Extract<F, U> ] extends [ never ] ? false : true) : never) extends true ? true : false;

// A `false` here (a variant without a fixture) fails the typecheck
const listCovered: Covers<AiListResult, Values<typeof LIST_RESULTS>> = true;
const planCovered: Covers<AiPlanResult, Values<typeof PLAN_RESULTS>> = true;
const applyCovered: Covers<AiApplyResult, Values<typeof APPLY_RESULTS>> = true;
const recordManualCovered: Covers<AiRecordManualResult, Values<typeof RECORD_MANUAL_RESULTS>> = true;
const updateCovered: Covers<AiUpdateResult, Values<typeof UPDATE_RESULTS>> = true;
const removeCovered: Covers<AiRemoveResult, Values<typeof REMOVE_RESULTS>> = true;
const revokedCovered: Covers<AiRevokedResult, Values<typeof REVOKED_RESULTS>> = true;
const checkCovered: Covers<AiCheckResult, Values<typeof CHECK_RESULTS>> = true;
const probeCovered: Covers<AiProbeResult, Values<typeof PROBE_RESULTS>> = true;
const stepDoneCovered: Covers<AiStepDoneResult, Values<typeof STEP_DONE_RESULTS>> = true;
const restartCovered: Covers<AiRestartResult, Values<typeof RESTART_RESULTS>> = true;
const revealCovered: Covers<AiRevealResult, Values<typeof REVEAL_RESULTS>> = true;
const openAppCovered: Covers<AiOpenAppResult, Values<typeof OPEN_APP_RESULTS>> = true;
const claimNudgeCovered: Covers<AiClaimNudgeResult, Values<typeof CLAIM_NUDGE_RESULTS>> = true;
const bundleInfoCovered: Covers<AiBundleInfoResult, Values<typeof BUNDLE_INFO_RESULTS>> = true;
const orphanCovered: Covers<AiOrphanResult, Values<typeof ORPHAN_RESULTS>> = true;
const mintIntentCovered: Covers<AiMintIntentResult, Values<typeof MINT_INTENT_RESULTS>> = true;
const retireCovered: Covers<AiRetireResult, Values<typeof RETIRE_RESULTS>> = true;
const copySecretCovered: Covers<AiCopySecretResult, Values<typeof COPY_SECRET_RESULTS>> = true;

/** Every result type, by IPC command, with all its fixtures */
export const IPC_RESULT_FIXTURES = {
	aiConnectList: LIST_RESULTS,
	aiConnectPlan: PLAN_RESULTS,
	aiConnectApply: APPLY_RESULTS,
	aiConnectRecordManual: RECORD_MANUAL_RESULTS,
	aiConnectUpdate: UPDATE_RESULTS,
	aiConnectRemove: REMOVE_RESULTS,
	aiConnectRevoked: REVOKED_RESULTS,
	aiConnectCheck: CHECK_RESULTS,
	aiConnectProbe: PROBE_RESULTS,
	aiConnectStepDone: STEP_DONE_RESULTS,
	aiConnectRestartApp: RESTART_RESULTS,
	aiConnectReveal: REVEAL_RESULTS,
	aiConnectOpenApp: OPEN_APP_RESULTS,
	aiConnectClaimNudge: CLAIM_NUDGE_RESULTS,
	aiConnectBundleInfo: BUNDLE_INFO_RESULTS,
	aiConnectOrphan: ORPHAN_RESULTS,
	aiConnectMintIntent: MINT_INTENT_RESULTS,
	aiConnectRetire: RETIRE_RESULTS,
	aiConnectCopySecret: COPY_SECRET_RESULTS,
};

/** The compile-time coverage guards, kept as values so they are used */
export const COVERAGE = [
	listCovered, planCovered, applyCovered, recordManualCovered, updateCovered, removeCovered, revokedCovered, checkCovered,
	probeCovered, stepDoneCovered, restartCovered, revealCovered, openAppCovered, claimNudgeCovered, bundleInfoCovered, orphanCovered, mintIntentCovered,
	retireCovered, copySecretCovered,
];
