/**
 * Pure matchers and query policy behind the global search popup's local
 * (in-memory) lookups: name matching for Channels and people, the injected
 * person-row limit, and the "/" command-mode parsing.
 *
 * They live outside the component so they can be unit-tested: the popup itself
 * pulls in the whole store/component graph, while these rules are the part
 * that actually carries behaviour worth pinning down.
 */

/**
 * Channels whose name contains `text`, case-insensitively, in the order they
 * were given (the vault sidebar's own order). Entries without a targetSpaceId
 * are dropped - a Channel row is addressed by the space it points at, never by
 * the spaceview's own id.
 *
 * An empty query matches nothing: Channel rows lead the global result list, and
 * a query-less browse must stay the recent-objects list it already is.
 */
const matchSpaces = (items: any[], text: string, limit: number): any[] => {
	const t = String(text || '').trim().toLowerCase();

	if (!t) {
		return [];
	};

	const ret = (items || []).filter(it => it && it.targetSpaceId && String(it.name || '').toLowerCase().includes(t));

	return (limit > 0) ? ret.slice(0, limit) : ret;
};

/**
 * People whose name contains `text`, plus yourself when the query is a prefix of
 * the "me" alias the "/" list teaches ("/by me"). Without the alias arm, "me"
 * only ever resolved to people whose name happens to contain those letters, and
 * the syntax the list advertises silently found nothing.
 *
 * A self match by alias sorts first - the word names you, so you are the answer,
 * not a same-spelled bystander.
 */
const matchPeople = (list: any[], text: string, param: { selfIdentity?: string; meAlias?: string; getIdentity?: (item: any) => string }): any[] => {
	const t = String(text || '').trim().toLowerCase();

	if (!t) {
		return [ ...(list || []) ];
	};

	const { selfIdentity = '', meAlias = '', getIdentity = null } = param || {};
	const alias = String(meAlias || '').trim().toLowerCase();
	const identity = (it: any) => (getIdentity ? getIdentity(it) : (it.identity || ''));
	const isSelf = (it: any) => Boolean(selfIdentity) && (identity(it) == selfIdentity);
	// Prefix, not substring: "me" must name you, but a longer query that merely
	// starts the same way ("mel") is a search for someone called Mel
	const isAlias = Boolean(alias) && alias.startsWith(t);

	const ret: any[] = [];
	const byName: any[] = [];

	(list || []).forEach(it => {
		if (!it) {
			return;
		};

		const named = [ it.name, it.globalName ].some(n => String(n || '').toLowerCase().includes(t));

		if (isAlias && isSelf(it)) {
			ret.push(it);
		} else
		if (named) {
			byName.push(it);
		};
	});

	return ret.concat(byName);
};

/**
 * How many person rows the global result list injects for a query: a short query
 * matches half the vault, so keep it to a taste; three letters can usually name a
 * person - show the full hand.
 */
const PEOPLE_MATCH_LIMIT_SHORT = 3;
const PEOPLE_MATCH_LIMIT_FULL = 10;
const PEOPLE_MATCH_FULL_LENGTH = 3;

const peopleMatchLimit = (text: string): number => {
	const t = String(text || '').trim();

	return (t.length >= PEOPLE_MATCH_FULL_LENGTH) ? PEOPLE_MATCH_LIMIT_FULL : PEOPLE_MATCH_LIMIT_SHORT;
};

/**
 * Split the search input into its query and "/" command parts. Command mode is a
 * '/' at the very start, or one typed after whitespace mid-query - the footer
 * advertises "Refine search" regardless of what is already typed, so "anton /in"
 * must work like "/in" with the query kept. A slash inside a word ("1/2", URLs)
 * never triggers; the last whitespace-preceded slash wins. Returns null while no
 * command is active.
 */
const parseCommandQuery = (v: string): { query: string; command: string } | null => {
	const s = String(v || '');

	if (s.startsWith('/')) {
		return { query: '', command: s.substring(1) };
	};

	const m = s.match(/^([\s\S]*\s)\/([\s\S]*)$/);

	return m ? { query: m[1], command: m[2] } : null;
};

export { matchSpaces, matchPeople, peopleMatchLimit, parseCommandQuery };
