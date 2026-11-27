/**
 * The bundled marks of the AI app cards (renderer only). One entry per card: the file's base name in
 * `src/img/icon/aiApp`; a monochrome mark has a dark variant of the same name in `src/img/theme/dark/icon/aiApp`.
 * Sources and licenses: `src/img/icon/aiApp/NOTICE.md`. Removing a vendor = its entries here, its files and its NOTICE lines.
 */
import type { AiAppId } from '../../interface/aiConnect';

export const AI_APP_ICONS: Record<AiAppId, string> = {
	'gemini-cli': 'geminiCli',
	'antigravity': 'antigravity',
	'opencode': 'opencode',
	'hermes': 'hermes',
	'gemini': 'gemini',
	'claude-desktop': 'claude',
	'claude-web': 'claude',
	'claude-code': 'claudeCode',
	'chatgpt': 'openai',
	'chatgpt-classic': 'openai',
	'chatgpt-web': 'openai',
	'codex': 'codex',
	'cursor': 'cursor',
	'vscode': 'copilot',
	'lmstudio': 'lmstudio',
	'other': 'mcp',
};

const ROOT = '../../../img/';
const FILES = import.meta.glob([ '../../../img/icon/aiApp/*.svg', '../../../img/theme/dark/icon/aiApp/*.svg' ], {
	eager: true,
	query: '?url',
	import: 'default',
}) as Record<string, string>;

/** A card's mark file name, or '' for an unknown card */
export const aiAppIconFile = (appId: string): string => (Object.prototype.hasOwnProperty.call(AI_APP_ICONS, appId) ? AI_APP_ICONS[appId] : '');

/** A card's bundled file for the theme path (`S.Common.getThemePath()`), relative to `src/img`: its variant there, else the default; '' for an unknown card */
export const aiAppIconPath = (appId: string, themePath: string): string => {
	const file = aiAppIconFile(appId);

	if (!file) {
		return '';
	};
	return [ `${themePath || ''}icon/aiApp/${file}.svg`, `icon/aiApp/${file}.svg` ].find(it => FILES[`${ROOT}${it}`]) || '';
};

/** The URL of a card's mark for the theme path, '' for an unknown card */
export const aiAppIconUrl = (appId: string, themePath: string): string => {
	const file = aiAppIconPath(appId, themePath);
	return file ? FILES[`${ROOT}${file}`] : '';
};
