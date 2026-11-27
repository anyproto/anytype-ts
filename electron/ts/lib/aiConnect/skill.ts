/**
 * The installed `anytype-api` skill: heart's SKILL.md, untouched, with Anytype's block inserted right
 * after the YAML frontmatter. The markers tell an Anytype-written file from the user's own.
 */
import type { Env } from './types';
import { pathOf } from './fsSafe';
import { mcpDir } from './bundle';

export const MARKER_BEGIN = '<!-- anytype-desktop:begin -->';
export const MARKER_END = '<!-- anytype-desktop:end -->';

/** The frontmatter block (`---` … `---` plus its line break) and the rest, or null */
export const splitFrontmatter = (text: string): { frontmatter: string; body: string } | null => {
	const m = /^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/.exec(String(text || ''));

	if (!m) {
		return null;
	};
	return { frontmatter: m[0], body: text.slice(m[0].length) };
};

/** frontmatter + preamble + body; null when the vendored file has no frontmatter or the preamble no markers */
export const build = (vendored: string, preamble: string): string | null => {
	const parts = splitFrontmatter(vendored);
	const block = String(preamble || '').trim();

	if (!parts || !block.startsWith(MARKER_BEGIN) || !block.endsWith(MARKER_END)) {
		return null;
	};

	const eol = parts.frontmatter.endsWith('\r\n') ? '\r\n' : '\n';
	const frontmatter = parts.frontmatter.endsWith('\n') ? parts.frontmatter : parts.frontmatter + eol;

	return frontmatter + eol + block + eol + parts.body;
};

/** Written by Anytype: has the begin marker */
export const hasMarker = (text: string | null): boolean => !!text && text.includes(MARKER_BEGIN);

/** The skill as this build ships it, from dist/mcp/skill */
export const buildFromDist = (env: Env): string | null => {
	const P = pathOf(env);
	const dir = P.join(mcpDir(env), 'skill');
	const vendored = env.readText(P.join(dir, 'SKILL.md'));
	const preamble = env.readText(P.join(dir, 'PREAMBLE.md'));

	return ((vendored !== null) && (preamble !== null)) ? build(vendored, preamble) : null;
};
