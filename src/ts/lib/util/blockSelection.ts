/**
 * Reduces a list of block ids to the topmost ones: any id that already has an ancestor
 * in the list is dropped, because structural operations (indent/outdent, move) carry
 * children along with their parent — passing both would move the child twice.
 *
 * This is the same normalisation the selection provider applies to a block selection
 * (see `get(I.SelectType.Block, false)`), extracted as pure logic so the cross-block
 * text selection, whose id list is a raw document-order slice, can reuse it.
 *
 * @param ids block ids in document order
 * @param parentOf resolves the parent id of a block, empty string when there is none
 * @returns deduplicated topmost ids, input order preserved
 */
export const getTopLevelIds = (ids: string[], parentOf: (id: string) => string): string[] => {
	const list = [ ...new Set((ids || []).filter(it => it)) ];
	const set = new Set(list);

	return list.filter(id => {
		const visited = new Set([ id ]);

		let cur = parentOf(id);

		while (cur && !visited.has(cur)) {
			if (set.has(cur)) {
				return false;
			};

			visited.add(cur);
			cur = parentOf(cur);
		};

		return true;
	});
};

/**
 * Resolves the block an indent (Tab) should nest the selection under: the previous sibling
 * inside the same parent, and nothing else.
 *
 * A first child has no previous sibling, so indenting it is not a valid operation and must
 * be a no-op. Resolving it to the previous block in document order instead (JS-9844) yields
 * the parent the blocks already live in, and moving them Inner to it re-appends them at the
 * end of its child list — a silent reorder rather than an indent.
 *
 * Only meaningful for indent. Outdent targets the parent and never consults this.
 *
 * @param childrenIds the parent's child ids, in order
 * @param id id of the first selected block
 * @returns id of the previous sibling, or an empty string when there is none
 */
export const getIndentTargetId = (childrenIds: string[], id: string): string => {
	const list = childrenIds || [];
	const idx = list.indexOf(id);

	return idx > 0 ? String(list[idx - 1] || '') : '';
};
