/**
 * Connect to AI apps: the static app table and its defaults. Pure data, shared by Electron main
 * (relative import) and the renderer, so it uses no path aliases and touches no globals.
 *
 * Next steps, restart ability and target ids are not here: they depend on the platform and
 * the install, so the adapters in main return them.
 */
import type { AiAppCatalogItem, AiAppId, AiTier } from '../../interface/aiConnect';
import { LocalApiPermission, type LinkAppGrant } from '../../interface/linkApproval';

/** Marks where the key goes in plans and manual steps. Never replaced in main. */
export const KEY_PLACEHOLDER = '<KEY>';

/**
 * Default access for a new connection: read and edit, NO spaces yet. The user makes an explicit choice (one space,
 * several, or the "All spaces" checkbox); until then the grant is invalid and Connect / Create key stay disabled.
 */
export const DEFAULT_GRANT: LinkAppGrant = Object.freeze({
	spaceIds: [],
	allSpaces: false,
	perm: LocalApiPermission.ReadWrite,
}) as LinkAppGrant;

export const TIERS: AiTier[] = [ 'small', 'large', 'full' ];

/** Key expiry choices in days; 0 = never */
export const EXPIRY_DAYS = [ 0, 7, 30, 90, 365 ];

export const CATALOG: AiAppCatalogItem[] = [
	{
		id: 'claude-desktop',
		name: 'Claude Desktop',
		aliases: [ 'claude', 'anthropic' ],
		kind: 'app',
		routes: [ 'stdio' ],
		defaultRoute: 'stdio',
		defaultTier: 'full',
		getUrl: 'https://claude.ai/download',
	},
	{
		id: 'claude-code',
		name: 'Claude Code',
		aliases: [ 'claude', 'cc' ],
		kind: 'app',
		// Skill + API is the provisional default until the Route C vs MCP eval
		routes: [ 'skill', 'http' ],
		defaultRoute: 'skill',
		defaultTier: 'full',
		covers: 'aiAppCoversClaudeCode',
		getUrl: 'https://claude.com/product/claude-code',
	},
	{
		id: 'chatgpt',
		name: 'ChatGPT',
		aliases: [ 'openai', 'gpt' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		covers: 'aiAppCoversChatgpt',
		getUrl: 'https://openai.com/chatgpt/download/',
	},
	{
		id: 'codex',
		name: 'Codex',
		aliases: [ 'openai' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		covers: 'aiAppCoversCodex',
		getUrl: 'https://developers.openai.com/codex',
	},
	{
		id: 'cursor',
		name: 'Cursor',
		aliases: [],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		getUrl: 'https://cursor.com/download',
	},
	{
		id: 'vscode',
		name: 'VS Code + GitHub Copilot',
		aliases: [ 'copilot', 'github', 'vs code', 'visual studio code' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		covers: 'aiAppCoversVscode',
		getUrl: 'https://code.visualstudio.com/download',
	},
	{
		id: 'lmstudio',
		name: 'LM Studio',
		aliases: [ 'lm studio', 'local' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'small',
		getUrl: 'https://lmstudio.ai/download',
	},
	{
		id: 'gemini-cli',
		name: 'Gemini CLI',
		aliases: [ 'gemini', 'google' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		getUrl: 'https://github.com/google-gemini/gemini-cli',
	},
	{
		id: 'antigravity',
		name: 'Antigravity',
		aliases: [ 'agy', 'google', 'gemini' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		getUrl: 'https://antigravity.google',
	},
	{
		id: 'opencode',
		name: 'OpenCode',
		aliases: [ 'open code' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		getUrl: 'https://opencode.ai',
	},
	{
		id: 'hermes',
		name: 'Hermes',
		aliases: [ 'hermes agent', 'nous', 'nous research' ],
		kind: 'app',
		routes: [ 'http' ],
		defaultRoute: 'http',
		defaultTier: 'full',
		getUrl: 'https://hermes-agent.nousresearch.com/',
		remoteSetup: true,
	},
	{
		id: 'other',
		name: '',
		nameKey: 'aiAppOther',
		aliases: [ 'mcp', 'custom' ],
		kind: 'manual',
		routes: [ 'http', 'stdio' ],
		defaultRoute: 'http',
		defaultTier: 'full',
	},
	{
		id: 'chatgpt-classic',
		name: 'ChatGPT Classic',
		aliases: [],
		kind: 'unsupported',
		routes: [],
		defaultTier: 'full',
		offer: [ 'chatgpt' ],
	},
	{
		id: 'chatgpt-web',
		name: '',
		nameKey: 'aiAppChatgptWeb',
		aliases: [],
		kind: 'unsupported',
		routes: [],
		defaultTier: 'full',
		offer: [ 'chatgpt' ],
	},
	{
		id: 'claude-web',
		name: '',
		nameKey: 'aiAppClaudeWeb',
		aliases: [],
		kind: 'unsupported',
		routes: [],
		defaultTier: 'full',
		offer: [ 'claude-desktop', 'claude-code' ],
	},
	{
		id: 'gemini',
		name: 'Gemini',
		aliases: [ 'google' ],
		kind: 'unsupported',
		routes: [],
		defaultTier: 'full',
		offer: [ 'gemini-cli', 'antigravity' ],
		// Listed only on a computer with the Gemini app
		onlyInstalled: true,
	},
];

const CATALOG_IDS = CATALOG.map(it => it.id);

export const isCatalogId = (id: unknown): id is AiAppId => (typeof id == 'string') && CATALOG_IDS.includes(id as AiAppId);

export const getCatalogItem = (id: string): AiAppCatalogItem | null => CATALOG.find(it => it.id == id) || null;

/**
 * Case-insensitive match on the card name, id and aliases. `nameOf` lets the renderer pass
 * translated names for the cards that only have a name key. An empty query returns every card.
 */
export const searchCatalog = (query: string, nameOf?: (item: AiAppCatalogItem) => string): AiAppCatalogItem[] => {
	const q = String(query || '').trim().toLowerCase();

	if (!q) {
		return CATALOG.slice();
	};

	return CATALOG.filter(item => {
		const name = nameOf ? nameOf(item) : item.name;
		const fields = [ name, item.id ].concat(item.aliases);

		return fields.some(it => String(it || '').toLowerCase().includes(q));
	});
};

/** The only port validator: an integer in 1–65535. Mirrored in electron/mcp/connect.mjs. */
export const isValidPort = (n: unknown): n is number => (typeof n == 'number') && Number.isInteger(n) && (n >= 1) && (n <= 65535);
