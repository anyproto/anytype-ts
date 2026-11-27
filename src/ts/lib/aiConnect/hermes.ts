/**
 * Hermes: the copy-only guides of its card. "Chat with Hermes in Anytype" (the anytype-hermes gateway, its own
 * bot account in its own Hermes profile `anytype`) and "Hermes on another machine". Nothing here is written
 * anywhere; the commands follow the gateway's docs/INSTALL.md (named profile, private_file credentials).
 *
 * Every interactive command (Hermes' setup, the plugin's source review, the gateway wizard) ends its own block,
 * so pasting a block never feeds the next commands to a prompt.
 */

export const HERMES_GATEWAY_URL = 'https://github.com/anyproto/anytype-hermes';

/** The bot's own Hermes profile: never the one with the user's personal Anytype connection */
export const HERMES_PROFILE_CREATE = [
	'hermes profile create anytype --no-alias',
	'hermes -p anytype setup',
].join('\n');

/** Anytype CLI, pinned the way INSTALL.md pins it, downloaded into a private temp folder; stops when the download fails */
export const HERMES_CLI_INSTALL = [
	'd="$(mktemp -d)" && curl -fsSL https://raw.githubusercontent.com/anyproto/anytype-cli/v0.5.0/install.sh -o "$d/install.sh" && bash "$d/install.sh"',
	'export PATH="$HOME/.local/bin:$PATH"',
].join('\n');

export const HERMES_PLUGIN = 'hermes -p anytype plugins install anyproto/anytype-hermes --enable';

/** The wizard with INSTALL.md's input (credentials in a private file: works on a server without a keyring) */
export const HERMES_SETUP = [
	'cat > anytype-setup.json <<\'JSON\'',
	'{"schema_version": 1, "cli": {"credential_backend": "private_file"}}',
	'JSON',
	'hermes -p anytype anytype setup --mode cli --input anytype-setup.json',
].join('\n');

export const HERMES_CHECK = [
	'hermes -p anytype anytype doctor --json',
	'hermes -p anytype gateway run',
].join('\n');

/** The README's agent-assisted setup prompt, with the dedicated profile instead of "my current Hermes profile" */
export const HERMES_AGENT_PROMPT = [
	'Help me install and set up https://github.com/anyproto/anytype-hermes.',
	'Read docs/INSTALL.md and follow its agent-assisted setup instructions.',
	'Use a dedicated Hermes profile named anytype (create it if it doesn\'t exist), not my personal one. Guide me through',
	'the Anytype client, bot account/name, space invitation and sender access.',
	'Preserve existing settings, follow installer review prompts, and keep',
	'credentials out of chat and logs. Verify the saved connection with doctor',
	'and guide me through a real mention test.',
].join('\n');

export interface HermesGuideStep {
	/** Text key */
	textKey: string;
	/** Copied as is */
	snippet?: string;
};

/** The setup, here or on another machine (macOS or Linux); the bot is invited through Anytype's own Share flow */
export const HERMES_GATEWAY_STEPS: HermesGuideStep[] = [
	{ textKey: 'aiConnectHermesStepInvite' },
	{ textKey: 'aiConnectHermesStepProfile', snippet: HERMES_PROFILE_CREATE },
	{ textKey: 'aiConnectHermesStepCli', snippet: HERMES_CLI_INSTALL },
	{ textKey: 'aiConnectHermesStepPlugin', snippet: HERMES_PLUGIN },
	{ textKey: 'aiConnectHermesStepSetup', snippet: HERMES_SETUP },
	{ textKey: 'aiConnectHermesStepRun', snippet: HERMES_CHECK },
];
