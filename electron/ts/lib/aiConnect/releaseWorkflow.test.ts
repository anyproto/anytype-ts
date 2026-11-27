/**
 * Z14: the release workflow's .mcpb signing steps — tag builds only, the key folder owner-only before a PEM is
 * written (POSIX umask, Windows ACL), removed after the build.
 */
import fs from 'fs';
import path from 'path';
import { expect, test } from 'vitest';
import YAML from 'yaml';

const workflow = YAML.parse(fs.readFileSync(path.resolve(__dirname, '../../../../.github/workflows/build.yml'), 'utf8'));
const steps: any[] = workflow.jobs.release.steps;
const step = (name: string) => steps.find(s => s.name == name);
const TAG = "startsWith(github.ref, 'refs/tags/v')";

test('Z14: on Windows the signing folder gets an owner-only ACL before either PEM is written', () => {
	const prepare = step('Prepare .mcpb signing files');
	const run: string = prepare.run;
	const acl = run.indexOf('icacls "$dir" /inheritance:r /grant:r');
	const firstWrite = run.indexOf('printf');

	expect(prepare.if).toContain(TAG);
	expect(prepare.shell).toBe('bash');
	expect(run).toContain('umask 077');
	expect(run).toContain('if [ "$RUNNER_OS" = "Windows" ]');
	expect(run).toContain('MSYS_NO_PATHCONV=1');
	expect(acl).toBeGreaterThan(run.indexOf('mkdir -p "$dir"'));
	expect(acl).toBeLessThan(firstWrite);
	expect(run).not.toMatch(/echo[^\n]*\$MCPB_(CERT|KEY)_PEM/);
});

test('Z14: only tag builds sign; the files are removed whatever happened', () => {
	const env = step('Build frontend').env;

	for (const k of [ 'MCPB_SIGN_REQUIRED', 'MCPB_SIGN_CERT', 'MCPB_SIGN_KEY', 'MCPB_SIGN_FINGERPRINT' ]) {
		expect(env[k]).toContain(TAG);
	};

	const cleanup = step('Remove .mcpb signing files');

	expect(cleanup.if).toContain('always()');
	expect(cleanup.run).toContain('rm -rf "$RUNNER_TEMP/mcpb-sign"');
	expect(steps.indexOf(cleanup)).toBe(steps.indexOf(step('Build frontend')) + 1);
});
