/**
 * Phase 2 test helpers (imported by *.test.ts only): a fake macOS / Windows / Linux machine with chosen
 * apps and CLIs, the service on it, and IPC parameter builders. Files are in the fake file system.
 */
import { AiConnectService } from './index';
import { fakeEnv, type FakeEnv, type FakeSpec, type RunCall } from './testEnv';
import type { LinkAppGrant, RunResult } from './types';

export const MAC_HOME = '/Users/me';
export const REGISTRY = '/Users/me/Library/Application Support/anytype/aiConnect.json';
export const APP_ROOT_MAC = '/Applications/Anytype.app/Contents/Resources/app.asar.unpacked';
export const MCP_DIR = `${APP_ROOT_MAC}/dist/mcp`;
export const GRANT: LinkAppGrant = { spaceIds: [], allSpaces: true, perm: 1 };

/** The forwarder this fake build ships (the fake env computes its metadata from it and answers its key verbs in memory) */
export const FORWARDER_BIN = `${APP_ROOT_MAC}/dist/anytype-mcp`;
export const FORWARDER_FILES: Record<string, string> = {
	[FORWARDER_BIN]: 'FORWARDER-BYTES',
};
/** The stable copy a development build installs and writes into other apps' settings */
export const STABLE_BIN = `${MAC_HOME}/.anytype/bin-dev/anytype-mcp`;
/** The same for a release build (`signed: true`) */
export const STABLE_BIN_RELEASE = `${MAC_HOME}/.anytype/bin/anytype-mcp`;
/** The label of Claude Desktop's item on a development build (never a file anytype-ts reads) */
export const CLAUDE_ITEM = `${MAC_HOME}/.anytype/ai-connect/items-dev/claude-desktop.item`;

/** Keys as heart issues them (printable, no quotes); SENTINEL- so leaks are easy to find */
export const KEY_A = 'SENTINEL-key-a-0123456789abcdef';
export const KEY_B = 'SENTINEL-key-b-fedcba9876543210';
export const KEY_C = 'SENTINEL-key-c-00112233445566778';

/** macOS bundles: path → bundle id (CFBundleExecutable = the bundle's base name) */
export const MAC_APPS: Record<string, string> = {
	'/Applications/Claude.app': 'com.anthropic.claudefordesktop',
	'/Applications/ChatGPT.app': 'com.openai.codex',
	'/Applications/Cursor.app': 'com.todesktop.230313mzl4w4u92',
	'/Applications/Visual Studio Code.app': 'com.microsoft.VSCode',
	'/Applications/LM Studio.app': 'ai.elementlabs.lmstudio',
	'/Applications/Antigravity.app': 'com.google.antigravity',
	'/Applications/Gemini.app': 'com.google.GeminiMacOS',
	'/Applications/Hermes Agent.app': 'com.nousresearch.hermes-bundled',
};

export interface MachineOpt {
	/** Which of MAC_APPS are installed (by base name, e.g. 'Cursor'); default none */
	apps?: string[];
	/** Labelled login-shell output (CLI paths, PATH, homes) */
	shell?: Record<string, string>;
	files?: Record<string, string>;
	dirs?: string[];
	links?: Record<string, string>;
	modes?: Record<string, number>;
	vars?: Record<string, string>;
	meta?: string | null;
	signed?: boolean;
	forwarder?: FakeSpec['forwarder'];
	/** Answers a child process first; return null to fall through to the defaults */
	run?: (call: RunCall) => RunResult | Promise<RunResult> | null;
};

/** A fake Mac: plutil answers bundle ids and executables, the login shell answers `shell`, mdfind finds nothing */
export const mac = (opt: MachineOpt = {}): FakeEnv => {
	const apps = Object.keys(MAC_APPS).filter(p => (opt.apps || []).some(name => p.endsWith(`/${name}.app`)));
	const spec: FakeSpec = {
		platform: 'darwin',
		home: MAC_HOME,
		vars: { SHELL: '/bin/zsh', ...(opt.vars || {}) },
		files: { '/bin/zsh': '', ...(opt.files || {}) },
		dirs: [ ...apps, '/Users/me/Library/Application Support/anytype', ...(opt.dirs || []) ],
		links: opt.links,
		modes: opt.modes,
		signed: opt.signed,
		forwarder: opt.forwarder,
		...((opt.meta !== undefined) ? { meta: opt.meta } : {}),
		run: async call => {
			const custom = opt.run ? await opt.run(call) : null;

			if (custom) {
				return custom;
			};
			if (call.file == '/usr/bin/plutil') {
				const plist = call.args[call.args.length - 1];
				const app = plist.replace(/\/Contents\/Info\.plist$/, '');

				if (!apps.includes(app)) {
					return { code: 1, stdout: '' };
				};
				return (call.args[1] == 'CFBundleExecutable')
					? { code: 0, stdout: app.split('/').pop().replace(/\.app$/, '') + '\n' }
					: { code: 0, stdout: MAC_APPS[app] + '\n' };
			};
			if (call.file == '/bin/zsh') {
				return { code: 0, stdout: Object.entries(opt.shell || {}).map(([ k, v ]) => `${k}=${v}`).join('\n') + '\n' };
			};
			if (call.file == '/usr/bin/mdfind') {
				return { code: 0, stdout: '' };
			};
			return { code: 1, stdout: '' };
		},
	};

	return fakeEnv(spec);
};

/** A service on `env` with its own queue and caches */
export const service = (env: FakeEnv, registryFile = REGISTRY): AiConnectService => {
	const svc = new AiConnectService(() => ({ env, registryFile }));

	svc.configure({ env, registryFile });
	return svc;
};

export const applyParam = (over: Record<string, any> = {}) => ({
	accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', recommendedTier: 'large', port: 31009, key: KEY_A,
	appHash: 'hash-a1', name: 'Cursor', grant: GRANT, expireAt: 0, expectedHash: null, ...over,
});

export const planParam = (over: Record<string, any> = {}) => ({ accountId: 'acc-a', appId: 'cursor', route: 'http', tier: 'large', port: 31009, ...over });

/** What a successful ListApps says about these hashes */
export const keysOf = (present: string[], absent: string[] = []) => [
	...present.map(hash => ({ hash, present: true })),
	...absent.map(hash => ({ hash, present: false })),
];
