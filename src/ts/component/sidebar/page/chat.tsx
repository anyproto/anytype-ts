import React, { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { IconObject, ObjectName } from 'Component';
import { I, U } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 64;

const SidebarPageChat = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const items = U.Menu.getVaultItems().filter(it => it.isChat);
	const listRef = useRef<List>(null);
	const cache = new CellMeasurerCache({
		defaultHeight: HEIGHT_ITEM,
		fixedWidth: true,
		keyMapper: (index) => items[index].id
	});

	const Item = (item: any) => {
		return (
			<div className="item" style={item.style}>
				<IconObject object={item.item} size={48} iconSize={48} canEdit={false} />
				<div className="info">
					<ObjectName object={item.item} />
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
						item={item}
						style={param.style}
					/>
				</CellMeasurer>
			);
		};

	return (
		<div className="sidebarPage pageChat">
			<div className="head">
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
		</div>
	);

}));

export default SidebarPageChat;