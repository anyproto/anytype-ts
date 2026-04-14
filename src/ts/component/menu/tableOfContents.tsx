import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Label, MenuItemVertical } from 'Component';
import * as I from 'Interface';

const HEIGHT = 28;
const LIMIT = 20;

const MenuTableOfContents = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, getContainer, setActive, close, onKeyDown, setHover, getMaxHeight, position } = props;
	const { data } = param;
	const { rootId, isPopup, blockId } = data;
	const n = useRef(-1);
	const listRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const keydownHandler = useRef(null);
	const mouseenterHandler = useRef(null);
	const mouseleaveHandler = useRef(null);
	const itemSidebar = {
		id: 'sidebar',
		iconParam: { name: 'openSidebar' },
		name: translate('sidebarOpen'),
		depth: 0,
		isCommon: true,
	};

	const rebind = () => {
		unbind();

		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);

		const obj = getContainer();
		mouseenterHandler.current = () => S.Common.clearTimeout('tableOfContents');
		mouseleaveHandler.current = () => S.Common.setTimeout('tableOfContents', 100, () => close());
		if (obj) {
			U.Dom.addEvents(obj, [
				[ 'mouseenter', mouseenterHandler.current ],
				[ 'mouseleave', mouseleaveHandler.current ],
			]);
		};
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};

		const obj = getContainer();
		if (obj) {
			if (mouseenterHandler.current) {
				U.Dom.removeEvent(obj, 'mouseenter', mouseenterHandler.current);
				mouseenterHandler.current = null;
			};
			if (mouseleaveHandler.current) {
				U.Dom.removeEvent(obj, 'mouseleave', mouseleaveHandler.current);
				mouseleaveHandler.current = null;
			};
		};
	};

	const getItems = () => {
		return S.Block.getTableOfContents(rootId, true);
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setHover(item);
		};
	};

	const onMouseLeave = () => {
		setHover();
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'sidebar') {
			sidebar.rightPanelToggle(isPopup, { page: 'object/tableOfContents', rootId, blockId });
			close();
		} else {
			U.Dom.scrollToHeader(rootId, item, isPopup);
		};
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<Item key={item.id} {...item} index={param.index} style={param.style} />
			</CellMeasurer>
		);
	};

	const Item = (item: any) => (
		<MenuItemVertical
			{...item}
			className={item.id == blockId ? 'isCurrent' : ''}
			name={<Label text={U.Common.getLatex(item.text)} />}
			onClick={e => onClick(e, item)}
			onMouseEnter={e => onMouseEnter(e, item)}
			onMouseLeave={onMouseLeave}
			style={{ ...item.style, paddingLeft: 16 + item.depth * 12 }}
		/>
	);

	const beforePosition = () => {
		const items = getItems();
		const content = U.Dom.select('.content', getContainer());
		const offset = 58;
		const height = Math.max(HEIGHT + offset, Math.min(getMaxHeight(isPopup), items.length * HEIGHT + offset));

		U.Dom.css(content, { height: `${height}px` });
	};

	const items = getItems();

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useEffect(() => position());

	useEffect(() => {
		const index = items.findIndex(it => it.id == blockId);
		if ((index >= 0) && listRef.current) {
			listRef.current.scrollToRow(index);
		};
	}, [ blockId ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		beforePosition,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		getListRef: () => listRef.current,
	}), []);

	return (
		<div className="wrap">
			<div className="items">
				<InfiniteLoader
					rowCount={items.length}
					loadMoreRows={() => {}}
					isRowLoaded={() => true}
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
									overscanRowCount={LIMIT}
									scrollToAlignment="center"
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>

			<div className="bottom">
				<div className="line" />
				<MenuItemVertical 
					{...itemSidebar}
					onClick={e => onClick(e, itemSidebar)}
					onMouseEnter={() => setHover(itemSidebar)} 
					onMouseLeave={() => setHover()}
				/>
			</div>
		</div>
	);

});

export default MenuTableOfContents;