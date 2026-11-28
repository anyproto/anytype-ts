/**
 * Connect to AI apps: types shared by Electron main and the renderer.
 * Imported by main through a relative path, so this file uses no path aliases.
 */
import type { LinkAppGrant } from './linkApproval';

/** Card the user sees */
export type AiAppId = 'claude-desktop' | 'claude-code' | 'chatgpt' | 'codex' | 'cursor' | 'vscode' | 'lmstudio' | 'other'
	| 'gemini-cli' | 'antigravity' | 'opencode' | 'hermes' | 'chatgpt-classic' | 'chatgpt-web' | 'claude-web' | 'gemini';

/**
 * Physical target = one registry record. `codex` is the shared ~/.codex/config.toml; a custom $CODEX_HOME
 * gets `codex-home-<first 8 hex of sha256(canonical config path)>`, so every custom location keeps its own row
 */
export type AiTargetId = 'claude-desktop' | 'claude-code' | 'codex' | `codex-home-${string}` | 'cursor' | 'copilot' | 'lmstudio' | 'gemini-cli' | 'antigravity' | 'opencode' | 'hermes' | `other-${string}`;
export type AiRoute = 'http' | 'stdio' | 'skill';
export type AiTier = 'small' | 'large' | 'full';
export type AiNextStep = 'none' | 'confirmInApp' | 'restart' | 'newSession' | 'reloadServer' | 'toggle';
/** `package`: Claude Desktop's extension (the user pastes the key into it); `config`: an entry in the app's settings file */
export type AiMethod = 'cli' | 'package' | 'config' | 'deeplink' | 'manual';
/** `disconnected`: a bundle connection whose key was retired for a Reconnect that hasn't delivered a new one yet */
export type AiStatus = 'ok' | 'pending' | 'removed' | 'accessEnded' | 'unreadable' | 'notInstalled' | 'reconnect' | 'conflict' | 'revokeFailed' | 'disconnected';
/**
 * Claude Desktop's extension route, until "Connected": `finish` no verified extension (Open again), `off` installed
 * but switched off, `notConfirmed` installed and on but the key wasn't used yet (Copy key, Configure), `updated` the
 * extension changed after the key was confirmed (not reconfirmed yet)
 */
export type AiBundleState = 'finish' | 'off' | 'notConfirmed' | 'updated';
/** Manual records: `url` (address and key) or `command` (the forwarder started by the app, the key in its `env`) */
export type AiSetup = 'url' | 'command';
export type AiApiState = 'disabled' | 'unknown' | 'failed' | 'listening';
export type AiErrorStage = 'validate' | 'detect' | 'read' | 'parse' | 'write' | 'verify' | 'cli' | 'open' | 'restart' | 'probe' | 'key';
export type AiErrorCategory = 'unparseable' | 'unsupportedForm' | 'permission' | 'notFound' | 'cliFailed' | 'cliTooOld' | 'timeout'
	| 'changed' | 'conflict' | 'stale' | 'outsideHome' | 'unsupportedPackage' | 'keyNotFound' | 'unreachable' | 'unauthorized' | 'apiOff' | 'unknown'
	/** Anytype's own registry can't be saved right now: a committed connection waits in memory; nothing else is changed until it is saved */
	| 'unsaved'
	/** Anytype's folder in the home folder (~/.anytype/ai-connect, or the connector's own) failed one of the connector's rules: `path` names it */
	| 'storeDenied'
	/** The connector couldn't be installed into ~/.anytype/bin */
	| 'installFailed'
	/** This copy of Anytype has no usable Claude extension bundle (none in this build, or damaged); `devBuild` adds how to build one */
	| 'bundleMissing';

export interface AiError {
	stage: AiErrorStage;
	category: AiErrorCategory;
	path?: string;
	/** `storeDenied`: the connector's own words for the rule `path` failed */
	rule?: string;
	removedOld?: boolean;
	/** What a failed delivery left behind that isn't ours to remove any more (e.g. an entry edited meanwhile) */
	left?: 'extension' | 'entry';
	/** Anytype quit the app for this delivery and couldn't open it again: the user has to start it */
	openFailed?: boolean;
	/** `bundleMissing` on a development build (`signed: false`): the text says how to put the missing part in place */
	devBuild?: boolean;
};

export interface AiAppCatalogItem {
	id: AiAppId;
	/** Brand name, not translated; '' when nameKey is set */
	name: string;
	nameKey?: string;
	aliases: string[];
	kind: 'app' | 'manual' | 'unsupported';
	routes: AiRoute[];
	defaultRoute?: AiRoute;
	defaultTier: AiTier;
	/** Text key */
	covers?: string;
	offer?: AiAppId[];
	getUrl?: string;
	/** The card is listed only when its app is found on this computer */
	onlyInstalled?: boolean;
	/** Also set up on another machine (copy-only guide): offered next to Get app when it isn't here */
	remoteSetup?: boolean;
};

export interface AiDetection {
	appId: AiAppId;
	installed: boolean;
	/** PNG data URL */
	icon?: string;
	/** Which record id this card maps to on this machine */
	targetId?: AiTargetId;
	/** Canonical absolute paths this card reads; a record belongs to the card only when its targetPath is one of them (or is '') */
	targetPaths: string[];
	/** This platform + this install can be restarted by Anytype */
	canRestart: boolean;
	/** Anytype can open the app: a macOS bundle or a Windows executable was found (H18) */
	canOpen?: boolean;
};

/** Persisted in the registry. No secrets. */
export interface AiRecord {
	id: AiTargetId;
	/** Card that created it */
	appId: AiAppId;
	accountId: string;
	appHash: string;
	/** First 16 hex of sha256(key); '' only for manual records */
	keyFp: string;
	name: string;
	route: AiRoute;
	tier: AiTier;
	/** Effective recommended tier at connect time (the card's default) */
	recommendedTier: AiTier;
	method: AiMethod;
	/** Resolved absolute path, or '' (CLI / manual) */
	targetPath: string;
	port: number;
	createdAt: number;
	/** Last known, for reconnect when the key is gone */
	grant: LinkAppGrant;
	/** Absolute seconds, 0 = never */
	expireAt: number;
	/** Outstanding step */
	nextStep: AiNextStep;
	/** The entry / extension was seen at least once */
	observedInstalled: boolean;
	lastProbe: 'none' | 'ok' | AiErrorCategory;
	/** A set: hashes whose revoke heart has not confirmed */
	revokePending: string[];
	/** Cleanup done, waiting for the revoke */
	removed: boolean;
	/** What cleanup could not remove (`envKey`: Hermes' MCP_ANYTYPE_API_KEY line in its .env) */
	left?: 'extension' | 'entry' | 'envKey';
	/** Directories Anytype created; not counted as install evidence */
	createdDirs: string[];
	/** canonicalDigest of the complete entry Anytype wrote (its key included): the entry is ours exactly when it still has this digest */
	entryDigest?: string;
	/** The canonical config file that entry is in (kept across a switch to another method; cleanup never re-resolves it) */
	configPath?: string;
	/**
	 * Keys a CLI may or may not have installed (it timed out and its end couldn't be confirmed), each with
	 * where it was delivered. A second unconfirmed delivery adds to the list (none is ever dropped). The
	 * next check reads each candidate's own target: the one installed becomes the record's key (its old
	 * hash retired); every other one goes to revokePending. Never released by the renderer.
	 */
	unconfirmed?: AiCandidate[];
	/**
	 * Artefacts of the route (or profile) this record used before a switch, which cleanup could not remove
	 * at the time; disconnect removes them too (ownership by their own key fingerprint)
	 */
	prior?: { route: AiRoute; targetPath: string; keyFp: string };
	/** The app's entry was found gone and reported (AiConnectRemoved); cleared when our entry is seen again */
	removedReported?: boolean;
	/**
	 * Claude Desktop's records (extension and config route): the build flavour (forwarder namespace) that set them
	 * up. A build of the other flavour leaves the record untouched (status `conflict`; Forget only)
	 */
	ns?: 'release' | 'dev';
	/** Manual records: which setup the user did (absent: `url`) */
	setup?: AiSetup;
	/**
	 * Extension route: heart said `isActive` for `appHash` while Claude's install identity (the extension's `version`
	 * and `installedAt`) was this one. Dropped when either changes
	 */
	confirmed?: { appHash: string; version: string; installedAt: string };
	/** Extension route: heart said "not active" for `appHash` (or the key was new) since this install identity appeared ('' = none yet) */
	armed?: { appHash: string; version: string; installedAt: string };
	/** Extension route: a confirmation was dropped by an extension update (the row says "not reconfirmed") */
	reconfirm?: boolean;
	/**
	 * Claude's extension, main only (never in a view): saved with the record's first save and cleared once Claude's
	 * settings file passed its last check. While it is there the new key wasn't handed out and nothing of the earlier
	 * record was queued: `before` is the record as it was (null: none) and `intent` the mint intent that save took.
	 * Any later call puts `before` back (R1)
	 */
	staged?: { before: AiRecord | null; intent?: AiMintIntent & { accountId: string } };
};

/** A key that is about to be created (saved before CreateApp); `time` in seconds */
export interface AiMintIntent {
	id: string;
	name: string;
	time: number;
	/** The access and expiry the key was to be made with (an intent saved before D1R2 has none) */
	grant?: LinkAppGrant;
	expireAt?: number;
	/** Main only: put back after a refused delivery with the exact key's hash, which a later run revokes (F7) */
	appHash?: string;
};

/** One unconfirmed delivery: the key, where it went, and the record fields it would bring */
export interface AiCandidate {
	appHash: string;
	keyFp: string;
	route: AiRoute;
	method: AiMethod;
	/** The canonical file the CLI wrote (its own profile, whatever resolves later) */
	targetPath: string;
	tier: AiTier;
	recommendedTier: AiTier;
	port: number;
	nextStep: AiNextStep;
	name: string;
	grant: LinkAppGrant;
	expireAt: number;
	/** The record was created for this delivery (no confirmed connection existed before it) */
	created: boolean;
	/** Its CLI's end couldn't be confirmed: it may still write, so an absent entry proves nothing */
	running: boolean;
	/** With `running`: the writer has certainly ended by this time (ms); absent: no deadline is known */
	until?: number;
	/** A config-route delivery: the digest of the entry it wrote (key included), taken over by the record when the candidate is promoted */
	entryDigest?: string;
	configPath?: string;
};

/** What the renderer gets */
export interface AiConnection extends AiRecord {
	status: AiStatus;
	/** targetPath with the home prefix replaced by '~' */
	displayTarget: string;
	/** Reserved for the heart event; undefined in the POC */
	firstUsedAt?: number;
	/** Extension route, not "Connected" yet (status `pending`): which step is missing */
	bundleState?: AiBundleState;
	/** Claude Desktop, status `conflict`: both of Claude's routes are there (the settings-file entry and the extension); the user removes one */
	bothRoutes?: boolean;
	/**
	 * The latest text main put on the clipboard is this record's own key (not a snippet, not an earlier key) and main
	 * hasn't cleared it yet (deadline, "Connected", Cancel setup, account switch, quit). Main never reads the clipboard
	 * for this: text the user copied over it later doesn't count, so the sheet says the key *was* copied
	 */
	keyCopied?: boolean;
	/** With `keyCopied`: when main takes it off the clipboard (ms since the epoch) */
	keyCopiedUntil?: number;
};

export interface AiStep {
	textKey: string;
	args?: string[];
	snippet?: string;
	lang?: 'json' | 'toml' | 'yaml' | 'sh' | 'text';
	path?: string;
};

/**
 * A foreign entry the user agreed to replace: the canonical path of the file (or key file) it occupies
 * and the canonicalDigest of the entry as shown. Sent back unchanged in aiConnectApply's `replace`.
 */
export interface AiReplace {
	targetPath: string;
	foreignDigest: string;
};

/** Never contains a key; KEY_PLACEHOLDER marks where it goes */
export interface AiPlan {
	appId: AiAppId;
	targetId: AiTargetId | null;
	route: AiRoute;
	tier: AiTier;
	method: AiMethod;
	nextStep: AiNextStep;
	displayTarget: string;
	canApply: boolean;
	/** The app must be closed first; consent is asked BEFORE a key is minted */
	preflight?: 'quitApp' | 'quitAppSelf';
	/** Why canApply is false */
	error?: AiError;
	/** 'foreign': an anytype entry this account's record doesn't own */
	existing: 'none' | 'ours' | 'foreign';
	/** What will happen */
	sentenceKey: string;
	/** Text keys */
	instructions: Partial<Record<AiNextStep | 'stalled' | 'afterRestart' | 'added', string>>;
	/** Ordered manual steps */
	steps: AiStep[];
	/** Text key, e.g. why the route was switched */
	note?: string;
	/** Claude Desktop only, from the build's metadata */
	bundleSigned?: boolean;
	/**
	 * What Replace would replace; the renderer passes it back as is. Set when `existing` is 'foreign', and on Claude's
	 * extension route whenever it would remove the Anytype entry from Claude's settings file (`existing` 'ours' too)
	 */
	replace?: AiReplace;
	/**
	 * The canonical file this delivery writes, as previewed. The renderer passes it back unchanged as
	 * aiConnectApply's `previewTarget`; apply refuses (`changed`) when the location moved meanwhile.
	 */
	targetPath?: string;
	/** Other app: the setups this computer offers (`command` only where other apps can start Anytype's connector) */
	setups?: AiSetup[];
	/** A manual plan whose steps need the key (they hold KEY_PLACEHOLDER): the renderer mints one, the screen masks it */
	needsKey?: boolean;
	/** Claude's extension is installed and ours: the key goes in through Claude's Configure, the bundle isn't opened */
	configure?: boolean;
};

// One result type per IPC command, imported by main and renderer
export type AiFail = { ok: false; error: AiError };
/** `orphanHashes`: keys this account minted whose release failed; the renderer retries revoking them */
/** `mintIntents`: keys an earlier run of Anytype was about to create and never accounted for (the renderer finds and revokes them) */
export type AiListResult = { ok: true; scanOk: boolean; detections: AiDetection[]; connections: AiConnection[]; orphanHashes: string[]; mintIntents?: AiMintIntent[] } | AiFail;
/** `ok: false` only when the request itself is invalid; a plan that can't be applied is `ok: true` with `canApply: false` */
export type AiPlanResult = ({ ok: true } & AiPlan) | AiFail;
export type AiApplyResult =
	/**
	 * Delivered. `recordSaved: false`: the delivery committed but the registry could not be saved; main keeps
	 * the record in memory and retries the save on every later call. The renderer treats it as committed
	 * (the new key is kept, never released).
	 */
	| {
		ok: true; connection: AiConnection; openFailed?: boolean; recordSaved?: false; steps?: AiStep[];
		/** Extension route: the key could not be put on the clipboard (the Finish view offers Copy key) */
		copyFailed?: boolean;
		/** Extension route: the bundle wasn't opened, the key goes in through Claude's Configure */
		configure?: boolean;
	}
	/** quitApp / quitAppSelf: the app started between plan and apply (or is still running after the user said they quit it) */
	| { ok: false; needs: 'quitApp' | 'quitAppSelf' }
	/**
	 * The delivery may have happened (a CLI timed out and its end couldn't be confirmed). Main recorded
	 * the new key as `unconfirmed` on the connection: the renderer neither releases the new key nor
	 * revokes the old one; the next check decides.
	 */
	| { ok: false; unconfirmed: true; error: AiError; connection: AiConnection }
	| AiFail;
/**
 * `recordSaved: false`: as for apply, the delivery (by the user) stands; main retries the save.
 * `fileMode` (POSIX): the app's settings file now holding the key could be read by others — 'tightened' to
 * 0600 by Anytype, or 'loose' when it couldn't be (another owner, chmod failed): warn the user.
 */
export type AiRecordManualResult = { ok: true; connection: AiConnection; recordSaved?: false; fileMode?: 'tightened' | 'loose' } | AiFail;
export type AiUpdateResult = { ok: true; connection: AiConnection } | AiFail;
/** The record, now `removed` */
/** `removedNow`: this call removed the record (false: it was removed already, e.g. a second Disconnect while a revoke waits) */
export type AiRemoveResult = { ok: true; connection: AiConnection; removedNow?: boolean } | AiFail;
/** null: record deleted */
export type AiRevokedResult = { ok: true; connection: AiConnection | null } | AiFail;
/** `removed`: records this check found removed in their app for the first time (each absence is reported once) */
export type AiCheckResult = { ok: true; connections: AiConnection[]; healed: string[]; removed?: string[] } | AiFail;
export type AiProbeResult = { ok: true } | { ok: false; category: AiErrorCategory };
export type AiStepDoneResult = { ok: true; connection: AiConnection } | AiFail;
export type AiRestartResult = { ok: true } | AiFail;
export type AiRevealResult = { ok: boolean };
export type AiOpenAppResult = { ok: boolean };
export type AiClaimNudgeResult = { claimed: boolean };
/** null: this build has no bundle Claude could install (none, or damaged) */
export type AiBundleInfoResult = { signed: boolean } | null;
export type AiOrphanResult = { ok: true } | AiFail;
/** `time`: the one main saved (seconds) */
export type AiMintIntentResult = { ok: true; id: string; time?: number } | AiFail;
/** The bundle record, now `disconnected` with its old hash in `revokePending` */
export type AiRetireResult = { ok: true; connection: AiConnection } | AiFail;
export type AiCopySecretResult = { ok: boolean };
