/**
 * forwarder.ts: which forwarder a build may use (metadata, hash, namespace), where the stable copy goes,
 * and its install rule (anytype-mcp-plan §4.1–4.3): equal hash, never downgrade on macOS and Windows,
 * always our own on Linux (C2), `.rev` before the binary.
 */
import crypto from 'crypto';
import { describe, expect, test } from 'vitest';
import { buildMeta, bundled, ensureInstalled, itemLabel, platformKey, serveCommand, signedByUs, stable, stableDir, stdioSupported, usable } from './forwarder';
import { FAKE_TEAM, fakeEnv, type FakeEnv, type FakeSpec, type RunCall } from './testEnv';

const BYTES = 'FORWARDER-REV-5';
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

const MAC_ROOT = '/Applications/Anytype.app/Contents/Resources/app.asar.unpacked';
const WIN_ROOT = 'C:\\Program Files\\Anytype\\resources\\app.asar.unpacked';

interface Opt extends Partial<FakeSpec> {
	rev?: number;
	/** What codesign / PowerShell say about the stable copy's signature */
	signatureOk?: boolean;
	bytes?: string;
};

/** A machine whose build ships `bytes` as revision `rev` */
const machine = (platform: NodeJS.Platform, opt: Opt = {}): FakeEnv & { signatureCalls: RunCall[] } => {
	const win = (platform == 'win32');
	const home = win ? 'C:\\Users\\me' : ((platform == 'darwin') ? '/Users/me' : '/home/me');
	const bin = win ? `${WIN_ROOT}\\dist\\anytype-mcp.exe` : `${MAC_ROOT}/dist/anytype-mcp`;
	const bytes = opt.bytes ?? BYTES;
	const signed = opt.signed ?? true;
	const arch = opt.arch || ((platform == 'darwin') ? 'arm64' : 'x64');
	const key = (platform == 'darwin') ? 'darwin' : (win ? 'win32-x64' : `linux-${arch}`);
	const signatureCalls: RunCall[] = [];
	const env = fakeEnv({
		platform, home, arch,
		vars: win ? { SystemRoot: 'C:\\Windows', ...(opt.vars || {}) } : (opt.vars || {}),
		files: { [bin]: bytes, ...(opt.files || {}) },
		dirs: opt.dirs,
		links: opt.links,
		foreign: opt.foreign,
		meta: (opt.meta !== undefined) ? opt.meta : JSON.stringify({
			signed,
			forwarder: { rev: opt.rev ?? 5, namespace: signed ? 'release' : 'dev', ...(signed ? { teamId: FAKE_TEAM } : {}), sha256: { [key]: sha(bytes) } },
			mcpb: null,
		}),
		run: call => {
			if (/codesign$|powershell\.exe$/i.test(call.file)) {
				signatureCalls.push(call);
				return (platform == 'darwin') ? { code: opt.signatureOk ? 0 : 1, stdout: '' } : { code: 0, stdout: opt.signatureOk ? 'same-signer\r\n' : 'other\r\n' };
			};
			return { code: 1, stdout: '' };
		},
	});

	return Object.assign(env, { signatureCalls });
};

const put = (env: FakeEnv, file: string, text: string, mode = 0o755) => {
	const sep = (env.platform == 'win32') ? '\\' : '/';
	const parts = file.split(sep);

	for (let i = 2; i < parts.length; i++) {
		const dir = parts.slice(0, i).join(sep);

		if (!env.exists(dir)) {
			env.mkdir(dir, 0o700);
		};
	};
	if (env.exists(file)) {
		env.unlink(file);
	};
	env.writeFile(file, text, mode).close();
};

describe('the build\'s metadata and the in-app forwarder', () => {
	test('paths: in-app (asar-unpacked), the stable copy per channel, one command shape, the item label', () => {
		const mac = machine('darwin');
		const dev = machine('darwin', { signed: false });
		const win = machine('win32');

		expect(bundled(mac)).toBe(`${MAC_ROOT}/dist/anytype-mcp`);
		expect(bundled(win)).toBe(`${WIN_ROOT}\\dist\\anytype-mcp.exe`);
		expect(stable(mac)).toBe('/Users/me/.anytype/bin/anytype-mcp');
		// A build that isn't a release never touches the production copy or the production items
		expect(stableDir(dev)).toBe('/Users/me/.anytype/bin-dev');
		expect(itemLabel(dev, 'claude-desktop')).toBe('/Users/me/.anytype/ai-connect/items-dev/claude-desktop.item');
		expect(itemLabel(mac, 'claude-desktop')).toBe('/Users/me/.anytype/ai-connect/items/claude-desktop.item');
		expect(stable(win)).toBe('C:\\Users\\me\\.anytype\\bin\\anytype-mcp.exe');
		expect(serveCommand(mac, 'other-1a2b3c4d')).toEqual({ command: '/Users/me/.anytype/bin/anytype-mcp', args: [ 'serve', '--connection', 'other-1a2b3c4d' ] });
		// No `env` field, no key, no --files-dir: the forwarder makes its own fresh temp folder per process
		expect(Object.keys(serveCommand(mac, 'x'))).toEqual([ 'command', 'args' ]);
		expect(JSON.stringify(serveCommand(mac, 'x'))).not.toMatch(/files-dir|ELECTRON|Anytype\.app/);
	});

	test.each([
		[ 'darwin', 'arm64', 'darwin' ], [ 'darwin', 'x64', 'darwin' ], [ 'win32', 'x64', 'win32-x64' ], [ 'linux', 'x64', 'linux-x64' ], [ 'linux', 'arm64', 'linux-arm64' ],
	])('the metadata key on %s %s is %s', (platform, arch, key) => {
		expect(platformKey(fakeEnv({ platform: platform as NodeJS.Platform, home: '/h', arch }))).toBe(key);
	});

	test('usable: the bytes must equal the metadata; read from Env.buildMeta (inside app.asar), never from the unpacked folder', () => {
		const env = machine('darwin');

		expect(usable(env)).toMatchObject({ ok: true, path: `${MAC_ROOT}/dist/anytype-mcp`, sha256: sha(BYTES) });

		// A metadata file planted next to the binary is not read
		put(env, `${MAC_ROOT}/electron/json/aiConnect.build.json`, JSON.stringify({ signed: false, forwarder: { rev: 9, namespace: 'dev', sha256: { darwin: sha('evil') } }, mcpb: null }));
		put(env, `${MAC_ROOT}/dist/anytype-mcp`, 'evil');
		expect(usable(env)).toEqual({ ok: false, error: { stage: 'verify', category: 'notFound', path: `${MAC_ROOT}/dist/anytype-mcp` } });
	});

	test.each([
		[ 'no metadata', null ],
		[ 'broken metadata', '{ nope' ],
		[ 'no forwarder entry', JSON.stringify({ signed: true, forwarder: null, mcpb: null }) ],
		[ 'no hash for this platform', JSON.stringify({ signed: true, forwarder: { rev: 5, namespace: 'release', sha256: { 'win32-x64': sha(BYTES) } }, mcpb: null }) ],
		[ 'a signed build with the development namespace', JSON.stringify({ signed: true, forwarder: { rev: 5, namespace: 'dev', sha256: { darwin: sha(BYTES) } }, mcpb: null }) ],
		[ 'an unsigned build with the release namespace', JSON.stringify({ signed: false, forwarder: { rev: 5, namespace: 'release', sha256: { darwin: sha(BYTES) } }, mcpb: null }) ],
		[ 'a revision that isn\'t a number', JSON.stringify({ signed: true, forwarder: { rev: '5', namespace: 'release', sha256: { darwin: sha(BYTES) } }, mcpb: null }) ],
	])('%s: the stdio routes are refused and nothing is installed', async (name, meta) => {
		const env = machine('darwin', { meta });

		expect(usable(env)).toMatchObject({ ok: false, error: { stage: 'verify', category: 'notFound' } });
		expect(await ensureInstalled(env)).toMatchObject({ ok: false, error: { category: 'notFound' } });
		expect(Object.keys(env.files()).filter(f => f.startsWith('/Users/me/.anytype'))).toEqual([]);
	});

	test('a signed mcpb entry needs its signer; the bundle entry is dropped otherwise', () => {
		const env = machine('darwin', { meta: JSON.stringify({ signed: true, forwarder: { rev: 5, namespace: 'release', sha256: { darwin: sha(BYTES) } }, mcpb: { sha256: sha('zip'), version: '2.5.0' } }) });

		expect(buildMeta(env)).toMatchObject({ signed: true, mcpb: null });
	});

	test.each([
		[ 'linux', {}, true ],
		[ 'linux', { APPIMAGE: '/home/me/A.AppImage' }, true ],
		[ 'linux', { SNAP: '/snap/anytype/1' }, false ],
		[ 'linux', { FLATPAK_ID: 'io.anytype.anytype' }, false ],
		[ 'darwin', { SNAP: 'x', FLATPAK_ID: 'y' }, true ],
		[ 'win32', {}, true ],
	])('stdioSupported on %s with %o is %s', (platform, vars, ok) => {
		expect(stdioSupported(fakeEnv({ platform: platform as NodeJS.Platform, home: '/home/me', vars }))).toBe(ok);
	});

	test('unsupported packages do nothing: Snap, Flatpak and a portable-home AppImage keep the URL routes, and no file is created', async () => {
		for (const opt of [ { vars: { SNAP: '/snap/x' } }, { vars: { FLATPAK_ID: 'x' } }, { vars: { APPIMAGE: '/home/me/A.AppImage' }, dirs: [ '/home/me/A.AppImage.home' ] } ]) {
			const env = machine('linux', opt);

			expect(usable(env)).toEqual({ ok: false, error: { stage: 'detect', category: 'unsupportedPackage' } });
			expect(await ensureInstalled(env)).toEqual({ ok: false, error: { stage: 'detect', category: 'unsupportedPackage' } });
			expect(Object.keys(env.files()).filter(f => f.startsWith('/home/me/.anytype'))).toEqual([]);
			expect(env.dirs()).not.toContain('/home/me/.anytype');
		};
	});
});

describe('the stable copy (§4.2, §4.3)', () => {
	const STABLE = '/Users/me/.anytype/bin/anytype-mcp';

	test('a first install: folder 0700, binary 0755, `.rev` beside it, nothing else left behind', async () => {
		const env = machine('darwin');

		expect(await ensureInstalled(env)).toEqual({ ok: true, path: STABLE, installed: true });
		expect(env.files()[STABLE]).toBe(BYTES);
		expect(env.files()[`${STABLE}.rev`]).toBe('5\n');
		expect(env.modeOf(STABLE)).toBe(0o755);
		expect(env.modeOf('/Users/me/.anytype/bin')).toBe(0o700);
		expect(env.readDir('/Users/me/.anytype/bin').sort()).toEqual([ 'anytype-mcp', 'anytype-mcp.rev' ]);
		// The lock is released and no temp file stays
		expect(env.exists('/Users/me/.anytype/bin/.lock')).toBe(false);
	});

	test('equal hash → used as it is: nothing is written, whatever `.rev` says', async () => {
		const env = machine('darwin');

		put(env, STABLE, BYTES);
		put(env, `${STABLE}.rev`, '1\n', 0o644);

		const writes: string[] = [];
		const write = env.writeFile;

		env.writeFile = (p, d, m) => {
			writes.push(p);
			return write(p, d, m);
		};
		expect(await ensureInstalled(env)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(writes).toEqual([]);
		expect(env.signatureCalls).toEqual([]);
	});

	test('`.rev` is written BEFORE the binary', async () => {
		const env = machine('darwin');
		const order: string[] = [];
		const rename = env.rename;

		put(env, STABLE, 'OLDER');
		put(env, `${STABLE}.rev`, '3\n', 0o644);
		env.rename = (from, to) => {
			order.push(to);
			rename(from, to);
		};
		await ensureInstalled(env);
		expect(order).toEqual([ `${STABLE}.rev`, STABLE ]);
	});

	test.each([ [ 'lower', '4\n' ], [ 'equal', '5\n' ], [ 'missing', null ], [ 'not a number', 'x\n' ] ])('macOS: another copy with a %s `.rev` is replaced', async (name, rev) => {
		const env = machine('darwin', { signatureOk: true });

		put(env, STABLE, 'OTHER-BYTES');
		if (rev !== null) {
			put(env, `${STABLE}.rev`, rev, 0o644);
		};
		expect(await ensureInstalled(env)).toMatchObject({ ok: true, installed: true });
		expect(env.files()[STABLE]).toBe(BYTES);
		expect(env.files()[`${STABLE}.rev`]).toBe('5\n');
	});

	test('macOS: never downgrade — a copy with a higher `.rev` and our signature is left alone; without our signature it is replaced', async () => {
		const ours = machine('darwin', { signatureOk: true });

		put(ours, STABLE, 'NEWER-REV-7');
		put(ours, `${STABLE}.rev`, '7\n', 0o644);
		expect(await ensureInstalled(ours)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(ours.files()[STABLE]).toBe('NEWER-REV-7');
		expect(ours.files()[`${STABLE}.rev`]).toBe('7\n');
		// Asked with the identifier and the Team ID of this build's forwarder
		expect(ours.signatureCalls[0].file).toBe('/usr/bin/codesign');
		expect(ours.signatureCalls[0].args).toEqual([ '--verify', '--strict', `-R=identifier "com.anytype.mcp" and anchor apple generic and certificate leaf[subject.OU] = "${FAKE_TEAM}"`, STABLE ]);

		const planted = machine('darwin', { signatureOk: false });

		put(planted, STABLE, 'PLANTED');
		put(planted, `${STABLE}.rev`, '99\n', 0o644);
		expect(await ensureInstalled(planted)).toMatchObject({ ok: true, installed: true });
		expect(planted.files()[STABLE]).toBe(BYTES);
		expect(planted.files()[`${STABLE}.rev`]).toBe('5\n');
	});

	test('Linux (C2): the running Anytype always installs its own forwarder, also over a higher `.rev`; one hash per architecture', async () => {
		for (const arch of [ 'x64', 'arm64' ]) {
			const env = machine('linux', { arch });
			const file = '/home/me/.anytype/bin/anytype-mcp';

			put(env, file, 'NEWER-REV-9');
			put(env, `${file}.rev`, '9\n', 0o644);
			expect(await ensureInstalled(env)).toEqual({ ok: true, path: file, installed: true });
			expect(env.files()[file]).toBe(BYTES);
			expect(env.files()[`${file}.rev`]).toBe('5\n');
			// Linux has no signature to ask about
			expect(env.signatureCalls).toEqual([]);
		};

		// The other architecture's hash is not this machine's
		const wrong = machine('linux', { arch: 'arm64', meta: JSON.stringify({ signed: true, forwarder: { rev: 5, namespace: 'release', sha256: { 'linux-x64': sha(BYTES) } }, mcpb: null }) });

		expect(await ensureInstalled(wrong)).toMatchObject({ ok: false, error: { category: 'notFound' } });
	});

	test('an update that dies right after `.rev`: an older Anytype leaves the copy alone, the newer one finishes the job', async () => {
		const newer = machine('darwin', { rev: 6, bytes: 'FORWARDER-REV-6', signatureOk: true });
		const rename = newer.rename;

		put(newer, STABLE, 'FORWARDER-REV-4');
		put(newer, `${STABLE}.rev`, '4\n', 0o644);
		// The process dies when the binary is about to be renamed in
		newer.rename = (from, to) => {
			if (to == STABLE) {
				throw Object.assign(new Error('killed'), { code: 'EINTR' });
			};
			rename(from, to);
		};
		expect(await ensureInstalled(newer)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(newer.files()[`${STABLE}.rev`]).toBe('6\n');
		expect(newer.files()[STABLE]).toBe('FORWARDER-REV-4');

		// An older build (rev 5, other bytes) starts on the same home: `.rev` names a higher revision → left alone
		const older = machine('darwin', { rev: 5, signatureOk: true, files: { [STABLE]: 'FORWARDER-REV-4', [`${STABLE}.rev`]: '6\n' } });

		expect(await ensureInstalled(older)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(older.files()[STABLE]).toBe('FORWARDER-REV-4');

		// The newer build again: a different hash → it finishes
		newer.rename = rename;
		expect(await ensureInstalled(newer)).toMatchObject({ ok: true, installed: true });
		expect(newer.files()[STABLE]).toBe('FORWARDER-REV-6');
		expect(newer.readDir('/Users/me/.anytype/bin').sort()).toEqual([ 'anytype-mcp', 'anytype-mcp.rev' ]);
	});

	test('an update that dies right after the binary rename leaves a complete, usable copy', async () => {
		const env = machine('darwin', { rev: 6, bytes: 'FORWARDER-REV-6' });

		put(env, STABLE, 'FORWARDER-REV-4');
		await ensureInstalled(env);
		// Whatever follows the rename is lost; the next start finds an equal hash
		expect(await ensureInstalled(env)).toEqual({ ok: true, path: STABLE, installed: false });
	});

	test('links and foreign folders on the path are refused: nothing is written through them', async () => {
		const linkDir = machine('darwin', { dirs: [ '/Users/me/elsewhere' ], links: { '/Users/me/.anytype': '/Users/me/elsewhere' } });

		expect(await ensureInstalled(linkDir)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(linkDir.readDir('/Users/me/elsewhere')).toEqual([]);

		const linkFile = machine('darwin', { dirs: [ '/Users/me/.anytype/bin' ], files: { '/Users/me/target': 'x' }, links: { [STABLE]: '/Users/me/target' } });

		expect(await ensureInstalled(linkFile)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(linkFile.files()['/Users/me/target']).toBe('x');

		const foreign = machine('darwin', { dirs: [ '/Users/me/.anytype' ], foreign: [ '/Users/me/.anytype' ] });

		expect(await ensureInstalled(foreign)).toMatchObject({ ok: false, error: { category: 'installFailed' } });
	});

	test('one installer at a time: a fresh lock makes this one wait and give up; a stale lock is taken over', async () => {
		const held = machine('darwin');
		let now = 1000;

		held.now = () => now;
		held.sleep = async ms => {
			now += ms;
		};
		put(held, '/Users/me/.anytype/bin/.lock', String(now), 0o600);

		// Another Anytype holds it for longer than the wait, but refreshes nothing: after a minute it counts as dead
		const res = await ensureInstalled(held);

		expect(res).toMatchObject({ ok: false, error: { category: 'installFailed' } });
		expect(held.files()[STABLE]).toBeUndefined();

		now += 61 * 1000;
		expect(await ensureInstalled(held)).toMatchObject({ ok: true, installed: true });
		expect(held.exists('/Users/me/.anytype/bin/.lock')).toBe(false);
	});

	test('a development build installs to bin-dev and never looks at the production copy', async () => {
		const env = machine('darwin', { signed: false });

		put(env, STABLE, 'PRODUCTION');
		put(env, `${STABLE}.rev`, '9\n', 0o644);
		expect(await ensureInstalled(env)).toEqual({ ok: true, path: '/Users/me/.anytype/bin-dev/anytype-mcp', installed: true });
		expect(env.files()[STABLE]).toBe('PRODUCTION');
		expect(env.files()[`${STABLE}.rev`]).toBe('9\n');
	});
});

describe('the stable copy on Windows', () => {
	const STABLE = 'C:\\Users\\me\\.anytype\\bin\\anytype-mcp.exe';

	test('the current exe is renamed aside, the new one renamed in, the old one removed', async () => {
		const env = machine('win32');
		const order: string[] = [];
		const rename = env.rename;

		put(env, STABLE, 'OLDER');
		env.rename = (from, to) => {
			order.push(`${from.split('\\').pop().replace(/[0-9a-f]{8}|\d{4,}/g, '#')} → ${to.split('\\').pop().replace(/[0-9a-f]{8}/g, '#')}`);
			rename(from, to);
		};
		expect(await ensureInstalled(env)).toEqual({ ok: true, path: STABLE, installed: true });
		expect(env.files()[STABLE]).toBe(BYTES);
		expect(order[0]).toMatch(/→ anytype-mcp\.exe\.rev$/);
		expect(order[1]).toBe('anytype-mcp.exe → anytype-mcp.exe.old-#');
		expect(order[2]).toMatch(/→ anytype-mcp\.exe$/);
		expect(env.readDir('C:\\Users\\me\\.anytype\\bin').sort()).toEqual([ 'anytype-mcp.exe', 'anytype-mcp.exe.rev' ]);
	});

	test('the first rename blocked (a client runs the exe): a copy with our signature stays in use; any other makes the stdio routes unavailable', async () => {
		for (const signatureOk of [ true, false ]) {
			const env = machine('win32', { signatureOk });
			const rename = env.rename;

			put(env, STABLE, 'OLDER');
			env.rename = (from, to) => {
				if (from.toLowerCase() == STABLE.toLowerCase()) {
					throw Object.assign(new Error('busy'), { code: 'EBUSY' });
				};
				rename(from, to);
			};

			const res = await ensureInstalled(env);

			expect(res).toMatchObject(signatureOk ? { ok: true, path: STABLE, installed: false } : { ok: false, error: { category: 'installFailed' } });
			expect(env.files()[STABLE]).toBe('OLDER');
			expect(env.readDir('C:\\Users\\me\\.anytype\\bin').filter(n => n.endsWith('.tmp'))).toEqual([]);
			// The paths go to PowerShell through the environment, never into the script text
			expect(env.signatureCalls[0].opts.env).toEqual({ ANYTYPE_MCP_OURS: `${WIN_ROOT}\\dist\\anytype-mcp.exe`, ANYTYPE_MCP_COPY: STABLE });
			expect(env.signatureCalls[0].args.join(' ')).not.toContain('Users');
		};
	});

	test('never downgrade on Windows: a higher `.rev` signed by the same signer is left alone', async () => {
		const env = machine('win32', { signatureOk: true });

		put(env, STABLE, 'NEWER');
		put(env, `${STABLE}.rev`, '8\n', 0o644);
		expect(await ensureInstalled(env)).toEqual({ ok: true, path: STABLE, installed: false });
		expect(env.files()[STABLE]).toBe('NEWER');
		expect(await signedByUs(env, STABLE, buildMeta(env))).toBe(true);
	});

	test('death between the two renames: the next start installs afresh', async () => {
		const env = machine('win32');

		// Only the set-aside copy is there
		put(env, 'C:\\Users\\me\\.anytype\\bin\\anytype-mcp.exe.old-0a1b2c3d', 'OLDER');
		expect(await ensureInstalled(env)).toEqual({ ok: true, path: STABLE, installed: true });
		expect(env.readDir('C:\\Users\\me\\.anytype\\bin').sort()).toEqual([ 'anytype-mcp.exe', 'anytype-mcp.exe.rev' ]);
	});
});
