/**
 * Connect to AI apps: main-process-only types. Shared types live in src/ts/interface/aiConnect.ts.
 * Nothing here imports Electron: every module except index.ts gets its world through `Env`.
 */
import type {
	AiAppId, AiTargetId, AiTier, AiRoute, AiMethod, AiNextStep, AiError, AiStatus, AiPlan, AiRecord, AiReplace, AiStep,
} from '../../../../src/ts/interface/aiConnect';

export type * from '../../../../src/ts/interface/aiConnect';
export type { LinkAppGrant } from '../../../../src/ts/interface/linkApproval';

export interface RunResult {
	/** Exit code; -1 when the process could not be started or was killed */
	code: number;
	/** With -1: the process never started (the spawn failed), so it did nothing at all */
	notStarted?: boolean;
	stdout: string;
	timedOut?: boolean;
	/**
	 * With `tree`: after a timeout the end of the process tree could not be confirmed. Whatever it was
	 * writing may still land: keep a pending key and reconcile later instead of releasing it.
	 */
	indeterminate?: boolean;
};

export interface RunOptions {
	timeout: number;
	stdin?: string;
	/** Applied over the inherited environment; null removes a variable (every spelling of it on Windows) */
	env?: Record<string, string | null>;
	/** The child's whole process tree counts (see exec.runFile); runCli sets it for every CLI call */
	tree?: boolean;
};

export type ReadError = 'missing' | 'notFile' | 'tooLarge' | 'io';

export interface LstatInfo {
	isSymlink: boolean;
	isDir: boolean;
	isFile: boolean;
	mode: number;
	/** POSIX owner; -1 when unknown (Windows) */
	uid: number;
	/** Last modification, ms */
	mtimeMs?: number;
};

export interface StatInfo {
	dev: number;
	ino: number;
	mode: number;
	isDir: boolean;
	isFile: boolean;
};

/**
 * A file Env.writeFile created, with its descriptor still open. A temp file whose directory was moved
 * after it was created can't be reached by its path any more; `wipe` still empties it through the
 * descriptor, so no secret is left behind.
 */
export interface TempFile {
	/** Identity of the created file (fstat of its descriptor) */
	dev: number;
	ino: number;
	/** Truncates the file to zero bytes through the descriptor */
	wipe (): void;
	/** Releases the descriptor; idempotent */
	close (): void;
};

export interface ProcessInfo {
	pid: number;
	ppid: number;
	exe: string;
	cmd: string;
};

/** Everything the service needs from the outside world. Tests inject a fake. */
export interface Env {
	platform: NodeJS.Platform;
	/** process.arch ('x64', 'arm64') */
	arch: string;
	home: string;
	/** POSIX uid of this process; null on Windows */
	uid: number | null;
	vars: Record<string, string>;
	execPath: string;
	appRoot: string;
	/** The text of electron/json/aiConnect.build.json, read from inside app.asar; null when the build has none */
	buildMeta (): string | null;
	exists (p: string): boolean;
	lstat (p: string): LstatInfo | null;
	/** Follows links; identity for the recheck before a rename */
	stat (p: string): StatInfo | null;
	realpath (p: string): string | null;
	/**
	 * A regular file of at most `maxBytes` (never a FIFO, device or directory; opened non-blocking).
	 * `missing` only for ENOENT; any other failure (ENOTDIR included) is `io`. `noFollow`: a link at the
	 * last component is refused (`notFile`) where the platform supports it.
	 */
	readFile (p: string, maxBytes: number, opt?: { noFollow?: boolean }): { data: Buffer } | { error: ReadError };
	/** readFile(p, 8 MiB) as UTF-8; null on any error */
	readText (p: string): string | null;
	/** [] when the directory is missing; null when it exists but can't be listed */
	readDir (p: string): string[] | null;
	/**
	 * Creates a new file exclusively (fails if anything, a link included, exists there), writes all of it
	 * and fsyncs. The descriptor stays open until `close`. A failure part-way empties and removes the file
	 * and throws.
	 */
	writeFile (p: string, data: string | Buffer, mode: number): TempFile;
	rename (from: string, to: string): void;
	chmod (p: string, mode: number): void;
	/** POSIX: the kernel would run this file for the user (`access(X_OK)`: false on a `noexec` mount) */
	canExecute (p: string): boolean;
	mkdir (p: string, mode: number): void;
	/** Removes an empty directory; throws when it isn't empty */
	rmdir (p: string): void;
	unlink (p: string): void;
	/** execFile with an argument array; cwd is always env.home */
	run (file: string, args: string[], opts: RunOptions): Promise<RunResult>;
	/** Detached; resolves on 'spawn', false on 'error'; cwd = env.home */
	launch (file: string, args: string[]): Promise<boolean>;
	/** null = unknown */
	listProcesses (): Promise<ProcessInfo[] | null>;
	kill (pid: number, signal: 'SIGTERM'): boolean;
	/** Allow-list: lmstudio: only */
	openExternal (url: string): Promise<boolean>;
	protocolHandler (scheme: string): Promise<{ name: string; path: string } | null>;
	showItemInFolder (p: string): void;
	now (): number;
	sleep (ms: number): Promise<void>;
	/**
	 * Anytype's own directories (userData: registry, logs, data). Set by the service; another app's target
	 * that resolves into one of them (or into the key folder) is never written.
	 */
	protectedDirs?: string[];
};

export type CliName = 'claude' | 'codex' | 'code' | 'copilot' | 'agent' | 'cursor' | 'lms' | 'chatgpt' | 'gemini' | 'agy' | 'opencode' | 'hermes';

/** The config-home overrides discovery reads */
export type HomeVar = 'CODEX_HOME' | 'COPILOT_HOME' | 'CLAUDE_CONFIG_DIR';

/** Output of the config-home resolver (detect.resolveHomes) */
export interface Homes {
	/** The login shell answered (macOS / Linux); on Windows the PATH was read in-process, so true */
	shellOk: boolean;
	/** Runnable CLI by absolute path, or null */
	cli: Record<CliName, string | null>;
	/** Windows: the command resolves to something other than an .exe (a .cmd / .bat shim); detected, never executed */
	cliShim: Record<CliName, boolean>;
	/** PATH for CLI children exactly as discovery resolved it: the login shell's label (even when empty), else the inherited one */
	path: string;
	/**
	 * Each override as discovery resolved it: '' when unset or cleared by the login shell, else a local
	 * absolute path inside home. CLI children get exactly these (a '' one is removed from their environment).
	 */
	overrides: Record<HomeVar, string>;
	/**
	 * Overrides that are set but unusable (not a local absolute path, or outside home). The apps that read
	 * one get no automatic target (never the default location instead), and their CLI is never run.
	 */
	rejected: HomeVar[];
	/** '' when CODEX_HOME is rejected */
	codexHome: string;
	/** '' when COPILOT_HOME is rejected */
	copilotHome: string;
	/** '' when CLAUDE_CONFIG_DIR is rejected */
	claudeHome: string;
	/** CLAUDE_CONFIG_DIR when it is set and usable, else '' */
	claudeConfigDir: string;
};

/** What detection knows about one card on this machine (main only; the renderer gets AiDetection) */
export interface Detected {
	appId: AiAppId;
	installed: boolean;
	/** macOS: the .app bundle; Windows / Linux: the package or install dir when known */
	appPath?: string;
	/** Windows / Linux executable when known */
	exePath?: string;
	targetId?: AiTargetId;
	targetPaths: string[];
	canRestart: boolean;
};

export interface Ctx {
	env: Env;
	/** A check's heal: the API still listens on `port` (read again right before each heal write, B2); absent elsewhere */
	stillLive?: () => boolean;
	/** The config-home resolver's answer for this call */
	homes: Homes;
	/** Every card's detection (a sibling card can decide a step, e.g. ChatGPT for the Codex file) */
	detections: Detected[];
	appId: AiAppId;
	/** The account the call is for ('' in tests that don't care): an item of another account is never ours */
	accountId?: string;
	targetId: AiTargetId;
	/**
	 * Bookkeeping before an item changes (§2.9): `set` saves the new key as a candidate, `retarget` the
	 * intended port, tier and revision. False: the registry couldn't be saved, so the verb must not run.
	 */
	journal?: {
		set (intent: {
			method: AiMethod; route: AiRoute; targetPath: string; nextStep: AiNextStep;
			configEntry?: { command: string; args: string[]; env?: Record<string, string> }; entryDigest?: string; configPath?: string;
		}): boolean;
		retarget (intent: { port: number; tier: AiTier; rev: number }): boolean;
	};
	port: number;
	tier: AiTier;
	route: AiRoute;
	/** Apply only; '' elsewhere. `port` is 0 in a reconcile-only check (the API isn't listening): no heals */
	key: string;
	/** Ask for Claude's config route explicitly (`config`), or for Other app's Command setup (`command`) */
	method?: 'config' | 'command';
	/** Manual setup: prepare Anytype's side, open nothing */
	manual?: boolean;
	/** Anytype may quit the app (plan.preflight 'quitApp') */
	allowQuit?: boolean;
	/** The user said they quit the app themselves (plan.preflight 'quitAppSelf'): an unknown running state may proceed */
	quitConfirmed?: boolean;
	/** Pids that already got their one quit signal (kept by the service) */
	signalled?: Set<number>;
	/** The foreign entry the user agreed to replace (AiPlan.replace); rechecked at apply and on every writer retry */
	replace?: AiReplace;
	/** Apply: the plan's target as previewed (AiPlan.targetPath); an adapter whose route can change compares its real destination */
	previewTarget?: string;
};

export type ApplyOutcome =
	| {
		ok: true; method: AiMethod; nextStep: AiNextStep; targetPath: string; observedInstalled: boolean; createdDirs: string[];
		configEntry?: { command: string; args: string[]; env?: Record<string, string> }; entryDigest?: string; openFailed?: boolean;
		/** Claude Desktop: the canonical config file the keyless entry went into (cleanup stays bound to it) */
		configPath?: string;
		/** A CLI timed out and its end couldn't be confirmed: the key may or may not be installed */
		unconfirmed?: boolean;
		/** With `unconfirmed`: the CLI's process tree may still be running (it may still write) */
		running?: boolean;
		/** The route really used when the adapter switched it (Claude Code with its sandbox on → http) */
		route?: AiRoute;
		/** The item's revision after `key set` */
		itemRev?: number;
		/** Manual steps the user still has to do (Other app's Command: the snippet with the connection's id) */
		steps?: AiStep[];
	}
	| { ok: false; needs: 'quitApp' | 'quitAppSelf' | 'installExtension'; openFailed?: boolean }
	| { ok: false; error: AiError };

export interface Adapter {
	ids: AiAppId[];
	target (env: Env, det: Detected, appId: AiAppId): { targetId: AiTargetId; path: string } | null;
	plan (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<AiPlan>;
	apply (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<ApplyOutcome>;
	/** `itemLeft`: the connector's item may still be there (`key delete` gave no receipt, or the store couldn't be used) */
	remove (ctx: Ctx, rec: AiRecord): Promise<{ ok: boolean; left?: 'extension' | 'entry' | 'envKey'; error?: AiError; itemLeft?: boolean }>;
	/** `configEntry` / `entryDigest`: a healed keyless entry Anytype rewrote (persisted by the service) */
	check (ctx: Ctx, rec: AiRecord): Promise<{
		status: AiStatus; healed?: boolean; nextStep?: AiNextStep; observedInstalled?: boolean;
		configEntry?: { command: string; args: string[]; env?: Record<string, string> }; entryDigest?: string;
		/** The connector's item as read by this check (its own key): the record takes its port, tier and revision */
		item?: { rev: number; port: number; tier: AiTier };
	}>;
	/** `unconfirmed`: a `key retarget` gave no receipt; the item may hold either state and the next check reads it */
	update (ctx: Ctx, rec: AiRecord, change: { tier?: AiTier; port?: number }): Promise<{ ok: boolean; nextStep?: AiNextStep; error?: AiError; unconfirmed?: boolean }>;
	canRestart (env: Env, det: Detected): boolean;
	/** The key fingerprint the installed entry carries now (null: none; 'unreadable'); for `unconfirmed` deliveries */
	installedFp? (ctx: Ctx, rec: AiRecord): Promise<string | null | 'unreadable'>;
	/**
	 * Routes (or profiles) install separate artefacts: after a delivery that moved the record to another route
	 * or target, the service removes the previous one's with `remove(previous record)` and keeps `prior`
	 * when it can't (Claude Code: skill ↔ MCP tools, CLAUDE_CONFIG_DIR changes)
	 */
	/** The card has several candidate files (OpenCode's .json / .jsonc): the previewed one must be the one the adapter writes now (H10) */
	strictPreview?: boolean;
	separateRoutes?: boolean;
};

export type CheckOutcome = Awaited<ReturnType<Adapter['check']>>;
