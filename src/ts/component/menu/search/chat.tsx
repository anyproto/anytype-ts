import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, IconObject, ObjectName, EmptySearch, Icon } from 'Component';
import { I, C, S, U, J, keyboard, translate, analytics } from 'Lib';

const LIMIT = 16;
const HEIGHT = 56;

interface ChatSearchResult {
	id?: string;
	chatId: string;
	messageId: string;
	score: number;
	highlight: string;
	highlightRanges: I.TextRange[];
	message: I.ChatMessage;
};

const MenuSearchChat = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive, getId, close, storageGet, storageSet } = props;
	const { data } = param;
	const { chatId, route, scrollToMessage } = data;
	const { showRelativeDates, dateFormat, space } = S.Common;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ currentIndex, setCurrentIndex ] = useState(-1);
	const [ dummy, setDummy ] = useState(0);
	const [ isDropdownOpen, setIsDropdownOpen ] = useState(true);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const timeout = useRef(0);
	const itemsRef = useRef<ChatSearchResult[]>([]);
	const n = useRef(0);
	const offset = useRef(0);
	const filter = useRef('');
	const cnu = [ 'arrow', 'up' ];
	const cnd = [ 'arrow', 'down' ];

	useEffect(() => {
		rebind();
		focus();
		beforePosition();

		analytics.event('ScreenChatSearch', { route });

		analytics.event('ScreenChatSearch', { route });

		return () => {
			window.clearTimeout(timeout.current);
			storageSet?.({ filter: '', currentIndex: -1, chatId: '' });
		};
	}, []);

	useEffect(() => {
		rebind();
		beforePosition();
	});

	const focus = () => {
		window.setTimeout(() => filterRef.current?.focus(), 15);
	};

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getItems = () => {
		return [].concat(itemsRef.current).map(it => ({ ...it, id: it.messageId }));
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		return new Promise((resolve, reject) => {
			offset.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const reload = () => {
		n.current = 0;
		offset.current = 0;
		setCurrentIndex(-1);
		setIsDropdownOpen(true);
		load(true);
	};

	const load = (clear: boolean, callBack?: (message: any) => void) => {
		if (isLoading) {
			return;
		};

		const text = filter.current;
		const sorts = [
			{ key: I.SearchSortKey.CreatedAt, type: I.SortType.Desc },
		];

		if (!text) {
			itemsRef.current = [];
			setDummy(prev => prev + 1);
			callBack?.({});
			return;
		};

		if (clear) {
			setIsLoading(true);
		};

		C.ChatSearch(space, chatId, text, offset.current, J.Constant.limit.menuRecords, sorts, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				callBack?.(message);
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.list);

			// Only reset index for new searches, not when restoring state
			if (clear && itemsRef.current.length > 0 && !callBack) {
				setCurrentIndex(0);
				saveState(text, 0);
			};

			setDummy(prev => prev + 1);
			callBack?.(message);
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		const items = getItems();
		const index = items.findIndex(it => it.id === item.id);
		if (index >= 0) {
			saveState(filter.current, index);
		};

		analytics.event('ClickChatSearchResult');

		scrollToMessage?.(item.id);
		close();
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			filter.current = filterRef.current?.getValue() || '';
			saveState(filter.current, -1);
			reload();

			if (filter.current) {
				analytics.event('ChatSearchInput');
			};
		}, J.Constant.delay.keyboard);
	};

	const onArrow = (dir: number) => {
		const items = getItems();
		if (!items.length) {
			return;
		};

		// Close dropdown when navigation buttons are clicked
		if (isDropdownOpen) {
			setIsDropdownOpen(false);
		};

		const newIndex = currentIndex + dir;
		if (newIndex < 0 || newIndex >= items.length) {
			return;
		};

		setCurrentIndex(newIndex);
		saveState(filter.current, newIndex);

		analytics.event('ClickChatSearchNavigation', { type: dir > 0 ? 'Up' : 'Down' });

		const item = items[newIndex];
		if (item) {
			setActive(item, true);
			scrollToMessage?.(item.id);
		};
	};

	const saveState = (filterValue: string, index: number) => {
		storageSet?.({ filter: filterValue, currentIndex: index, chatId });
	};

	const restoreState = () => {
		const storage = storageGet?.() || {};
		const { filter: savedFilter, currentIndex: savedIndex, chatId: savedChatId } = storage;

		// Clear state if switching to a different chat
		if (savedChatId && savedChatId !== chatId) {
			storageSet?.({ filter: '', currentIndex: -1, chatId });
			return;
		};

		if (savedFilter) {
			filter.current = savedFilter;
			filterRef.current?.setValue(savedFilter);

			load(true, () => {
				if ((typeof(savedIndex) == 'number') && savedIndex) {
					setCurrentIndex(savedIndex);
				};
			});
		};
	};

	const beforePosition = () => {
		const items = getItems().slice(0, LIMIT);
		const menu = $(`#${getId()}`);
		const obj = menu.find('.content');
		const { wh } = U.Common.getWindowDimensions();
		const header = $('#header .side.center');
		const width = Math.min(header.width(), J.Size.editor);

		let height = 0;
		if (!isDropdownOpen) {
			height = 46;
		} else
		if (!items.length) {
			height = filter.current ? 160 : 46;
		} else {
			height = items.length * HEIGHT + 62;
		};

		height = Math.min(height, wh - 104);
		menu.css({ width });
		obj.css({ height });
	};

	const getHighlightedText = (item: ChatSearchResult) => {
		const { highlight, highlightRanges } = item;

		if (!highlight) {
			return item.message?.content?.text || '';
		};

		if (!highlightRanges || !highlightRanges.length) {
			return highlight;
		};

		let result = '';
		let lastIndex = 0;

		const sortedRanges = [ ...highlightRanges ].sort((a, b) => a.from - b.from);

		for (const range of sortedRanges) {
			result += U.String.sanitize(highlight.substring(lastIndex, range.from));
			result += `<span class="highlight">${U.String.sanitize(highlight.substring(range.from, range.to))}</span>`;
			lastIndex = range.to;
		};

		result += U.String.sanitize(highlight.substring(lastIndex));

		return result;
	};

	const scrollToRow = (items: any[], index: number) => {
		if (!listRef.current || !items.length) {
			return;
		};

		const listHeight = listRef.current.props.height;

		let offset = 0;
		let total = 0;

		for (let i = 0; i < items.length; ++i) {
			if (i < index) {
				offset += HEIGHT;
			};
			total += HEIGHT;
		};

		if (offset + HEIGHT < listHeight) {
			offset = 0;
		} else {
			offset -= listHeight / 2 - HEIGHT / 2;
		};

		offset = Math.min(offset, total - listHeight + 16);
		listRef.current.scrollToPosition(offset);
	};

	const rowRenderer = (param: any) => {
		const item: ChatSearchResult = items[param.index];
		if (!item || !item.message) {
			return null;
		};

		const { message } = item;
		const { creator, createdAt } = message;
		const author = U.Space.getParticipant(U.Space.getParticipantId(S.Common.space, creator));
		const highlightedText = getHighlightedText(item);
		const day = showRelativeDates ? U.Date.dayString(createdAt) : null;
		const date = day ? day : U.Date.dateWithFormat(dateFormat, createdAt);

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<div
					id={`item-${item.id}`}
					className="item"
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					style={param.style}
				>
					<IconObject object={{ ...author, layout: I.ObjectLayout.Participant }} size={32} />
					<div className="info">
						<div className="nameWrapper">
							<ObjectName object={author} />
							<span className="time">{date}</span>
						</div>
						<div
							className="text"
							dangerouslySetInnerHTML={{ __html: highlightedText }}
						/>
					</div>
				</div>
			</CellMeasurer>
		);
	};

	const items = getItems();
	if ((currentIndex >= items.length - 1) || (currentIndex < 0)) {
		cnu.push('disabled');
	};
	if (currentIndex <= 0) {
		cnd.push('disabled');
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		getFilterRef: () => filterRef.current,
		onClick,
		beforePosition,
		scrollToRow,
	}), []);

	return (
		<div className="wrap">
			<div className="filterWrapper">
				<Filter
					ref={filterRef}
					className="outlined round"
					placeholder={translate('commonSearch')}
					value=""
					icon="search"
					onChange={onFilterChange}
					focusOnMount={true}
				/>
				
				<div className="arrowWrapper">
					<Icon className={cnu.join(' ')} onClick={() => onArrow(1)} />
					<Icon className={cnd.join(' ')} onClick={() => onArrow(-1)} />
				</div>
			</div>

			{!items.length && !isLoading && filter.current && isDropdownOpen ? (
				<EmptySearch filter={filter.current} />
			) : ''}

			{items.length && !isLoading && isDropdownOpen ? (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => !!itemsRef.current[index]}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={listRef}
										width={width}
										height={height}
										deferredMeasurmentCache={cache.current}
										rowCount={items.length}
										rowHeight={HEIGHT}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			) : ''}
		</div>
	);

}));

export default MenuSearchChat;