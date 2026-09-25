import { useEffect } from 'react';
import * as I from 'Interface';

/**
 * People the current account already shares a space with — the pool both "create a space with
 * members" and "add members" pick from.
 *
 * Subscribes cross-space to active participants other than me, deduplicates by identity (the same
 * person is a participant object in every space you share), and sorts by how many spaces you share
 * with them, then by whether they have a name, then by name.
 *
 * @param {string} subId - The subscription ID. Must be unique per caller.
 * @param {boolean} enabled - Whether to subscribe at all.
 * @param {string} search - Filters by name or globalName. Empty means no filter.
 * @param {(count: number) => void} [onLoad] - Called once the subscription resolves, with the record count.
 * @returns {any[]} The candidates, deduplicated, sorted and filtered.
 */
const useParticipantCandidates = (subId: string, enabled: boolean, search: string, onLoad?: (count: number) => void): any[] => {

	useEffect(() => {
		if (!enabled) {
			return;
		};

		U.Subscription.subscribe({
			subId,
			keys: U.Subscription.participantRelationKeys(),
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				{ relationKey: 'participantStatus', condition: I.FilterCondition.Equal, value: I.ParticipantStatus.Active },
				{ relationKey: 'identity', condition: I.FilterCondition.NotEqual, value: S.Auth.account?.id },
			],
			ignoreHidden: false,
			noDeps: true,
			crossSpace: true,
		}, () => {
			onLoad?.(S.Record.getRecords(subId).length);
		});

		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, [ enabled ]);

	const list = S.Record.getRecords(subId);
	const spaceCounts = new Map<string, number>();

	list.forEach(it => {
		if (it.identity) {
			spaceCounts.set(it.identity, (spaceCounts.get(it.identity) || 0) + 1);
		};
	});

	const seen = new Set<string>();
	const unique = list.filter(it => {
		if (!it.identity || seen.has(it.identity)) {
			return false;
		};

		seen.add(it.identity);
		return true;
	});

	unique.sort((a, b) => {
		const ca = spaceCounts.get(a.identity) || 0;
		const cb = spaceCounts.get(b.identity) || 0;

		if (ca != cb) {
			return cb - ca;
		};

		const na = a.name ? 1 : 0;
		const nb = b.name ? 1 : 0;

		if (na != nb) {
			return nb - na;
		};

		return U.Data.sortByName(a, b);
	});

	if (!search) {
		return unique;
	};

	const s = search.toLowerCase();

	return unique.filter(it => {
		return it.name?.toLowerCase().includes(s) || it.globalName?.toLowerCase().includes(s);
	});
};

export default useParticipantCandidates;
