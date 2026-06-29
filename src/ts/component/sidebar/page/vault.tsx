import React, { forwardRef, useRef, useEffect, useState, memo, MouseEvent } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, Filter, Label, Icon, Button, EmptySearch, ChatCounter } from 'Component';
import * as I from 'Interface';
import Highlight from 'Lib/highlight';
import Storage from 'Lib/storage';

const LIMIT = 20;
const HEIGHT_ITEM = 45;
const HEIGHT_DIV = 16;
const VAULT_MINIMAL_OFFSET = 44;

const SidebarPageVault = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { getId } = props;
	const { space, vaultIsMinimal } = S.Common;
	const [ filter, setFilter ] = useState('');
	const checkKeyUp = useRef(false);
	const closeSidebar = useRef(false);
	const pressed = useRef(new Set());
	const n = useRef(-1);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);
	const profile = U.Space.getProfile();
	const settings = { ...profile, id: 'settings', tooltip: translate('commonAppSettings'), layout: I.ObjectLayout.Human };
	const menuHelpOffset = U.Data.isFreeMember() ? -78 : -4;
	const cnh = [ 'head' ];
	const cnb = [ 'body' ];
	const cnf = [ 'bottom' ];

	const keydownHandler = useRef<(e: any) => void>(null);
	const keyupHandler = useRef<(e: any) => void>(null);

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
		if (keyupHandler.current) {
			U.Dom.removeEvent(window, 'keyup', keyupHandler.current);
			keyupHandler.current = null;
		};
	};

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		keyupHandler.current = (e: any) => onKeyUp(e);
		U.Dom.addEvents(window, [
			['keydown', keydownHandler.current],
			['keyup', keyupHandler.current],
		]);
	};

	const onKeyDown = (e: any) => {
		const key = e.key.toLowerCase();
		const { isClosed, width } = sidebar.getData(I.SidebarPanel.Left);

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			pressed.current.add(key);
		};

		keyboard.shortcut('prevSpace, nextSpace', e, pressed => {
			checkKeyUp.current = true;

			if (sidebar.isAnimating) {
				return;
			};

			if (isClosed) {
				closeSidebar.current = true;
				sidebar.leftPanelOpen(width, false, false);

				// Wait for sidebar to open and list to render before navigating
				requestAnimationFrame(() => {
					onArrow(pressed == 'prevSpace' ? -1 : 1);
				});
			} else {
				onArrow(pressed == 'prevSpace' ? -1 : 1);
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
			onClick(e, item);
		};

		if (!sidebar.isAnimating && closeSidebar.current) {
			sidebar.leftPanelClose(false, false);
			closeSidebar.current = false;
		};

		Preview.tooltipHide();
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
			listRef.current?.scrollToRow(Math.max(0, n.current));
			tooltipShow(next, 1);
		};
	};

	const tooltipShow = (item: any, delay: number) => {
		if (!vaultIsMinimal) {
			return;
		};

		const items = getItems(true);
		const node = getNode();
		const el = U.Dom.select(`#item-${U.Common.esc(item.id)}`, node);
		const iconWrap = U.Dom.select(`#item-${U.Common.esc(item.id)} .iconWrap`, node);
		const idx = items.findIndex(it => it.id == item.id) + 1;
		const caption = (idx >= 1) && (idx <= 9) ? keyboard.getCaption(`space${idx}`) : '';
		const text = Preview.tooltipCaption(U.String.htmlSpecialChars(item.tooltip || item.name), caption);

		if (!el) {
			return;
		};

		Preview.tooltipShow({
			text,
			element: el,
			className: 'fromVault',
			typeX: I.MenuDirection.Left,
			typeY: I.MenuDirection.Center,
			offsetX: U.Dom.contentWidth(node) / 2 + U.Dom.contentWidth(iconWrap) / 2,
			delay,
		});
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

		const items: any[] = U.Menu.getVaultItems();
		const oldIndex = items.findIndex(it => it.id == active.id);
		const newIndex = items.findIndex(it => it.id == over.id);
		const newItems = arrayMove(items, oldIndex, newIndex).filter(it => it.isPinned);

		U.Data.sortByOrderIdRequest(J.Constant.subId.space, newItems, callBack => {
			C.SpaceSetOrder(active.id, newItems.map(it => it.id), callBack);
		});

		analytics.event('ReorderSpace');
	};

	const onSortCancel = () => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);
	};

	const getItems = (skipUi?: boolean) => {
		let items = U.Menu.getVaultItems().map(it => {
			if (it.lastMessage) {
				it.chat = S.Detail.get(J.Constant.subId.chatGlobal, it.lastMessage.chatId, J.Relation.chatGlobal, true);
			};
			return it;
		});

		if (filter) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');
			items = items.filter(it => String(it.name || '').match(reg) || String(it.lastMessage || '').match(reg));
		};

		if (vaultIsMinimal && !skipUi) {
			const pinned = items.filter(it => it.isPinned);
			const notPinned = items.filter(it => !it.isPinned);

			if (pinned.length) {
				items = pinned.concat([ { isDiv: true } ]).concat(notPinned);
			};

			items.unshift({ id: 'createSpace' });
		} else
		if (!skipUi && !filter && (items.length == 1)) {
			items.push({ id: 'createSpaceInline' });
		};

		return items;
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		U.Menu.spaceContext(item, {
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
		}, { 
			withPin: true,
			withDelete: true,
			withOpenNewTab: true,
			noMembers: true, 
			noManage: true,
			noShare: true,
			route: analytics.route.vault,
		});
	};

	const items = getItems();
	const listRef = useRef<List>(null);
	const filterRef = useRef(null);
	const timeout = useRef(0);
	const scrollTopRef = useRef(0);
	const prevItemsRef = useRef<{ id: string; height: number }[]>([]);
	const cache = new CellMeasurerCache({
		defaultHeight: HEIGHT_ITEM,
		fixedWidth: true,
		keyMapper: index => items[index].id,
	});

	// Subscriptions
	items.forEach(item => {
		const { lastMessage } = item;
		const { isSynced } = lastMessage || {};
	});

	const tooltipParam = (): I.TooltipParam => {
		const param: any = {};
		if (vaultIsMinimal) {
			param.typeY = I.MenuDirection.Center;
			param.typeX = I.MenuDirection.Left;
			param.offsetX = VAULT_MINIMAL_OFFSET;
			param.delay = 300;
		} else {
			param.typeY = I.MenuDirection.Bottom;
		};
		return param;
	};

	const iconCreate = () => {
		return (
			<Icon
				id="button-create-space"
				name="plus/menu" className="plus" withBackground={!vaultIsMinimal}
				tooltipParam={{
					...tooltipParam(),
					text: translate('commonCreateSpace'),
					caption: keyboard.getCaption('createSpace'),
				}}
				onClick={onCreate}
			/>
		);
	};

	const onClick = (e: any, item: any) => {
		if (e.ctrlKey || e.metaKey) {
			Action.openSpaceTab(item.targetSpaceId, item.spaceType, analytics.route.vault);
			return;
		};

		if (S.Common.isPinned) {
			Renderer.send('openSpaceInTab', item.targetSpaceId, item.spaceType);
		} else
		if (item.targetSpaceId != space) {
			U.Router.switchSpace(item.targetSpaceId, '', !!space, {}, false);
		} else {
			U.Space.openDashboard();
		};

		unsetHover();
		Preview.tooltipHide(true);
		keyboard.disableMouse(true);
	};

	const onOver = (item: any) => {
		if (!keyboard.isMouseDisabled) {
			setHover(item);
			tooltipShow(item, 50);
		};
	};

	const onOut = () => {
		if (!keyboard.isMouseDisabled && !S.Menu.isOpen('select')) {
			unsetHover();
			Preview.tooltipHide(false);
		};
	};

	const getNode = () => {
		return U.Dom.get(getId());
	};

	const updateBottomGradient = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
		const bottom = U.Dom.select('.bottom', getNode());
		if (!bottom) {
			return;
		};

		const atBottom = (scrollHeight <= clientHeight) || (scrollTop + clientHeight >= scrollHeight - 1);
		U.Dom.toggleClass(bottom, 'isBottom', atBottom);
	};

	const setHover = (item: any) => {
		if (item) {
			U.Dom.addClass(U.Dom.select(`#item-${U.Common.esc(item.id)}`, getNode()), 'hover');
		};
	};

	const unsetHover = () => {
		U.Dom.selectAll('.item.hover', getNode()).forEach(el => U.Dom.removeClass(el, 'hover'));
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

	const ItemObject = forwardRef((item: any, forwardedRef: any) => {
		if (item.isDiv) {
			return (
				<div ref={forwardedRef} className="separator" style={item.style}>
					<div className="inner" />
				</div>
			);
		};

		if (item.id == 'createSpace') {
			return (
				<div ref={forwardedRef} className="item add" style={item.style}>
					{iconCreate()}
				</div>
			);
		};

		if (item.id == 'createSpaceInline') {
			return (
				<div
					ref={forwardedRef}
					id="button-create-space-inline"
					className="item add inline"
					style={item.style}
					onClick={onCreate}
				>
					<div className="iconWrap">
						<Icon className="plus" name="plus/menu" />
					</div>
					<div className="info">
						<div className="nameWrapper">
							<Label className="name" text={translate('commonNewChannel')} />
						</div>
					</div>
				</div>
			);
		};

		const { targetSpaceId, id, lastMessage, isOneToOne, isPinned } = item;
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isPinned });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			...item.style,
		};
		const cn = [ 'item', U.Data.spaceClass(item.spaceType) ];
		const iconSize = 32;
		const counter = <ChatCounter spaceId={targetSpaceId} isMinimal={vaultIsMinimal} />;
		const icons = [];

		if (targetSpaceId == space) {
			cn.push('active');
		};

		if (isDragging) {
			cn.push('isDragging');
		};

		if (item.isLocalLoading) {
			cn.push('isLoading');
		};

		if (!item.hasCounter && item.isPinned) {
			cn.push('isPinned');
			icons.push({ className: 'pin', name: 'vault/pin' });
		};

		if (item.notificationMode != I.NotificationMode.All) {
			cn.push('isMuted');
		};

		const rawCounters = !isOneToOne ? S.Chat.getSpaceCounters(targetSpaceId) : null;
		const hasUnread = rawCounters && !!(rawCounters.messageCounter || rawCounters.mentionCounter || rawCounters.reactionCounter);

		if (lastMessage) {
			const { creator, isSynced } = lastMessage;

			if ((creator == S.Auth.account.id) && !isSynced) {
				cn.push('isSyncing');
			};
		} else {
			cn.push('noMessages');
		};

		const info = (
			<div className="nameWrapper">
				<ObjectName object={item} />

				<div className="icons">
					{icons.map(icon => <Icon key={icon.className} name={icon.name} className={icon.className} />)}
				</div>

				{counter}
			</div>
		);

		const mergedRef = (node: any) => {
			setNodeRef(node);
			if (typeof forwardedRef === 'function') {
				forwardedRef(node);
			} else
			if (forwardedRef) {
				forwardedRef.current = node;
			};
		};

		return (
			<div
				ref={mergedRef}
				id={`item-${item.id}`}
				className={cn.join(' ')}
				{...attributes}
				{...listeners}
				style={style}
				onClick={e => onClick(e, item)}
				onMouseEnter={() => onOver(item)}
				onMouseLeave={onOut}
				onContextMenu={e => onContextMenu(e, item)}
			>
				<div className="iconWrap">
					<IconObject object={item} size={iconSize} iconSize={iconSize} canEdit={false} />
					{vaultIsMinimal ? counter : ''}
				</div>
				{!vaultIsMinimal ? (
					<div className={[ 'info', (hasUnread ? 'hasUnread' : '') ].join(' ')}>
						{info}
					</div>
				) : ''}
			</div>
		);
	});

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
				<ItemObject
					{...item}
					index={param.index}
					style={param.style}
				/>
			</CellMeasurer>
		);
	};

	const onSettings = () => {
		Action.openSettings('account', analytics.route.vault);
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
			element: `#${getId()} #button-help`,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			vertical: I.MenuDirection.Top,
			offsetY: menuHelpOffset,
			subIds: J.Menu.help,
			onOpen: () => {
				U.Dom.addClass(U.Dom.select(`#${getId()} .bottom`), 'hover');
			},
			onClose: () => {
				U.Dom.removeClass(U.Dom.select(`#${getId()} .bottom`), 'hover');
			},
		});
	};

	const onCreate = () => {
		Storage.setHighlight('createSpace', false);
		Highlight.hide('createSpace');

		let param: I.MenuParam = {
			element: '#button-create-space',
			className: 'spaceCreate fixed',
			classNameWrap: 'fromSidebar',
		};

		if (vaultIsMinimal) {
			param = Object.assign(param, {
				vertical: I.MenuDirection.Center,
				offsetX: VAULT_MINIMAL_OFFSET,
			});
		};

		U.Menu.spaceCreate(param, analytics.route.vault);
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) {
			return HEIGHT_DIV;
		};
		return HEIGHT_ITEM;
	};

	useEffect(() => {
		rebind();
		analytics.event('ScreenVault');
		Highlight.showAll();

		return () => {
			unbind();
		};
	}, []);

	const itemIds = items.map(it => it.id).join(',');

	useEffect(() => {
		const prev = prevItemsRef.current;
		const currentIds = new Set(items.map(it => it.id));

		if (prev.length && (prev.length > items.length) && (scrollTopRef.current > 0)) {
			let removedHeightAbove = 0;
			let accHeight = 0;

			for (const p of prev) {
				if (p.id && !currentIds.has(p.id) && (accHeight < scrollTopRef.current)) {
					removedHeightAbove += p.height;
				};
				accHeight += p.height;
			};

			if (removedHeightAbove > 0) {
				const newTop = Math.max(0, scrollTopRef.current - removedHeightAbove);
				scrollTopRef.current = newTop;
				listRef.current?.scrollToPosition(newTop);
			};
		};

		prevItemsRef.current = items.map(it => ({ id: it.id, height: getRowHeight(it) }));

		const grid = U.Dom.select('.ReactVirtualized__Grid', getNode());
		if (grid) {
			updateBottomGradient(grid.scrollTop, grid.scrollHeight, grid.clientHeight);
		};
	}, [ itemIds ]);

	return (
		<>
			<div 
				id="head" 
				className={cnh.join(' ')}
			>
				<div className="side left">
					{!vaultIsMinimal ? (
						<div className="name">
							{translate('popupSettingsSpacesListTitle')}
						</div>
					) : ''}
				</div>
				<div className="side center" />
				<div className="side right">
					{!vaultIsMinimal ? (
						<>
							{iconCreate()}
							<Icon
								id="button-vault-toggle"
								name="widget/sidebarToggle"
								className="toggle"
								withBackground={true}
								tooltipParam={{
									text: translate('popupShortcutMainBasics15'),
									caption: keyboard.getCaption('toggleSidebar'),
									typeY: I.MenuDirection.Bottom,
								}}
								onClick={() => sidebar.leftPanelToggle(true, true)}
								onMouseDown={e => e.stopPropagation()}
							/>
						</>
					) : ''}
				</div>
			</div>
			{!vaultIsMinimal ? (
				<div className="filterWrapper">
					<Filter
						ref={filterRef}
						size={32}
						iconParam={{ name: 'common/search' }}
						placeholder={translate('commonFilterChannels')}
						onChange={onFilterChange}
						onClear={onFilterClear}
					/>
				</div>
			) : ''}
			<div 
				id="body" 
				className={cnb.join(' ')}
			>
				{!items.length && !vaultIsMinimal ? (
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
											onScroll={({ scrollTop, scrollHeight, clientHeight }) => {
												scrollTopRef.current = scrollTop;
												updateBottomGradient(scrollTop, scrollHeight, clientHeight);
											}}
										/>
									</SortableContext>
								</DndContext>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>

			<div className={cnf.join(' ')}>
				<div className="grad" />
				<div className="sides">
					<div className="side left">
						<div 
							className="appSettings" 
							onClick={onSettings}
							onMouseEnter={e => Preview.tooltipShow({ 
								...tooltipParam(),
								typeY: vaultIsMinimal ? I.MenuDirection.Center : I.MenuDirection.Top,
								text: translate('popupSettingsAccountPersonalInformationTitle'),
								element: e.currentTarget as HTMLElement,
							})}
							onMouseLeave={() => Preview.tooltipHide(false)}
						>
							<IconObject object={settings} size={32} iconSize={32} />
							{!vaultIsMinimal ? <ObjectName object={settings} /> : ''}
						</div>
					</div>

					<div className="side right">
						<Icon
							name="vault/gallery"
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

});

export default memo(SidebarPageVault);