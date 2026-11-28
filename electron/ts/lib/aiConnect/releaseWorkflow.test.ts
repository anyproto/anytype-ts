/**
 * Z14: the release workflow signs the .mcpb on tag builds only, through Azure Key Vault (scripts/sign-mcpb-azure.js):
 * no signing key exists in the repository's secrets or on a runner's disk.
 */
import fs from 'fs';
import path from 'path';
import { expect, test } from 'vitest';
import YAML from 'yaml';

const text = fs.readFileSync(path.resolve(__dirname, '../../../../.github/workflows/build.yml'), 'utf8');
const workflow = YAML.parse(text);
const steps: any[] = workflow.jobs.release.steps;
const step = (name: string) => steps.find(s => s.name == name);
const TAG = "startsWith(github.ref, 'refs/tags/v')";

test('Z14: no .mcpb key is written anywhere: no PEM step, no MCPB_SIGN_* secret, no key file', () => {
	expect(step('Prepare .mcpb signing files')).toBeUndefined();
	expect(step('Remove .mcpb signing files')).toBeUndefined();
	expect(text).not.toMatch(/MCPB_SIGN_(CERT|KEY|FINGERPRINT)|mcpb-sign\/|MCPB_(CERT|KEY)_PEM/);
});

test('Z14: only tag builds sign the bundle; on macOS the Azure secrets reach "Build frontend" on tag builds only', () => {
	const env = step('Build frontend').env;

	expect(env.MCPB_SIGN_REQUIRED).toContain(TAG);
	for (const k of [ 'AZURE_KEY_VAULT_URI', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_CERT_NAME', 'AZURE_TENANT_ID' ]) {
		expect(env[k]).toContain(`(startsWith(matrix.os, 'macos-') && ${TAG})`);
		expect(env[k]).not.toContain('ubuntu');
	};
	expect(step('Package and publish Mac OS').env.AZURE_CLIENT_SECRET).toBeUndefined();
});
