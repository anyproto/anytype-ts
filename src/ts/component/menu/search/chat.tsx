import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, IconObject, ObjectName, EmptySearch } from 'Component';
import { I, C, S, U, J, keyboard, translate } from 'Lib';

const LIMIT = 16;
const HEIGHT_ITEM = 56;

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

	const { param, onKeyDown, setActive, getId } = props;
	const { data } = param;
	const { chatId, scrollToMessage } = data;
	const spaceId = S.Common.space;

	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const timeout = useRef(0);
	const itemsRef = useRef<ChatSearchResult[]>([]);
	const n = useRef(0);
	const offset = useRef(0);
	const filter = useRef('');

	useEffect(() => {
		rebind();
		focus();
		beforePosition();

		return () => {
			window.clearTimeout(timeout.current);
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
		load(true);
	};

	const load = (clear: boolean, callBack?: (message: any) => void) => {
		if (isLoading) {
			return;
		};

		const text = filter.current;

		if (!text) {
			itemsRef.current = [];
			setDummy(prev => prev + 1);
			callBack?.({});
			return;
		};

		if (clear) {
			setIsLoading(true);
		};

		C.ChatSearch(spaceId, chatId, text, offset.current, J.Constant.limit.menuRecords, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				callBack?.(message);
				return;
			};

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.list);

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
		scrollToMessage?.(item.id);
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			filter.current = filterRef.current?.getValue() || '';
			reload();
		}, J.Constant.delay.keyboard);
	};

	const getRowHeight = (item: any) => {
		return HEIGHT_ITEM;
	};

	const beforePosition = () => {
		const items = getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);
		const { wh } = U.Common.getWindowDimensions();

		let height = 16 + 40;
		if (!items.length) {
			height = filter.current ? 160 : 56;
		} else {
			height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
		};

		height = Math.min(height, wh - 104);

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

	const rowRenderer = (param: any) => {
		const item: ChatSearchResult = items[param.index];
		if (!item || !item.message) {
			return null;
		};

		const { message } = item;
		const { creator, createdAt } = message;
		const author = U.Space.getParticipant(U.Space.getParticipantId(S.Common.space, creator));
		const highlightedText = getHighlightedText(item);

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
							<span className="time">{U.Date.date('d M Y, H:i', createdAt)}</span>
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
	}), []);

	return (
		<div className="wrap">
			<Filter
				ref={filterRef}
				className="outlined"
				placeholder={translate('menuSearchChatPlaceholder')}
				placeholderFocus={translate('menuSearchChatPlaceholder')}
				value=""
				onChange={onFilterChange}
				focusOnMount={true}
			/>

			{!items.length && !isLoading && filter.current ? (
				<EmptySearch filter={filter.current} />
			) : ''}

			{items.length && !isLoading ? (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length + 1}
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
										rowHeight={({ index }) => getRowHeight(items[index])}
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