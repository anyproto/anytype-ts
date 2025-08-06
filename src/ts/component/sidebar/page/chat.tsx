import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { IconObject, ObjectName } from 'Component';
import { I, U, S, keyboard, translate } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 64;

const SidebarPageChat = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { space } = S.Common
	const spaceview = U.Space.getSpaceview();
	const items = U.Menu.getVaultItems().filter(it => it.isChat);
	const listRef = useRef<List>(null);
	const cache = new CellMeasurerCache({
		defaultHeight: HEIGHT_ITEM,
		fixedWidth: true,
		keyMapper: (index) => items[index].id
	});

	const onClick = (item: any) => {
		if (item.targetSpaceId != S.Common.space) {
			U.Router.switchSpace(item.targetSpaceId, '', true, { replace: true, animate: true }, false);
		} else {
			U.Space.openDashboard();
		};
	};

	const onOver = (item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item);
		};
	};

	const onOut = () => {
		if (!keyboard.isMouseDisabled) {
			unsetActive();
		};
	};

	const setActive = (item: any) => {
		unsetActive();

		if (item) {
			$('#sidebarPageChat').find(`#item-${item.id}`).addClass('hover');
		};
	};

	const unsetActive = () => {
		$('#sidebarPageChat').find('.item.hover').removeClass('hover');
	};

	const Item = (item: any) => {
		const cn = [ 'item' ];

		if (item.targetSpaceId == space) {
			cn.push('active');
		};

		return (
			<div 
				id={`item-${item.id}`}
				className={cn.join(' ')}
				style={item.style} 
				onClick={() => onClick(item)}
				onMouseOver={() => onOver(item)}
				onMouseOut={onOut}
			>
				<IconObject object={item} size={48} iconSize={48} canEdit={false} />
				<div className="info">
					<ObjectName object={item} />
				</div>
			</div>
		);
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		if (!item) {
			return null;
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache}
				columnIndex={0}
				rowIndex={param.index}
			>
				<Item
					{...item}
					index={param.index}
					style={param.style}
				/>
			</CellMeasurer>
		);
	};

	useEffect(() => {
		setActive(spaceview);
	}, [ space ]);

	return (
		<>
			<div className="head">
				<div className="name">{translate('commonChats')}</div>
			</div>
			<div className="body">
				<InfiniteLoader
					rowCount={items.length + 1}
					loadMoreRows={() => {}}
					isRowLoaded={({ index }) => true}
					threshold={LIMIT}
				>
					{({ onRowsRendered }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									ref={listRef}
									width={width}
									height={height}
									deferredMeasurmentCache={cache}
									rowCount={items.length}
									rowHeight={HEIGHT_ITEM}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={10}
									scrollToAlignment="center"
									onScroll={() => {}}
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		</>
	);

}));

export default SidebarPageChat;