/**
 * Pure matchers behind the global search popup's local (in-memory) lookups.
 *
 * Both live outside the component so they can be unit-tested: the popup itself
 * pulls in the whole store/component graph, while the matching rules are the
 * part that actually carries behaviour worth pinning down.
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

export { matchSpaces, matchPeople };
