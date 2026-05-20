import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';

import { MenuItemVertical } from 'Component';
import { AutoSizer, CellMeasurer, List, CellMeasurerCache } from 'react-virtualized';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const HEIGHT_ITEM = 28;
const LIMIT_INITIAL = 10;
const LIMIT_RECENT = 32;

interface EmojiEntry {
	id: string;
	searchId: string;
	item: any;
	searchKeywords: string[];
};

let cachedEntries: EmojiEntry[] = null;

const getEntries = (): EmojiEntry[] => {
	if (!cachedEntries) {
		cachedEntries = [];
		for (const id in J.Emoji.emojis) {
			const item = J.Emoji.emojis[id];

			cachedEntries.push({
				id,
				searchId: id.toLowerCase(),
				item,
				searchKeywords: (item.keywords || []).map((k: string) => k.toLowerCase()),
			});
		};
	};
	return cachedEntries;
};

const MenuBlockEmoji = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, position } = props;
	const { data } = param;
	const { onChange } = data;
	const { filterText } = S.Common;
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT_ITEM }));
	const listRef = useRef(null);
	const n = useRef(0);

	useEffect(() => {
		rebind();
		position();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		position();

		const items = getItems();
		if (filterText && !items.length) {
			close();
		};
	});

	const keydownHandler = useRef(null);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => props.onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		window.setTimeout(() => props.setActive(), 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const getItems = () => {
		const raw = S.Common.filterText;

		if (!raw) {
			return getInitial();
		};

		const filter = raw.replace(/:$/, '');
		if (!filter) {
			return getInitial();
		};

		const f = filter.toLowerCase();
		const entries = getEntries();
		const exact: any[] = [];
		const startsWith: any[] = [];
		const contains: any[] = [];
		const seen = new Set<string>();

		const addResult = (id: string, item: any) => {
			if (seen.has(id)) {
				return;
			};

			seen.add(id);
			const entry = makeItem(id, item);
			const lower = id.toLowerCase();

			if (lower == f) {
				exact.push(entry);
			} else
			if (lower.startsWith(f)) {
				startsWith.push(entry);
			} else {
				contains.push(entry);
			};
		};

		for (const entry of entries) {
			if (entry.searchId.includes(f) || entry.searchKeywords.some(k => k.includes(f))) {
				addResult(entry.id, entry.item);
			};
		};

		for (const alias in J.Emoji.aliases) {
			if (alias.toLowerCase().includes(f)) {
				const emojiId = J.Emoji.aliases[alias];
				const item = J.Emoji.emojis[emojiId];
				if (item) {
					addResult(emojiId, item);
				};
			};
		};

		return [].concat(exact, startsWith, contains);
	};

	const getInitial = () => {
		const storage = Storage.get('smile') || {};
		const recent = storage.recent || [];
		const skin = Number(storage.skin) || 1;
		const seen = new Set<string>();
		const results: any[] = [];

		for (const it of recent) {
			if (results.length >= LIMIT_INITIAL) {
				break;
			};

			const item = J.Emoji.emojis[it.id];
			if (item && !seen.has(it.id)) {
				results.push(makeItem(it.id, item, it.skin || skin));
				seen.add(it.id);
			};
		};

		if (results.length < LIMIT_INITIAL) {
			const categories = J.Emoji.categories || [];
			for (const cat of categories) {
				if (results.length >= LIMIT_INITIAL) {
					break;
				};

				for (const emojiId of (cat.emojis || [])) {
					if (results.length >= LIMIT_INITIAL) {
						break;
					};

					if (!seen.has(emojiId)) {
						const item = J.Emoji.emojis[emojiId];
						if (item) {
							results.push(makeItem(emojiId, item));
							seen.add(emojiId);
						};
					};
				};
			};
		};

		return results;
	};

	const makeItem = (id: string, item: any, skin?: number) => {
		const s = skin || Number(Storage.get('smile')?.skin) || 1;
		const native = U.Smile.nativeById(id, s);

		return {
			id,
			name: id,
			iconEmoji: native,
			native,
			skin: s,
		};
	};

	const setLastIds = (id: string, skin: number) => {
		if (!id) {
			return;
		};

		const storage = Storage.get('smile') || {};
		let ids = storage.recent || [];

		ids = ids.map((it: any) => {
			it.key = [ it.id, it.skin ].join(',');
			return it;
		});

		ids.unshift({ id, skin, key: [ id, skin ].join(',') });

		ids = U.Common.arrayUniqueObjects(ids, 'key');
		ids = ids.slice(0, LIMIT_RECENT);
		ids = ids.map((it: any) => {
			delete(it.key);
			return it;
		});

		Storage.set('smile', { ...storage, recent: ids });
	};

	const highlightMatch = (text: string, filter: string) => {
		if (!filter) {
			return text;
		};

		const f = filter.replace(/:$/, '').toLowerCase();
		if (!f) {
			return text;
		};

		const lower = text.toLowerCase();
		const idx = lower.indexOf(f);

		if (idx < 0) {
			return text;
		};

		return (
			<>
				{text.substring(0, idx)}
				<mark>{text.substring(idx, idx + f.length)}</mark>
				{text.substring(idx + f.length)}
			</>
		);
	};

	const onOver = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			props.setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		const { from } = S.Common.filter;
		const to = from + 1;

		let marks = U.Common.objectCopy(data.marks || []);
		marks = Mark.adjust(marks, from, 1);
		marks = Mark.toggle(marks, {
			type: I.MarkType.Emoji,
			param: item.native,
			range: { from, to },
		});

		setLastIds(item.id, item.skin);
		onChange(item.native, marks, from, to);
		close();
	};

	const beforePosition = () => {
		const items = getItems();

		let height = 16;
		if (items.length) {
			height = items.reduce((res: number) => res + HEIGHT_ITEM, height);
		};

		U.Dom.css(U.Dom.select('.content', props.getContainer()), { height: `${height}px` });
	};

	const items = getItems();

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		if (!item) {
			return null;
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<MenuItemVertical
					id={item.id}
					object={{ iconEmoji: item.iconEmoji }}
					name={highlightMatch(item.name, filterText)}
					onMouseEnter={e => onOver(e, item)}
					onClick={e => onClick(e, item)}
					style={param.style}
				/>
			</CellMeasurer>
		);
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		onClick,
		onOver,
		beforePosition,
	}), []);

	return (
		<>
			{items.length ? (
				<div className="items">
					<AutoSizer className="scrollArea">
						{({ width, height }) => (
							<List
								ref={listRef}
								width={width}
								height={height}
								deferredMeasurementCache={cache.current}
								rowCount={items.length}
								rowHeight={HEIGHT_ITEM}
								rowRenderer={rowRenderer}
								overscanRowCount={10}
								scrollToAlignment="center"
							/>
						)}
					</AutoSizer>
				</div>
			) : ''}
		</>
	);

});

export default MenuBlockEmoji;
