import React, { forwardRef, useRef, useEffect, useState, memo, MouseEvent } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, Filter, Label, Icon, Button, EmptySearch, ProgressBar } from 'Component';
import { I, U, S, J, C, keyboard, translate, Mark, analytics, sidebar, Key } from 'Lib';

import ItemProgress from './vault/update';

const LIMIT = 20;
const HEIGHT_ITEM = 64;

const SidebarPageVaultBase = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { space, updateVersion } = S.Common;
	const [ filter, setFilter ] = useState('');
	const checkKeyUp = useRef(false);
	const closeSidebar = useRef(false);
	const pressed = useRef(new Set());
	const n = useRef(-1);
	const spaceview = U.Space.getSpaceview();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);
	const profile = U.Space.getProfile();
	const theme = S.Common.getThemeClass();
	const settings = { ...profile, id: 'settings', tooltip: translate('commonAppSettings'), layout: I.ObjectLayout.Human };
	const progress = S.Progress.getList(it => it.type == I.ProgressType.Update);

	const unbind = () => {
		const events = [ 'keydown', 'keyup' ];
		const ns = 'sidebarPageVault';

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on('keydown.sidebarPageVault', e => onKeyDown(e));
		win.on('keyup.sidebarPageVault', e => onKeyUp(e));
	};

	const onKeyDown = (e: any) => {
		const key = e.key.toLowerCase();
		const { isClosed, width } = sidebar.data;

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			pressed.current.add(key);
		};

		keyboard.shortcut('prevSpace, nextSpace', e, pressed => {
			checkKeyUp.current = true;
			onArrow(pressed == 'prevSpace' ? -1 : 1);

			if (sidebar.isAnimating) {
				return;
			};

			if (isClosed) {
				closeSidebar.current = true;
				sidebar.open(width);
			};
		});
	};

	const onKeyUp = (e: any) => {
		const key: any = String(e.key || '').toLowerCase();
		if (!key) {
			return;
		};

		pressed.current.delete(key);

		if (
			(
				pressed.current.has(Key.ctrl) || 
				pressed.current.has(Key.tab)
			) ||
			!checkKeyUp.current
		) {
			return;
		};

		const items = U.Menu.getVaultItems();
		const item = items[n.current];

		checkKeyUp.current = false;

		if (item) {
			onClick(item);
		};

		if (!sidebar.isAnimating && closeSidebar.current) {
			sidebar.close();
			closeSidebar.current = false;
		};
	};

	const onArrow = (dir: number) => {
		const items = U.Menu.getVaultItems();

		if (items.length == 1) {
			return;
		};
		
		n.current += dir;
		if (n.current < 0) {
			n.current = items.length - 1;
		};
		if (n.current >= items.length) {
			n.current = 0;
		};

		unsetHover();

		const next = items[n.current];
		if (next) {
			setHover(next);
		};
	};

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

			it.lastMessage = list.length ? S.Chat.getMessageSimpleText(it.targetSpaceId, list[list.length - 1]) : '';
			it.counters = S.Chat.getSpaceCounters(it.targetSpaceId);
			return it;
		});

		if (filter) {
			const reg = new RegExp(U.Common.regexEscape(filter), 'gi');
			items = items.filter(it => String(it.name || '').match(reg) || String(it.lastMessage || '').match(reg));
		};

		if (progress.length || updateVersion) {
			items.unshift({ id: 'update-progress', isProgress: true, isUpdate: Boolean(updateVersion) });
		};

		return items;
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		U.Menu.spaceContext(item, {
			onOpen: () => {
				unsetActive();
				unsetHover();
			},
			onClose: () => setActive(spaceview),
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
		});
	};

	const items = getItems();
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
			U.Space.openDashboard({ replace: false });
			sidebar.leftPanelSetState({ page: U.Space.getDefaultSidebarPage() });
		};
	};

	const onOver = (item: any) => {
		if (!keyboard.isMouseDisabled) {
			unsetActive();
			setHover(item);
		};
	};

	const onOut = () => {
		if (!keyboard.isMouseDisabled && !S.Menu.isOpen('select')) {
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

	const ItemObject = (item: any) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !item.isPinned });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			...item.style,
		};
		const cn = [ 'item' ];
		const icons = [];

		if (isDragging) {
			cn.push('isDragging');
		};

		if (item.isLocalLoading) {
			cn.push('isLoading');
		};

		if (item.isMuted) {
			cn.push('isMuted');
			icons.push('muted');
		};

		if (item.isPinned) {
			cn.push('isPinned');
			icons.push('pin');
		};

		// placeholder for error logic
		let withError = false;
		if (withError) {
			cn.push('withError');
			icons.push('error');
		};

		let cnt = null;
		if (item.counters) {
			if (item.counters.mentionCounter) {
				cnt = <Icon className="mention" />;
			} else 
			if (item.counters.messageCounter) {
				cnt = S.Chat.counterString(item.counters.messageCounter);
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
				<div className="iconWrap">
					<IconObject object={item} size={48} iconSize={48} canEdit={false} />
				</div>
				<div className="info">
					<div className="nameWrapper">
						<ObjectName object={item} />

						<div className="icons">
							{icons.map(icon => <Icon key={icon} className={icon} />)}
						</div>
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
				{item.isProgress ? (
					<ItemProgress
						{...item}
						index={param.index}
						style={param.style}
					/>
				) : (
					<ItemObject
						{...item}
						index={param.index}
						style={param.style}
					/>
				)}
			</CellMeasurer>
		);
	};

	const onSettings = () => {
		U.Router.go('/main/settings/index', {});
	};

	const onGallery = () => {
		S.Popup.open('usecase', {
			data: {
				route: analytics.route.usecaseApp,
			},
		});
	};

	const onHelp = () => {
		S.Menu.open('help', {
			element: '#sidebarPageVault #button-help',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			vertical: I.MenuDirection.Top,
			offsetY: -78,
			subIds: J.Menu.help,
		});
	};

	const getRowHeight = (item: any) => {
		return HEIGHT_ITEM + (item.isUpdate ? 36 : 0);
	};

	useEffect(() => {
		rebind();
		analytics.event('ScreenVault');

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		raf(() => setActive(spaceview));
	});

	return (
		<>
			<div id="head" className="head" />
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
			<div id="body" className="body">
				{!items.length ? (
					<EmptySearch filter={filter} text={translate('commonObjectEmpty')} />
				) : ''}

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
											rowHeight={({ index }) => getRowHeight(items[index])}
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

			<div className="bottom">
				<div className="grad" />
				<div className="sides">
					<div className="side left">
						<div className="appSettings" onClick={onSettings}>
							<IconObject object={settings} size={32} iconSize={32} />
							<ObjectName object={settings} />
						</div>
					</div>

					<div className="side right">
						<Icon
							className="gallery"
							tooltipParam={{ text: translate('popupUsecaseListTitle') }}
							onClick={onGallery}
						/>

						<Button
							id="button-help"
							className="help"
							text="?"
							tooltipParam={{ text: translate('commonHelp') }}
							onClick={onHelp}
						/>
					</div>
				</div>
			</div>
		</>
	);

}));

const SidebarPageVault = memo(SidebarPageVaultBase);

export default SidebarPageVault;
