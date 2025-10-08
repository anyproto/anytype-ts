import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { I, S, J, keyboard, Action } from 'Lib';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import WidgetListItem from './item';

const LIMIT = 30;
const HEIGHT_COMPACT = 28;
const HEIGHT_LIST = 64;

const WidgetViewList = observer(forwardRef<{}, I.WidgetViewComponent>((props, ref) => {

	const { parent, block, isPreview, subId, getRecordIds, addGroupLabels, getView, getContentParam } = props;
	const { layout } = getContentParam();
	const cache = useRef({});
	const nodeRef =	useRef(null);
	const listRef = useRef(null);
	const top = useRef(0);
	const view = getView();
	const { total } = S.Record.getMeta(subId, '');
	const isCompact = [ I.WidgetLayout.Compact, I.WidgetLayout.View ].includes(layout);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	cache.current = new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_COMPACT });

	const onSortStart = () => {
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		keyboard.disableSelection(false);

		const { active, over } = result;
		if (!active || !over) {
			return;
		};
	};

	const getItems = () => {
		if (!block) {
			return [];
		};

		const recordIds = getRecordIds();
		const { targetBlockId } = block.content;
		const isRecent = [ J.Constant.widgetId.recentOpen, J.Constant.widgetId.recentEdit ].includes(targetBlockId);

		let items = recordIds.map(id => S.Detail.get(subId, id, J.Relation.sidebar));

		if (isPreview && isRecent) {
			// add group labels
			items = addGroupLabels(items, targetBlockId);
		};

		return items;
	};

	const resize = () => {
		const length = getItems().length;

		raf(() => {
			const container = $('#sidebarPageWidget #body');
			const obj = $(`#widget-${parent.id}`);
			const node = $(nodeRef.current);
			const head = obj.find('.head');
			const viewSelect = obj.find('#viewSelect');

			let height = getTotalHeight() + (isPreview ? 16 : 0);

			if (isPreview) {
				let maxHeight = container.height() - head.outerHeight(true);
				if (viewSelect.length) {
					maxHeight -= viewSelect.outerHeight(true);
				};

				height = Math.min(maxHeight, height);
			};

			const css: any = { height, paddingTop: '', paddingBottom: 0 };
			
			if (!length) {
				css.paddingTop = 20;
				css.paddingBottom = 22;
				css.height = 36 + css.paddingTop + css.paddingBottom;
			};

			node.css(css);
		});
	};

	const getTotalHeight = () => {
		return getItems().reduce((r, c) => r + getRowHeight(c, 0, isCompact), 0);
	};

	const getRowHeight = (item: any, index: number, isCompact: boolean) => {
		if (item && item.isSection) {
			return index ? HEIGHT_COMPACT + 12 : HEIGHT_COMPACT;
		};
		return isCompact ? HEIGHT_COMPACT : HEIGHT_LIST;
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const items = getItems();
	const length = items.length;
	const cn = [ 'body' ];

	if (isCompact) {
		cn.push('isCompact');
	};

	let content = null;

	if (isPreview) {
		const rowRenderer = ({ index, key, parent, style }) => (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={index}
				fixedWidth
			>
				<WidgetListItem 
					{...props}
					{...items[index]}
					subId={subId} 
					id={items[index].id}
					style={style} 
					index={index}
					isCompact={isCompact}
					hideIcon={view?.hideIcon}
				/>
			</CellMeasurer>
		);

		content = (
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={onSortStart}
				onDragEnd={onSortEnd}
				modifiers={[ restrictToVerticalAxis, restrictToFirstScrollableAncestor ]}
			>
				<SortableContext
					items={items.map((item) => item.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="items">
						<InfiniteLoader
							rowCount={total}
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
											rowCount={length}
											rowHeight={({ index }) => getRowHeight(items[index], index, isCompact)}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											scrollToAlignment="center"
											onScroll={onScroll}
										/>
								)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				</SortableContext>
			</DndContext>
		);
	} else {
		content = (
			<>
				{items.map((item: any) => (
					<WidgetListItem 
						key={`widget-${block.id}-${item.id}`} 
						{...props} 
						{...item} 
						subId={subId} 
						id={item.id} 
						isCompact={isCompact}
						hideIcon={view?.hideIcon}
					/>
				))}
			</>
		);
	};

	useEffect(() => {
		listRef.current?.scrollToPosition(top.current);
		resize();
	});

	useImperativeHandle(ref, () => ({}));

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
		</div>
	);

}));

export default WidgetViewList;