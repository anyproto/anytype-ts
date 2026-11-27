/**
 * Electron main is bundled by esbuild (scripts/build-electron.js). The config libraries must survive
 * that bundling: jsonc-parser's UMD build doesn't (it requires './impl/…' at runtime), so jsonFile.ts
 * imports its ESM build. This builds the two modules the way main is built and runs the result.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { tempDir } from './testEnv';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..', '..', '..', '..');

let dir = '';

beforeEach(() => {
	dir = tempDir('aic-bundle-');
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

test('jsonFile and tomlFile work after esbuild bundling', async () => {
	const entry = path.join(dir, 'entry.ts');
	const out = path.join(dir, 'out.js');

	fs.writeFileSync(entry, [
		`import { setJsonPath, removeJsonPath } from ${JSON.stringify(path.join(__dirname, 'jsonFile'))};`,
		`import { setTomlTable } from ${JSON.stringify(path.join(__dirname, 'tomlFile'))};`,
		`const a = setJsonPath('{}', [ 'mcpServers', 'anytype' ], { url: 'x' });`,
		`const b = removeJsonPath(a.ok ? a.text : '', [ 'mcpServers', 'anytype' ]);`,
		`const c = setTomlTable('', 'mcp_servers.anytype', 'url = "x"');`,
		`process.stdout.write(JSON.stringify([ a, b, c ]));`,
	].join('\n'));

	await esbuild.build({
		entryPoints: [ entry ],
		bundle: true,
		platform: 'node',
		target: 'node24',
		format: 'cjs',
		outfile: out,
		tsconfig: path.join(ROOT, 'tsconfig.electron.json'),
		logLevel: 'silent',
	});

	const [ a, b, c ] = JSON.parse(execFileSync(process.execPath, [ out ], { cwd: dir, encoding: 'utf8' }));

	expect(a.ok && JSON.parse(a.text)).toEqual({ mcpServers: { anytype: { url: 'x' } } });
	expect(b.ok && JSON.parse(b.text)).toEqual({ mcpServers: {} });
	expect(c).toEqual({ ok: true, text: '[mcp_servers.anytype]\nurl = "x"\n' });
});
