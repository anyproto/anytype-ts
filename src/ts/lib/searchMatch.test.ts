import { describe, it, expect } from 'vitest';
import { matchSpaces, matchPeople } from './searchMatch';

/**
 * JS-9863.
 *
 * matchSpaces backs the Channel rows that lead the global result list (and the
 * Channels chip's browse); matchPeople backs "/by <person>", where typing the
 * advertised "me" used to find nothing.
 */
describe('matchSpaces', () => {

	const items = [
		{ targetSpaceId: 's1', name: 'Personal' },
		{ targetSpaceId: 's2', name: 'Personal notes' },
		{ targetSpaceId: 's3', name: 'My personal archive' },
		{ targetSpaceId: 's4', name: 'Work' },
	];

	it('matches a name substring case-insensitively', () => {
		expect(matchSpaces(items, 'personal', 10).map(it => it.targetSpaceId)).toEqual([ 's1', 's2', 's3' ]);
		expect(matchSpaces(items, 'PERSONAL', 10).map(it => it.targetSpaceId)).toEqual([ 's1', 's2', 's3' ]);
	});

	it('matches mid-name, not just prefixes', () => {
		expect(matchSpaces(items, 'notes', 10).map(it => it.targetSpaceId)).toEqual([ 's2' ]);
	});

	it('keeps the given (vault) order', () => {
		const reversed = [ ...items ].reverse();
		expect(matchSpaces(reversed, 'personal', 10).map(it => it.targetSpaceId)).toEqual([ 's3', 's2', 's1' ]);
	});

	it('caps the result at the limit', () => {
		expect(matchSpaces(items, 'personal', 2).map(it => it.targetSpaceId)).toEqual([ 's1', 's2' ]);
	});

	it('returns nothing for an empty or blank query', () => {
		expect(matchSpaces(items, '', 3)).toEqual([]);
		expect(matchSpaces(items, '   ', 3)).toEqual([]);
	});

	it('trims the query', () => {
		expect(matchSpaces(items, '  work  ', 3).map(it => it.targetSpaceId)).toEqual([ 's4' ]);
	});

	it('drops entries without a targetSpaceId', () => {
		const list = [ { name: 'Personal' }, { targetSpaceId: 's1', name: 'Personal' } ];
		expect(matchSpaces(list, 'personal', 3).map(it => it.targetSpaceId)).toEqual([ 's1' ]);
	});

	it('survives empty and missing input', () => {
		expect(matchSpaces([], 'x', 3)).toEqual([]);
		expect(matchSpaces(null, 'x', 3)).toEqual([]);
	});

	it('does not cap when the limit is zero or negative', () => {
		expect(matchSpaces(items, 'personal', 0)).toHaveLength(3);
	});

});

describe('matchPeople', () => {

	const me = { id: 'p-me', identity: 'acc-me', name: 'Roman' };
	const mel = { id: 'p-mel', identity: 'acc-mel', name: 'Mel' };
	const kay = { id: 'p-kay', identity: 'acc-kay', name: 'Kay', globalName: 'kay.any' };
	const list = [ mel, kay, me ];
	const param = { selfIdentity: 'acc-me', meAlias: 'me' };

	it('resolves the "me" alias to yourself even when your name does not contain it', () => {
		expect(matchPeople(list, 'me', param).map(it => it.id)).toContain('p-me');
	});

	it('puts the self alias match first, ahead of same-spelled names', () => {
		expect(matchPeople(list, 'me', param).map(it => it.id)).toEqual([ 'p-me', 'p-mel' ]);
	});

	it('stops treating the query as the alias once it diverges', () => {
		expect(matchPeople(list, 'mel', param).map(it => it.id)).toEqual([ 'p-mel' ]);
	});

	it('matches by name substring, case-insensitively', () => {
		expect(matchPeople(list, 'KAY', param).map(it => it.id)).toEqual([ 'p-kay' ]);
	});

	it('matches by globalName', () => {
		expect(matchPeople(list, 'kay.any', param).map(it => it.id)).toEqual([ 'p-kay' ]);
	});

	it('still finds yourself by your real name', () => {
		expect(matchPeople(list, 'roman', param).map(it => it.id)).toEqual([ 'p-me' ]);
	});

	it('returns the whole list for an empty query', () => {
		expect(matchPeople(list, '', param).map(it => it.id)).toEqual([ 'p-mel', 'p-kay', 'p-me' ]);
	});

	it('never lists the same person twice', () => {
		const self = { id: 'p-me', identity: 'acc-me', name: 'Melanie' };
		expect(matchPeople([ self ], 'me', param).map(it => it.id)).toEqual([ 'p-me' ]);
	});

	it('resolves the identity through getIdentity when the object has none', () => {
		const bare = { id: 'acc-me_p', name: 'Roman' };
		const withResolver = { ...param, getIdentity: (it: any) => String(it.id).split('_')[0] };

		expect(matchPeople([ bare ], 'me', withResolver).map(it => it.id)).toEqual([ 'acc-me_p' ]);
	});

	it('falls back to name matching when there is no self or alias', () => {
		expect(matchPeople(list, 'me', {}).map(it => it.id)).toEqual([ 'p-mel' ]);
	});

	it('survives empty and missing input', () => {
		expect(matchPeople([], 'me', param)).toEqual([]);
		expect(matchPeople(null, 'me', param)).toEqual([]);
	});

});
