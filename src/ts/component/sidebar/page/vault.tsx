import React, { forwardRef, useRef, useEffect, useState, memo, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, Filter, Label, Icon } from 'Component';
import { I, U, S, J, C, keyboard, translate, Mark, analytics } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 64;

const SidebarPageVaultBase = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { space } = S.Common;
	const [ filter, setFilter ] = useState('');
	const spaceview = U.Space.getSpaceview();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const onSortStart = () => {
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
	};

	const onSortEnd = (result: any) => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		const { active, over } = result;
		if (!active || !over || (active.id == over.id)) {
			return;
		};

		const items: any[] = U.Menu.getVaultItems().filter(it => !it.isButton);
		const oldIndex = items.findIndex(it => it.id == active.id);
		const newIndex = items.findIndex(it => it.id == over.id);
		const newItems = arrayMove(items, oldIndex, newIndex).filter(it => it.isPinned);

		let s = '';
		newItems.forEach((it, i) => {
			s = U.Common.lexString(s);
			S.Detail.update(J.Constant.subId.space, { id: it.id, details: { tmpOrder: s }}, false);
		});

		C.SpaceSetOrder(active.id, newItems.map(it => it.id), (message: any) => {
			if (message.error.code) {
				return;
			};

			const list = message.list;
			for (let i = 0; i < list.length; i++) {
				const item = items[i];
				if (item) {
					S.Detail.update(J.Constant.subId.space, { id: item.id, details: { spaceOrder: list[i] }}, false);
				};
			};
		});

		analytics.event('ReorderSpace');
	};

	const onSortCancel = () => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);
	};

	const getItems = () => {
		let items = U.Menu.getVaultItems().map(it => {
			if (!it.chatId) {
				return it;
			};

			const list = S.Chat.getList(S.Chat.getSpaceSubId(it.targetSpaceId));

			let text = '';
			if (list.length) {
				const last = list[list.length - 1];
				if (last) {
					const participantId = U.Space.getParticipantId(it.targetSpaceId, last.creator);
					const author = last.dependencies.find(it => it.id == participantId);

					if (author) {
						text = `${author.name}: `;
					};

					if (last.content.text) {
						text += U.Common.sanitize(Mark.toHtml(last.content.text, last.content.marks));
						text = text.replace(/\n\r?/g, ' ');
					} else 
					if (last.attachments.length) {
						const names = last.attachments.map(id => {
							const object = last.dependencies.find(it => it.id == id);
							return object ? U.Object.name(object) : '';
						}).filter(it => it).join(', ');

						text += names;
					};
				};
			};

			it.lastMessage = text;
			it.counters = S.Chat.getSpaceCounters(it.targetSpaceId);
			return it;
		});

		if (filter) {
			const reg = new RegExp(U.Common.regexEscape(filter), 'gi');
			items = items.filter(it => it.name.match(reg) || it.lastMessage.match(reg));
		};

		return items;
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		U.Menu.spaceContext(item, {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			element: `#sidebarPageVault #item-${item.id}`,
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
		});
	};

	const items = getItems();
	const pinned = items.filter(it => it.isPinned);
	const listRef = useRef<List>(null);
	const filterRef = useRef(null);
	const timeout = useRef(0);
	const cache = new CellMeasurerCache({
		defaultHeight: HEIGHT_ITEM,
		fixedWidth: true,
		keyMapper: index => items[index].id,
	});

	const onClick = (item: any) => {
		if (item.targetSpaceId != S.Common.space) {
			U.Router.switchSpace(item.targetSpaceId, '', true, {}, false);
		} else {
			U.Space.openDashboard();
		};
	};

	const onOver = (item: any) => {
		if (!keyboard.isMouseDisabled) {
			unsetActive();
			setHover(item);
		};
	};

	const onOut = () => {
		if (!keyboard.isMouseDisabled) {
			unsetHover();
			setActive(spaceview);
		};
	};

	const getNode = () => {
		return $('#sidebarPageVault');
	};

	const setActive = (item: any) => {
		unsetActive();

		if (item) {
			getNode().find(`#item-${item.id}`).addClass('active');
		};
	};

	const unsetActive = () => {
		getNode().find('.item.active').removeClass('active');
	};

	const setHover = (item: any) => {
		if (item) {
			getNode().find(`#item-${item.id}`).addClass('hover');
		};
	};

	const unsetHover = () => {
		getNode().find('.item.hover').removeClass('hover');
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			if (filter != v) {
				setFilter(v);
			};
		}, J.Constant.delay.keyboard);
	};

	const onFilterClear = () => {
		setFilter('');
	};

	const Item = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !item.isPinned });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			...item.style,
		};
		const cn = [ 'item' ];

		if (isDragging) {
			cn.push('isDragging');
		};

		if (item.index == pinned.length - 1) {
			cn.push('isLastPinned');
		};

		let cnt = null;
		if (item.counters) {
			if (item.counters.mentionCounter) {
				cnt = <Icon className="mention" />;
			} else 
			if (item.counters.messageCounter) {
				cnt = item.counters.messageCounter;
			};
		};

		return (
			<div 
				ref={setNodeRef}
				id={`item-${item.id}`}
				className={cn.join(' ')}
				{...attributes}
				{...listeners}
				style={style} 
				onClick={() => onClick(item)}
				onMouseOver={() => onOver(item)}
				onMouseOut={onOut}
				onContextMenu={e => onContextMenu(e, item)}
			>
				<IconObject object={item} size={48} iconSize={48} canEdit={false} />
				<div className="info">
					<div className="nameWrapper">
						<ObjectName object={item} />
						{cnt ? <div className="cnt">{cnt}</div> : ''}
					</div>
					<Label text={item.lastMessage} />
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
		raf(() => setActive(spaceview));
	}, [ space ]);

	return (
		<>
			<div className="head">
			</div>
			<div className="filterWrapper">
				<Filter 
					ref={filterRef}
					icon="search"
					className="outlined"
					placeholder={translate('commonSearch')}
					onChange={onFilterChange}
					onClear={onFilterClear}
				/>
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
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragStart={onSortStart}
									onDragEnd={onSortEnd}
									onDragCancel={onSortCancel}
									modifiers={[ restrictToVerticalAxis, restrictToParentElement ]}
								>
									<SortableContext
										items={items.map(item => item.id)}
										strategy={verticalListSortingStrategy}
									>
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
									</SortableContext>
								</DndContext>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		</>
	);

}));

const SidebarPageVault = memo(SidebarPageVaultBase);

export default SidebarPageVault;