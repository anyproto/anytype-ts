import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Label, MenuItemVertical } from 'Component';
import { I, S, U, keyboard, translate, sidebar } from 'Lib';

const HEIGHT = 28;
const LIMIT = 20;

const MenuTableOfContents = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, setActive, close, onKeyDown, setHover, getMaxHeight } = props;
	const { data } = param;
	const { rootId, isPopup, blockId } = data;
	const n = useRef(-1);
	const listRef = useRef(null);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const itemSidebar = {
		id: 'sidebar',
		icon: 'openSidebar',
		name: translate('sidebarOpen'),
		depth: 0,
		isCommon: true,
	};

	const rebind = () => {
		unbind();

		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);

		const obj = $(`#${getId()}`);
		obj.on('mouseenter', () => S.Common.clearTimeout('tableOfContents'));
		obj.on('mouseleave', () => S.Common.setTimeout('tableOfContents', 100, () => close()));
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
		$(`#${getId()}`).off('mouseenter mouseleave');
	};

	const getItems = () => {
		return S.Block.getTableOfContents(rootId, true);
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'sidebar') {
			sidebar.rightPanelToggle(true, isPopup, 'object/tableOfContents', { rootId, blockId });
			close();
		} else {
			U.Common.scrollToHeader(item, isPopup);
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
			name={<Label text={U.Common.getLatex(item.text)} />}
			onClick={e => onClick(e, item)}
			onMouseEnter={e => onMouseEnter(e, item)}
			style={{ ...item.style, paddingLeft: 8 + item.depth * 16 }}
		/>
	);

	const beforePosition = () => {
		const items = getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 58;
		const height = Math.max(HEIGHT + offset, Math.min(getMaxHeight(isPopup), items.length * HEIGHT + offset));

		obj.css({ height });
	};

	const items = getItems();

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useEffect(() => beforePosition());

	useEffect(() => {
		setActive(items.find(it => it.id == blockId), true);
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

}));

export default MenuTableOfContents;