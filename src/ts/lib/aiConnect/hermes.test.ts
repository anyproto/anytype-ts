import { describe, expect, test } from 'vitest';
import { HERMES_AGENT_PROMPT, HERMES_CHECK, HERMES_CLI_INSTALL, HERMES_GATEWAY_STEPS, HERMES_GATEWAY_URL, HERMES_PLUGIN, HERMES_PROFILE_CREATE, HERMES_SETUP } from './hermes';

const commands = (): string[] => HERMES_GATEWAY_STEPS.map(s => s.snippet).filter(Boolean).join('\n').split('\n').filter(l => /^hermes\b/.test(l));

describe('Hermes guides: the copied texts are exact', () => {
	test('H5: the gateway runs in a dedicated Hermes profile, also in the agent prompt', () => {
		const list = commands();

		expect(list.length).toBeGreaterThan(4);
		for (const line of list.filter(l => !l.startsWith('hermes profile create'))) {
			expect(line).toMatch(/^hermes -p anytype /);
		};
		expect(HERMES_PROFILE_CREATE).toBe('hermes profile create anytype --no-alias\nhermes -p anytype setup');
		expect(HERMES_AGENT_PROMPT).not.toContain('current Hermes profile');
		expect(HERMES_AGENT_PROMPT).toContain('Use a dedicated Hermes profile named anytype (create it if it doesn\'t exist), not my personal one.');
	});

	test('H6: the CLI installer runs from a private temp folder and only after a successful download', () => {
		expect(HERMES_CLI_INSTALL).toBe([
			'd="$(mktemp -d)" && curl -fsSL https://raw.githubusercontent.com/anyproto/anytype-cli/v0.5.0/install.sh -o "$d/install.sh" && bash "$d/install.sh"',
			'export PATH="$HOME/.local/bin:$PATH"',
		].join('\n'));
		expect(HERMES_CLI_INSTALL).not.toContain('/tmp/');
	});

	test('H14: the wizard gets INSTALL.md\'s input; every interactive command ends its own block', () => {
		expect(HERMES_SETUP).toContain('--input anytype-setup.json');
		expect(HERMES_SETUP).toContain('"credential_backend": "private_file"');
		expect(HERMES_GATEWAY_STEPS.map(s => [ s.textKey, s.snippet ])).toEqual([
			[ 'aiConnectHermesStepInvite', undefined ],
			[ 'aiConnectHermesStepProfile', HERMES_PROFILE_CREATE ],
			[ 'aiConnectHermesStepCli', HERMES_CLI_INSTALL ],
			[ 'aiConnectHermesStepPlugin', HERMES_PLUGIN ],
			[ 'aiConnectHermesStepSetup', HERMES_SETUP ],
			[ 'aiConnectHermesStepRun', HERMES_CHECK ],
		]);

		const interactive = [ /hermes -p anytype setup$/, /plugins install/, /anytype setup --mode cli/ ];

		for (const step of HERMES_GATEWAY_STEPS.filter(s => s.snippet)) {
			const lines = step.snippet.split('\n');

			// An interactive command is only ever the last line of its block
			lines.slice(0, -1).forEach(l => expect(interactive.some(re => re.test(l))).toBe(false));
			expect(/anytype setup --mode cli/.test(step.snippet) && /gateway run/.test(step.snippet)).toBe(false);
		};
		expect(HERMES_GATEWAY_URL).toBe('https://github.com/anyproto/anytype-hermes');
	});
});
