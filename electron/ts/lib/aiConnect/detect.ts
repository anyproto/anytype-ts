/**
 * Which AI apps are on this computer, and where their settings live.
 *
 * `resolveHomes` is the one config-home resolver: detect, plan, apply, check and remove all use it.
 * macOS / Linux: one constant script in the user's login shell. Windows: PATH + PATHEXT resolved in
 * this process (no where.exe: it also searches its working directory), plus known dirs and App Paths.
 * A command that resolves to a .cmd / .bat shim counts as detected but is never executed.
 * UNC and device paths (from PATH, env overrides or pointer files) are never touched.
 */
import crypto from 'crypto';
import type { AiAppId, AiDetection, AiError, AiTargetId, CliName, Detected, Env, HomeVar, Homes } from './types';
import { canonicalPath, isInside, isLocalAbsolute, pathOf, realHome, resolveTarget } from './fsSafe';
import { CATALOG } from '../../../../src/ts/lib/aiConnect/catalog';

export const CLI_NAMES: CliName[] = [ 'claude', 'codex', 'code', 'copilot', 'agent', 'cursor', 'lms', 'chatgpt', 'gemini', 'agy', 'opencode', 'hermes' ];
const HOME_VARS: HomeVar[] = [ 'CODEX_HOME', 'COPILOT_HOME', 'CLAUDE_CONFIG_DIR' ];
const VAR_NAMES = [ 'PATH', ...HOME_VARS ];
const KNOWN_CLI_DIRS = [ '~/.local/bin', '~/.claude/local', '~/.opencode/bin', '/opt/homebrew/bin', '/usr/local/bin' ];
const KNOWN_CLI_DIRS_WIN = [ '~\\.local\\bin' ];
const HOMES_TTL = 60000;
const POINTER_MAX = 4096;
/** Login shells that run a POSIX `-lc` script; fish gets its own script; anything else (csh, tcsh, …) gets the system shell */
const POSIX_SHELLS = [ 'sh', 'bash', 'zsh', 'dash', 'ksh', 'mksh', 'yash' ];

/** The one script the login shell runs: labelled lines only, every command guarded */
export const SHELL_SCRIPT = [
	...CLI_NAMES.map(n => `printf '${n}=%s\\n' "$(command -v ${n} 2>/dev/null || true)" || true`),
	...VAR_NAMES.map(v => `printf '${v}=%s\\n' "\${${v}:-}" || true`),
].join('\n');

/**
 * The same labelled lines in fish syntax (fish is not POSIX: `(…)` substitution, PATH is a list).
 * An empty substitution leaves printf's %s empty, so every label is printed.
 */
export const FISH_SCRIPT = [
	...CLI_NAMES.map(n => `printf '${n}=%s\\n' (command -s ${n} 2>/dev/null)`),
	`printf 'PATH=%s\\n' (string join : -- $PATH)`,
	...HOME_VARS.map(v => `printf '${v}=%s\\n' "$${v}"`),
].join('\n');

/** macOS bundle ids: identity by plutil, relocation by Spotlight */
export const BUNDLE_IDS: Partial<Record<AiAppId, string>> = {
	'claude-desktop': 'com.anthropic.claudefordesktop',
	'chatgpt': 'com.openai.codex',
	'chatgpt-classic': 'com.openai.chat',
	'cursor': 'com.todesktop.230313mzl4w4u92',
	'vscode': 'com.microsoft.VSCode',
	'lmstudio': 'ai.elementlabs.lmstudio',
	'antigravity': 'com.google.antigravity',
	'gemini': 'com.google.GeminiMacOS',
	// The DMG's bundled variant; the full variant is HERMES_FULL_BUNDLE_ID (both from Hermes' source, not seen on an install)
	'hermes': 'com.nousresearch.hermes-bundled',
};

export const HERMES_FULL_BUNDLE_ID = 'com.nousresearch.hermes';

const homesCache = new WeakMap<Env, { at: number; homes: Homes }>();

/** Case-insensitive on Windows, as the OS treats variable names */
export const getVar = (env: Env, name: string): string => {
	if (env.platform != 'win32') {
		return env.vars[name] || '';
	};

	const key = Object.keys(env.vars).find(k => k.toUpperCase() == name.toUpperCase());
	return key ? (env.vars[key] || '') : '';
};

/** `%NAME%` expanded from the (case-insensitive) environment, as REG_EXPAND_SZ values need */
export const expandWindowsVars = (env: Env, value: string): string => String(value || '').replace(/%([^%]+)%/g, (m, name) => getVar(env, name) || m);

/** Last `name=value` line per known label; everything else (profile noise) is ignored */
export const parseShellOutput = (text: string): Record<string, string> => {
	const known = new Set<string>([ ...CLI_NAMES, ...VAR_NAMES ]);
	const ret: Record<string, string> = {};

	for (const line of String(text || '').split(/\r?\n/)) {
		const m = /^([A-Za-z_]+)=(.*)$/.exec(line);

		if (m && known.has(m[1])) {
			ret[m[1]] = m[2];
		};
	};

	return ret;
};

const emptyCli = <T>(value: T): Record<CliName, T> => CLI_NAMES.reduce((acc, n) => ({ ...acc, [n]: value }), {} as Record<CliName, T>);

const expandHome = (env: Env, p: string): string => /^~[\\/]/.test(p) ? pathOf(env).join(env.home, p.slice(2)) : p;

export const systemRoot = (env: Env): string => getVar(env, 'SystemRoot') || 'C:\\Windows';

const isFile = (env: Env, p: string): boolean => !!env.stat(p)?.isFile;

/**
 * The login shell and how to call it: a POSIX shell from $SHELL runs SHELL_SCRIPT with `-lc`; fish runs
 * FISH_SCRIPT with `-l -c` (its own config sets fish users' PATH and homes); anything else (csh, tcsh,
 * a missing file) falls back to /bin/zsh on macOS, /bin/sh on Linux.
 */
export const shellFor = (env: Env): { file: string; args: string[] } => {
	const P = pathOf(env);
	const shell = env.vars.SHELL;

	if (shell && P.isAbsolute(shell) && env.exists(shell)) {
		const name = P.basename(shell);

		if (POSIX_SHELLS.includes(name)) {
			return { file: shell, args: [ '-lc', SHELL_SCRIPT ] };
		};
		if (name == 'fish') {
			return { file: shell, args: [ '-l', '-c', FISH_SCRIPT ] };
		};
	};
	return { file: (env.platform == 'darwin') ? '/bin/zsh' : '/bin/sh', args: [ '-lc', SHELL_SCRIPT ] };
};

/**
 * What `name` runs on Windows: the first PATH entry (absolute, local) holding `name` + a PATHEXT
 * extension. Only an .exe is runnable; when the first match is a .cmd / .bat it is a shim.
 */
const whichWindows = (env: Env, name: string): { exe: string | null; shim: boolean } => {
	const P = pathOf(env);
	const exts = (getVar(env, 'PATHEXT') || '.COM;.EXE;.BAT;.CMD').split(';').map(s => s.trim().toLowerCase()).filter(s => /^\.[a-z0-9]+$/.test(s));
	const dirs = getVar(env, 'PATH').split(';').map(s => expandWindowsVars(env, s.trim().replace(/^"(.*)"$/, '$1'))).filter(s => isLocalAbsolute(env, s));

	for (const dir of dirs) {
		for (const ext of exts) {
			const file = P.join(dir, name + ext);

			if (isFile(env, file)) {
				return (ext == '.exe') ? { exe: file, shim: false } : { exe: null, shim: true };
			};
		};
	};

	return { exe: null, shim: false };
};

export const powershellPath = (env: Env): string => pathOf(env).join(systemRoot(env), 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

/**
 * One read-only PowerShell call for the App Paths default values of `names` (HKCU first, then HKLM).
 * Output is forced to UTF-8 without a BOM, so a path under a non-ASCII profile name decodes whatever
 * the console code page is. Each line: `<hive>:<name>=<path>`; values come expanded from the registry.
 */
export const appPathsScript = (names: CliName[]): string => [
	'[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false;',
	`foreach ($n in @(${names.map(n => `'${n}'`).join(',')})) {`,
	`foreach ($h in @('HKCU','HKLM')) {`,
	`$v = (Get-ItemProperty -LiteralPath ($h + ':\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\' + $n + '.exe') -ErrorAction SilentlyContinue).'(default)';`,
	`if ($v) { [Console]::Out.WriteLine($h + ':' + $n + '=' + $v) }`,
	'} }',
].join(' ');

/** name → the first (HKCU before HKLM) App Paths value printed by appPathsScript */
const parseAppPaths = (text: string): Partial<Record<CliName, string>> => {
	const ret: Partial<Record<CliName, string>> = {};
	const found: Record<string, Record<string, string>> = { HKCU: {}, HKLM: {} };

	for (const line of String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/)) {
		const m = /^(HKCU|HKLM):([a-z]+)=(.+)$/.exec(line);

		if (m && CLI_NAMES.includes(m[2] as CliName)) {
			found[m[1]][m[2]] = m[3].trim().replace(/^"(.*)"$/, '$1');
		};
	};

	for (const name of CLI_NAMES) {
		const v = found.HKCU[name] || found.HKLM[name];

		if (v) {
			ret[name] = v;
		};
	};
	return ret;
};

const resolveWindows = async (env: Env, homes: Homes): Promise<void> => {
	const P = pathOf(env);
	const missing: CliName[] = [];

	// The PATH is read here, not by a child: nothing to fail
	homes.shellOk = true;
	homes.path = getVar(env, 'PATH');

	for (const name of CLI_NAMES) {
		const found = whichWindows(env, name);

		homes.cli[name] = found.exe;
		homes.cliShim[name] = found.shim;

		if (found.exe || found.shim) {
			continue;
		};

		const known = KNOWN_CLI_DIRS_WIN.map(dir => P.join(expandHome(env, dir), `${name}.exe`)).find(file => isFile(env, file));

		if (known) {
			homes.cli[name] = known;
		} else {
			missing.push(name);
		};
	};

	if (!missing.length) {
		return;
	};

	const res = await env.run(powershellPath(env), [ '-NoProfile', '-NonInteractive', '-Command', appPathsScript(missing) ], { timeout: 5000 });
	const values = ((res.code == 0) && !res.timedOut) ? parseAppPaths(res.stdout) : {};

	for (const name of missing) {
		// Values arrive expanded; a `%NAME%` left in one is expanded from the (case-insensitive) environment
		const value = expandWindowsVars(env, values[name] || '');

		if (value && isLocalAbsolute(env, value) && /\.exe$/i.test(value) && isFile(env, value)) {
			homes.cli[name] = value;
		};
	};
};

const resolvePosix = async (env: Env, homes: Homes): Promise<Record<string, string> | null> => {
	const P = pathOf(env);
	const shell = shellFor(env);
	const res = await env.run(shell.file, shell.args, { timeout: 4000 });
	const ok = (res.code == 0) && !res.timedOut;
	const values = ok ? parseShellOutput(res.stdout) : {};

	homes.shellOk = ok;

	for (const name of CLI_NAMES) {
		const v = values[name] || '';
		homes.cli[name] = (v && P.isAbsolute(v) && env.exists(v)) ? v : null;

		if (homes.cli[name]) {
			continue;
		};

		// A GUI-started app has a minimal PATH and the shell may not know every install either
		for (const dir of KNOWN_CLI_DIRS) {
			const file = P.join(expandHome(env, dir), name);

			if (env.exists(file)) {
				homes.cli[name] = file;
				break;
			};
		};
	};

	homes.path = ('PATH' in values) ? values.PATH : (env.vars.PATH || '');
	return ok ? values : null;
};

/** One login-shell call (macOS / Linux) or an in-process PATH lookup (Windows), cached for 60 s */
export const resolveHomes = async (env: Env, opt: { force?: boolean } = {}): Promise<Homes> => {
	const cached = homesCache.get(env);

	if (cached && !opt.force && ((env.now() - cached.at) < HOMES_TTL)) {
		return cached.homes;
	};

	const P = pathOf(env);
	const homes: Homes = {
		shellOk: false,
		cli: emptyCli<string | null>(null),
		cliShim: emptyCli(false),
		path: '',
		overrides: { CODEX_HOME: '', COPILOT_HOME: '', CLAUDE_CONFIG_DIR: '' },
		rejected: [],
		codexHome: '',
		copilotHome: '',
		claudeHome: '',
		claudeConfigDir: '',
	};

	let values: Record<string, string> | null = null;

	try {
		if (env.platform == 'win32') {
			await resolveWindows(env, homes);
		} else {
			values = await resolvePosix(env, homes);
		};
	} catch (e) {
		homes.shellOk = false;
		values = null;
	};

	// A label the login shell printed wins, even when it is empty (the shell cleared the variable);
	// the inherited environment counts only when the label is absent or the shell failed
	const raw = (name: string): string => (values && Object.prototype.hasOwnProperty.call(values, name)) ? values[name] : getVar(env, name);
	// A usable override is a local absolute path inside the real home; UNC / device paths are refused before any lookup
	const usable = (p: string): boolean => {
		const real = isLocalAbsolute(env, p) ? canonicalPath(env, p) : null;
		return !!real && isInside(env, realHome(env), real);
	};

	for (const name of HOME_VARS) {
		const v = raw(name);

		if (v && usable(v)) {
			homes.overrides[name] = v;
		} else
		if (v) {
			homes.rejected.push(name);
		};
	};

	const isRejected = (name: HomeVar): boolean => homes.rejected.includes(name);

	homes.codexHome = isRejected('CODEX_HOME') ? '' : (homes.overrides.CODEX_HOME || P.join(env.home, '.codex'));
	homes.copilotHome = isRejected('COPILOT_HOME') ? '' : (homes.overrides.COPILOT_HOME || P.join(env.home, '.copilot'));
	homes.claudeConfigDir = homes.overrides.CLAUDE_CONFIG_DIR;
	homes.claudeHome = isRejected('CLAUDE_CONFIG_DIR') ? '' : (homes.claudeConfigDir || P.join(env.home, '.claude'));

	homesCache.set(env, { at: env.now(), homes });
	return homes;
};

/** Claude Code's own config file (read-only for Anytype); '' when CLAUDE_CONFIG_DIR is rejected */
export const claudeCodeConfigFile = (env: Env, homes: Homes): string => {
	const P = pathOf(env);

	if (homes.rejected.includes('CLAUDE_CONFIG_DIR')) {
		return '';
	};
	return homes.claudeConfigDir ? P.join(homes.claudeConfigDir, '.claude.json') : P.join(env.home, '.claude.json');
};

/**
 * The one Claude Code config file that preflight, the CLI (run with the same HOME and
 * CLAUDE_CONFIG_DIR, see exec.runCli) and the readback all use: claudeCodeConfigFile, resolved under
 * home. An error (→ manual) when CLAUDE_CONFIG_DIR is rejected, the file resolves outside home, or
 * `.claude.json` is absent while a legacy `<Claude home>/.config.json` exists: Claude Code would then use
 * the legacy file, which the POC neither checks nor edits.
 */
export const claudeCodeProfile = (env: Env, homes: Homes): { file: string; exists: boolean } | { error: AiError } => {
	const file = claudeCodeConfigFile(env, homes);

	if (!file) {
		return { error: { stage: 'detect', category: 'outsideHome' } };
	};

	const target = resolveTarget(env, file);

	if ('error' in target) {
		return target;
	};

	const legacy = pathOf(env).join(homes.claudeHome, '.config.json');

	if (!target.exists && env.lstat(legacy)) {
		return { error: { stage: 'read', category: 'unsupportedForm', path: legacy } };
	};
	return { file: target.real, exists: target.exists };
};

const localAppData = (env: Env): string => {
	const v = getVar(env, 'LOCALAPPDATA');
	return isLocalAbsolute(env, v) ? v : pathOf(env).join(env.home, 'AppData', 'Local');
};

const roamingAppData = (env: Env): string => {
	const v = getVar(env, 'APPDATA');
	return isLocalAbsolute(env, v) ? v : pathOf(env).join(env.home, 'AppData', 'Roaming');
};

export const CLAUDE_PACKAGE_RE = /^(Claude_|AnthropicPBC\.Claude)/i;

const isDir = (env: Env, p: string): boolean => !!env.lstat(p)?.isDir || !!env.stat(p)?.isDir;

/** Claude Desktop's user-data dir (holds claude_desktop_config.json and the extension state) */
export const claudeDesktopDir = (env: Env): string => {
	const P = pathOf(env);

	if (env.platform == 'darwin') {
		return P.join(env.home, 'Library', 'Application Support', 'Claude');
	};

	if (env.platform == 'win32') {
		const local = localAppData(env);
		const dataRoot = P.join(local, 'Claude-Data');
		const migrated = (env.readDir(dataRoot) || []).find(n => CLAUDE_PACKAGE_RE.test(n));
		const pkg = (env.readDir(P.join(local, 'Packages')) || []).find(n => CLAUDE_PACKAGE_RE.test(n));
		const candidates = [
			migrated ? P.join(dataRoot, migrated) : '',
			pkg ? P.join(local, 'Packages', pkg, 'LocalCache', 'Roaming', 'Claude') : '',
			P.join(roamingAppData(env), 'Claude'),
		].filter(Boolean);

		return candidates.find(p => isDir(env, p)) || candidates[candidates.length - 1];
	};

	return P.join(env.home, '.config', 'Claude');
};

/** ~/.lmstudio-home-pointer when it is itself a regular file (lstat: not a link, not a FIFO); never followed */
const lmstudioPointer = (env: Env): string | null => {
	const p = pathOf(env).join(env.home, '.lmstudio-home-pointer');
	const st = env.lstat(p);

	return (st && st.isFile && !st.isSymlink) ? p : null;
};

/**
 * LM Studio's home: the FIRST line (trimmed) of ~/.lmstudio-home-pointer, when the pointer is itself a
 * small regular file (lstat before it is opened, opened without following a link, ≤ 4 KiB) and that line
 * is an absolute local path to an existing directory under home; anything after the first line is
 * ignored. Else ~/.lmstudio, else ~/.cache/lm-studio. A UNC or device path is refused before any lookup.
 */
export const lmstudioHome = (env: Env): string => {
	const P = pathOf(env);
	const pointer = lmstudioPointer(env);
	const res = pointer ? env.readFile(pointer, POINTER_MAX, { noFollow: true }) : null;

	if (res && ('data' in res)) {
		const p = res.data.toString('utf8').split(/\r?\n/)[0].trim();
		const real = isLocalAbsolute(env, p) ? canonicalPath(env, p) : null;

		if (real && isInside(env, realHome(env), real) && isDir(env, real)) {
			return real;
		};
	};

	const dot = P.join(env.home, '.lmstudio');
	const cache = P.join(env.home, '.cache', 'lm-studio');

	if (isDir(env, dot)) {
		return dot;
	};
	return isDir(env, cache) ? cache : dot;
};

/** Thrown inside the app scan when a lookup could not run (not "not found"): the scan is incomplete */
class ScanFailure extends Error {};

const plistBundleId = async (env: Env, app: string): Promise<string> => {
	const res = await env.run('/usr/bin/plutil', [ '-extract', 'CFBundleIdentifier', 'raw', '-o', '-', pathOf(env).join(app, 'Contents', 'Info.plist') ], { timeout: 3000 });

	if (res.timedOut || (res.code == -1)) {
		throw new ScanFailure('plutil');
	};
	return (res.code == 0) ? res.stdout.trim() : '';
};

/**
 * /Applications, ~/Applications, then Spotlight; the bundle id must match (a same-named bundle with
 * another id is not the app). Throws ScanFailure when plutil or mdfind could not run.
 */
export const findMacApp = async (env: Env, names: string[], bundleId: string): Promise<string | null> => {
	const P = pathOf(env);

	for (const dir of [ '/Applications', P.join(env.home, 'Applications') ]) {
		for (const name of names) {
			const app = P.join(dir, `${name}.app`);

			if (env.exists(app) && ((await plistBundleId(env, app)) == bundleId)) {
				return app;
			};
		};
	};

	const res = await env.run('/usr/bin/mdfind', [ `kMDItemCFBundleIdentifier == '${bundleId}'` ], { timeout: 3000 });

	// mdfind exits 0 for an empty result; any other exit is a lookup that did not happen
	if (res.timedOut || (res.code != 0)) {
		throw new ScanFailure('mdfind');
	};

	const found = res.stdout.split(/\r?\n/).map(s => s.trim()).filter(s => P.isAbsolute(s) && s.endsWith('.app'));

	for (const app of found) {
		if (env.exists(app) && ((await plistBundleId(env, app)) == bundleId)) {
			return app;
		};
	};

	return null;
};

const windowsCodexPackage = async (env: Env): Promise<string | null> => {
	const res = await env.run(powershellPath(env), [ '-NoProfile', '-NonInteractive', '-Command', 'Get-AppxPackage -Name OpenAI.Codex | Select-Object -ExpandProperty InstallLocation' ], { timeout: 5000 });

	if (res.timedOut || (res.code == -1)) {
		throw new ScanFailure('powershell');
	};

	const line = (res.code == 0) ? res.stdout.split(/\r?\n/).map(s => s.trim()).find(Boolean) : '';
	return line || null;
};

interface AppEvidence { installed: boolean; appPath?: string; exePath?: string };

/**
 * Install evidence per card. `ok` is false when the scan could not complete: the home directory can't
 * be listed, a directory on the way can't be listed, or a lookup tool could not run. A failed lookup
 * is never folded into "not installed" silently.
 */
const scanApps = async (env: Env, homes: Homes, createdDirs: string[]): Promise<{ ok: boolean; apps: Partial<Record<AiAppId, AppEvidence>> }> => {
	const P = pathOf(env);
	const home = env.home;
	const mac = env.platform == 'darwin';
	const win = env.platform == 'win32';
	const linux = !mac && !win;
	const created = new Set(createdDirs.map(d => canonicalPath(env, d) || d));

	let ok = (env.readDir(home) !== null);

	/** Lists a directory; one that exists but can't be listed marks the scan incomplete */
	const list = (dir: string): string[] => {
		const names = env.readDir(dir);

		if (names === null) {
			ok = false;
		};
		return names || [];
	};

	/** A directory counts only when Anytype didn't create it */
	const dirEvidence = (p: string): boolean => !!p && isDir(env, p) && !created.has(canonicalPath(env, p) || p);
	const fileEvidence = (p: string): boolean => !!p && env.exists(p) && !isDir(env, p);
	const cli = (...names: CliName[]): boolean => names.some(n => !!homes.cli[n] || !!homes.cliShim[n]);
	const exe = (p: string): AppEvidence => isFile(env, p) ? { installed: true, exePath: p } : { installed: false };
	/**
	 * The macOS bundle. A lookup that could not run (plutil / Spotlight failed) marks the scan incomplete
	 * and counts as "no bundle found": the card's other evidence (a CLI, a config dir) still decides.
	 */
	const macApp = async (names: string[], appId: AiAppId, bundleId = BUNDLE_IDS[appId]): Promise<AppEvidence> => {
		let app: string | null = null;

		try {
			app = mac ? await findMacApp(env, names, bundleId) : null;
		} catch (e) {
			ok = false;
		};
		return app ? { installed: true, appPath: app } : { installed: false };
	};
	const or = (a: AppEvidence, b: boolean): AppEvidence => (a.installed || !b) ? a : { installed: true };
	const desktopEntry = (re: RegExp): boolean => [ P.join(home, '.local', 'share', 'applications'), '/usr/share/applications' ].some(dir => list(dir).some(n => re.test(n) && n.endsWith('.desktop')));

	const tasks: Record<string, () => Promise<AppEvidence>> = {
		'claude-desktop': async () => {
			if (mac) {
				return macApp([ 'Claude' ], 'claude-desktop');
			};
			if (win) {
				const local = localAppData(env);
				const pkg = list(P.join(local, 'Packages')).find(n => CLAUDE_PACKAGE_RE.test(n));

				if (pkg) {
					return { installed: true, appPath: P.join(local, 'Packages', pkg) };
				};
				return exe(P.join(local, 'AnthropicClaude', 'Claude.exe'));
			};
			return { installed: dirEvidence(P.join(home, '.config', 'Claude')) };
		},
		'claude-code': async () => ({ installed: cli('claude') || fileEvidence(claudeCodeConfigFile(env, homes)) || dirEvidence(homes.claudeHome) }),
		'chatgpt': async () => {
			if (mac) {
				return macApp([ 'ChatGPT' ], 'chatgpt');
			};
			if (win) {
				const location = await windowsCodexPackage(env);
				return location ? { installed: true, appPath: location } : { installed: false };
			};
			return { installed: cli('chatgpt') || desktopEntry(/chatgpt/i) };
		},
		'chatgpt-classic': async () => macApp([ 'ChatGPT Classic', 'ChatGPT' ], 'chatgpt-classic'),
		'codex': async () => ({ installed: cli('codex') || dirEvidence(homes.codexHome) }),
		'cursor': async () => {
			let ev: AppEvidence = { installed: false };

			if (mac) {
				ev = await macApp([ 'Cursor' ], 'cursor');
			} else
			if (win) {
				ev = exe(P.join(localAppData(env), 'Programs', 'cursor', 'Cursor.exe'));
			};
			return or(ev, cli('cursor', 'agent') || dirEvidence(P.join(home, '.cursor')));
		},
		'vscode': async () => {
			let ev: AppEvidence = { installed: false };

			if (mac) {
				ev = await macApp([ 'Visual Studio Code' ], 'vscode');
			} else
			if (win) {
				ev = exe(P.join(localAppData(env), 'Programs', 'Microsoft VS Code', 'Code.exe'));
			};
			return or(ev, cli('code', 'copilot') || dirEvidence(homes.copilotHome));
		},
		'lmstudio': async () => {
			const ev = await macApp([ 'LM Studio' ], 'lmstudio');
			const dirs = [ P.join(home, '.lmstudio'), P.join(home, '.cache', 'lm-studio') ].some(dirEvidence);

			return or(ev, dirs || !!lmstudioPointer(env) || cli('lms'));
		},
		// ~/.gemini is shared by Gemini CLI and Antigravity: each is told by its own files
		'gemini-cli': async () => ({ installed: cli('gemini') || fileEvidence(P.join(home, '.gemini', 'settings.json')) }),
		'antigravity': async () => or(await macApp([ 'Antigravity' ], 'antigravity'), cli('agy') || dirEvidence(P.join(home, '.gemini', 'config')) || dirEvidence(P.join(home, '.gemini', 'antigravity'))),
		'opencode': async () => ({ installed: cli('opencode') || dirEvidence(opencodeDir(env)) || dirEvidence(P.join(home, '.local', 'share', 'opencode')) }),
		// The Gemini desktop app (macOS): only its card's presence depends on it
		'gemini': async () => macApp([ 'Gemini' ], 'gemini'),
		// The CLI, the default profile's config, or the desktop app (it writes the same layout)
		'hermes': async () => {
			const bundled = await macApp([ 'Hermes Agent' ], 'hermes');
			const ev = bundled.installed ? bundled : await macApp([ 'Hermes' ], 'hermes', HERMES_FULL_BUNDLE_ID);

			return or(ev, cli('hermes') || fileEvidence(P.join(hermesHome(env), 'config.yaml')) || (win && dirEvidence(hermesHome(env))));
		},
	};

	if (!mac) {
		delete tasks['chatgpt-classic'];
		delete tasks['gemini'];
	};

	const ids = Object.keys(tasks);
	const results = await Promise.all(ids.map(id => tasks[id]().catch(() => {
		ok = false;
		return { installed: false };
	})));

	return { ok, apps: ids.reduce((acc, id, i) => ({ ...acc, [id]: results[i] }), {}) };
};

/** Hermes' default profile (HERMES_HOME): ~/.hermes, %LOCALAPPDATA%\\hermes on Windows. Named profiles are manual */
export const hermesHome = (env: Env): string => (env.platform == 'win32') ? pathOf(env).join(localAppData(env), 'hermes') : pathOf(env).join(env.home, '.hermes');

/** OpenCode's global config folder */
export const opencodeDir = (env: Env): string => pathOf(env).join(env.home, '.config', 'opencode');

/** OpenCode's global config file: opencode.json, else an existing opencode.jsonc, else opencode.json (created) */
export const opencodeConfigFile = (env: Env): string => {
	const P = pathOf(env);
	const json = P.join(opencodeDir(env), 'opencode.json');
	const jsonc = P.join(opencodeDir(env), 'opencode.jsonc');

	return (!env.exists(json) && env.exists(jsonc)) ? jsonc : json;
};

/** A stable record id per custom CODEX_HOME: the canonical config path decides (case-folded on Windows) */
export const codexHomeId = (env: Env, file: string): AiTargetId => {
	const norm = (env.platform == 'win32') ? file.toLowerCase() : file;
	return `codex-home-${crypto.createHash('sha256').update(norm, 'utf8').digest('hex').slice(0, 8)}`;
};

/** Which record id a card maps to on this machine, and the canonical paths it reads */
export const targetFor = (env: Env, homes: Homes, appId: AiAppId): { targetId?: AiTargetId; targetPaths: string[] } => {
	const P = pathOf(env);
	const canon = (...list: string[]): string[] => list.map(p => p ? canonicalPath(env, p) : null).filter(Boolean);
	const same = (a: string | null, b: string | null): boolean => !!a && !!b && ((env.platform == 'win32') ? (a.toLowerCase() == b.toLowerCase()) : (a == b));

	switch (appId) {
		case 'claude-desktop': {
			return { targetId: 'claude-desktop', targetPaths: canon(P.join(claudeDesktopDir(env), 'claude_desktop_config.json')) };
		};
		case 'claude-code': {
			// A rejected CLAUDE_CONFIG_DIR: no automatic target, never the default profile instead
			if (!homes.claudeHome) {
				return { targetPaths: [] };
			};
			return { targetId: 'claude-code', targetPaths: canon(P.join(homes.claudeHome, 'settings.json'), claudeCodeConfigFile(env, homes)) };
		};
		case 'chatgpt': {
			// The Dock-started app never sees a shell-only CODEX_HOME: always ~/.codex
			return { targetId: 'codex', targetPaths: canon(P.join(env.home, '.codex', 'config.toml')) };
		};
		case 'codex': {
			// A rejected CODEX_HOME: no automatic target, never ChatGPT's ~/.codex instead
			if (!homes.codexHome) {
				return { targetPaths: [] };
			};

			const file = canonicalPath(env, P.join(homes.codexHome, 'config.toml'));
			const defaultCodex = canonicalPath(env, P.join(env.home, '.codex', 'config.toml'));

			if (!file) {
				return { targetPaths: [] };
			};
			return { targetId: same(file, defaultCodex) ? 'codex' : codexHomeId(env, file), targetPaths: [ file ] };
		};
		case 'cursor': {
			return { targetId: 'cursor', targetPaths: canon(P.join(env.home, '.cursor', 'mcp.json')) };
		};
		case 'vscode': {
			if (!homes.copilotHome) {
				return { targetPaths: [] };
			};
			return { targetId: 'copilot', targetPaths: canon(P.join(homes.copilotHome, 'mcp-config.json')) };
		};
		case 'lmstudio': {
			return { targetId: 'lmstudio', targetPaths: canon(P.join(lmstudioHome(env), 'mcp.json')) };
		};
		case 'gemini-cli': {
			// User scope only, never a project's .gemini/settings.json
			return { targetId: 'gemini-cli', targetPaths: canon(P.join(env.home, '.gemini', 'settings.json')) };
		};
		case 'antigravity': {
			return { targetId: 'antigravity', targetPaths: canon(P.join(env.home, '.gemini', 'config', 'mcp_config.json')) };
		};
		case 'hermes': {
			return { targetId: 'hermes', targetPaths: canon(P.join(hermesHome(env), 'config.yaml')) };
		};
		case 'opencode': {
			// The file used comes first; both spellings are OpenCode's
			const file = opencodeConfigFile(env);
			const other = file.endsWith('.jsonc') ? file.slice(0, -1) : `${file}c`;

			return { targetId: 'opencode', targetPaths: canon(file, other) };
		};
	};

	return { targetPaths: [] };
};

/**
 * Every catalog card with its install evidence and target. `scanOk` is false when the app scan could not
 * complete (a lookup failed, a directory on the way could not be listed; see scanApps): the items still
 * carry every positive evidence found, but "not installed" is not reliable. A failed login shell alone
 * does not fail the scan (known CLI dirs and the inherited environment stand in).
 */
export const detectAll = async (env: Env, opt: { createdDirs?: string[]; force?: boolean } = {}): Promise<{ scanOk: boolean; homes: Homes; items: Detected[] }> => {
	const homes = await resolveHomes(env, { force: opt.force });

	let apps: Partial<Record<AiAppId, AppEvidence>> = {};
	let appScanOk = true;

	try {
		const scan = await scanApps(env, homes, opt.createdDirs || []);

		apps = scan.apps;
		appScanOk = scan.ok;
	} catch (e) {
		appScanOk = false;
	};

	const items: Detected[] = CATALOG.map(item => {
		const ev = apps[item.id] || { installed: false };
		const target = targetFor(env, homes, item.id);
		const det: Detected = {
			appId: item.id,
			installed: !!ev.installed,
			targetPaths: target.targetPaths,
			// Set by the adapters (Phase 2)
			canRestart: false,
		};

		if (ev.appPath) {
			det.appPath = ev.appPath;
		};
		if (ev.exePath) {
			det.exePath = ev.exePath;
		};
		if (target.targetId) {
			det.targetId = target.targetId;
		};
		return det;
	});

	return { scanOk: appScanOk, homes, items };
};

/** What the renderer may see: no app or executable paths */
export const toDetection = (det: Detected, icon?: string, platform?: NodeJS.Platform): AiDetection => {
	const ret: AiDetection = { appId: det.appId, installed: det.installed, targetPaths: det.targetPaths.slice(), canRestart: det.canRestart };

	// What openApp can launch: the macOS bundle or the Windows executable detection found
	if (det.installed && (((platform == 'darwin') && !!det.appPath) || ((platform == 'win32') && !!det.exePath))) {
		ret.canOpen = true;
	};

	if (det.targetId) {
		ret.targetId = det.targetId;
	};
	if (icon) {
		ret.icon = icon;
	};
	return ret;
};
