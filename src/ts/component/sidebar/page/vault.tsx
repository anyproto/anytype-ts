import React, { forwardRef, useRef, useEffect, useState, memo, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { IconObject, ObjectName, Filter, Label, Icon, Button, EmptySearch, ChatCounter } from 'Component';
import { I, U, S, J, C, keyboard, translate, analytics, sidebar, Key, Highlight, Storage, Action, Preview } from 'Lib';

const LIMIT = 20;
const HEIGHT_ITEM = 48;
const HEIGHT_ITEM_MESSAGE = 72;
const HEIGHT_DIV = 16;
const VAULT_MINIMAL_OFFSET = 44;

const SidebarPageVault = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { getId } = props;
	const { space, vaultMessages, vaultIsMinimal } = S.Common;
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

	if (vaultMessages) {
		cnh.push('withMessages');
		cnb.push('withMessages');
	};

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
		const { isClosed, width } = sidebar.getData(I.SidebarPanel.Left);

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
				sidebar.leftPanelOpen(width, false, false);
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
		const element = node.find(`#item-${item.id}`);
		const iconWrap = element.find('.iconWrap');
		const idx = items.findIndex(it => it.id == item.id) + 1;
		const caption = (idx >= 1) && (idx <= 9) ? keyboard.getCaption(`space${idx}`) : '';
		const text = Preview.tooltipCaption(U.String.htmlSpecialChars(item.tooltip || item.name), caption);

		Preview.tooltipShow({ 
			text, 
			element, 
			className: 'fromVault', 
			typeX: I.MenuDirection.Left,
			typeY: I.MenuDirection.Center,
			offsetX: node.width() / 2 + iconWrap.width() / 2,
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
		};

		return items;
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		U.Menu.spaceContext(item, {
			element: `#${getId()} #item-${item.id}`,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
		}, { 
			withPin: true,
			withDelete: true,
			withOpenNewTab: true,
			noMembers: true, 
			noManage: true,
			route: analytics.route.vault,
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
		const cn = [ 'plus' ];

		if (!vaultIsMinimal) {
			cn.push('withBackground');
		};

		return (
			<Icon
				id="button-create-space"
				className={cn.join(' ')}
				tooltipParam={{
					...tooltipParam(),
					text: translate('commonCreateSpace'),
					caption: keyboard.getCaption('createSpace'),
				}}
				onClick={onCreate}
			/>
		);
	};

	const onClick = (item: any) => {
		if (item.targetSpaceId != space) {
			U.Router.switchSpace(item.targetSpaceId, '', !!space, {}, false);
		} else {
			U.Space.openDashboard();
		};

		Preview.tooltipHide();
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
		return $(`#${getId()}`);
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
		if (item.isDiv) {
			return (
				<div className="separator" style={item.style}>
					<div className="inner" />
				</div>
			);
		};

		if (item.id == 'createSpace') {
			return (
				<div className="item add" style={item.style}>
					{iconCreate()}
				</div>
			);
		};

		const { targetSpaceId, id, lastMessage, isOneToOne, isChat, isPinned } = item;
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isPinned });
		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			...item.style,
		};
		const cn = [ 'item', U.Data.spaceClass(item.uxType) ];
		const icons = [];
		const iconSize = vaultMessages && !vaultIsMinimal ? 48 : 32;

		let chatName = null;
		let time = null;
		let last = null;
		let counter = null;

		if (targetSpaceId == space) {
			cn.push('active');
		};

		if (isDragging) {
			cn.push('isDragging');
		};

		if (item.isLocalLoading) {
			cn.push('isLoading');
		};

		if (item.isPinned && !item.counters?.mentionCounter && !item.counters?.messageCounter) {
			cn.push('isPinned');
			icons.push('pin');
		};

		if (item.notificationMode != I.NotificationMode.All) {
			cn.push('isMuted');
		};

		if (lastMessage) {
			const { createdAt, creator, isSynced } = lastMessage;

			time = <Label className="time" text={U.Date.timeAgo(createdAt)} />;
			last = <Label className="lastMessage" text={S.Chat.getMessageSimpleText(targetSpaceId, lastMessage, !isOneToOne)} />;
			chatName = <Label className="chatName" text={U.Object.name(item.chat)} />;
			counter = <ChatCounter spaceId={targetSpaceId} disableMention={vaultIsMinimal} />;

			if ((creator == S.Auth.account.id) && !isSynced) {
				cn.push('isSyncing');
			};
		} else {
			cn.push('noMessages');
		};

		let info = null;
		if (vaultMessages) {
			let message = null;

			if (isChat || isOneToOne) {
				message = (
					<div className="messageWrapper">
						{last}
						<div className="icons">
							{icons.map(icon => <Icon key={icon} className={icon} />)}
						</div>
						{counter}
					</div>
				);
			} else {
				message = (
					<>
						<div className="chatWrapper">
							{chatName}
							<div className="icons">
								{icons.map(icon => <Icon key={icon} className={icon} />)}
							</div>
							{counter}
						</div>
						<div className="messageWrapper">
							{last}
						</div>
					</>
				);
			};

			info = (
				<>
					<div className="nameWrapper">
						<ObjectName object={item} />
						{time}
					</div>
					{message}
				</>
			);
		} else {
			info = (
				<div className="nameWrapper">
					<ObjectName object={item} />

					<div className="icons">
						{icons.map(icon => <Icon key={icon} className={icon} />)}
					</div>

					{counter}
				</div>
			);
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
					<IconObject object={item} size={iconSize} iconSize={iconSize} canEdit={false} />
					{vaultIsMinimal ? counter : ''}
				</div>
				{!vaultIsMinimal ? (
					<div className="info">
						{info}
					</div>
				) : ''}
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
				$(`#${getId()} .bottom`).addClass('hover');
			},
			onClose: () => {
				$(`#${getId()} .bottom`).removeClass('hover');
			},
		});
	};

	const onCreate = () => {
		Storage.setHighlight('createSpace', false);
		Highlight.hide('createSpace');

		let param: I.MenuParam = {
			element: `#button-create-space`,
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

	const onVaultContext = (e: any) => {
		U.Menu.vaultStyle({
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
			className: 'vaultStyle fixed',
			classNameWrap: 'fromSidebar',
		});
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) {
			return HEIGHT_DIV;
		};
		return vaultMessages && !vaultIsMinimal ? HEIGHT_ITEM_MESSAGE : HEIGHT_ITEM;
	};

	useEffect(() => {
		rebind();
		analytics.event('ScreenVault');
		Highlight.showAll();

		return () => {
			unbind();
		};
	}, []);

	return (
		<>
			<div onContextMenu={onVaultContext} id="head" className={cnh.join(' ')}>
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
								className="toggle withBackground"
								tooltipParam={{ 
									text: translate('popupShortcutMainBasics15'), 
									caption: keyboard.getCaption('toggleSidebar'), 
									typeY: I.MenuDirection.Bottom,
								}}
								onClick={() => sidebar.leftPanelToggle()}
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
						icon="search"
						className="outlined round"
						placeholder={translate('commonSearch')}
						onChange={onFilterChange}
						onClear={onFilterClear}
					/>
				</div>
			) : ''}
			<div onContextMenu={onVaultContext} id="body" className={cnb.join(' ')}>
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
											onScroll={() => {}}
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
								element: $(e.currentTarget),
							})}
							onMouseLeave={() => Preview.tooltipHide(false)}
						>
							<IconObject object={settings} size={32} iconSize={32} />
							{!vaultIsMinimal ? <ObjectName object={settings} /> : ''}
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

export default memo(SidebarPageVault);
