/**
 * Z14: the release workflow signs the .mcpb on tag builds only, through Azure Key Vault (scripts/sign-mcpb-azure.js), in
 * a step of its own: no signing key exists in the repository's secrets or on a runner's disk.
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

test('Z14: only tag builds sign the bundle, in a step of their own; on macOS that is the one step with the Azure secrets', () => {
	const AZURE = [ 'AZURE_KEY_VAULT_URI', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_CERT_NAME', 'AZURE_TENANT_ID' ];
	const sign = step('Sign the Claude Desktop bundle');

	expect(step('Build frontend').env.MCPB_SIGN_DEFERRED).toContain(TAG);
	expect(sign.if).toContain(TAG);
	expect(sign.if).toContain("!startsWith(matrix.os, 'ubuntu-')");
	for (const k of AZURE) {
		expect(step('Build frontend').env[k]).toBeUndefined();
		expect(step('Package and publish Mac OS').env[k]).toBeUndefined();
		expect(step('Package and publish Other').env[k]).toContain("startsWith(matrix.os, 'windows-')");
	};
});
