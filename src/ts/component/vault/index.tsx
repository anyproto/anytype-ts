import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, U, S, C, J, Key, keyboard, translate, analytics, Preview, sidebar, Action } from 'Lib';
import VaultItem from './item';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor, restrictToParentElement } from '@dnd-kit/modifiers';

interface VaultRefProps {
	toggleClass: (name: string, value: boolean) => void;
	setActive: (id: string) => void;
	getNode: () => HTMLElement;
};

const Vault = observer(forwardRef<VaultRefProps>((props, ref) => {

	const nodeRef = useRef(null);
	const { showVault } = S.Common;
	const checkKeyUp = useRef(false);
	const closeSidebar = useRef(false);
	const closeVault = useRef(false);
	const top = useRef(0);
	const timeoutHover = useRef(0);
	const pressed = useRef(new Set());
	const n = useRef(-1);
	const items = U.Menu.getVaultItems();
	const pinned = items.filter(it => it.isPinned);
	const unpinned = items.filter(it => !it.isPinned);
	const profile = U.Space.getProfile();
	const itemAdd = { id: 'add', name: translate('commonNewSpace'), isButton: true };
	const itemSettings = { ...profile, id: 'settings', tooltip: translate('commonAppSettings'), layout: I.ObjectLayout.Human };
	const canCreate = U.Space.canCreateSpace();

	const cn = [ 'vault' ];
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	if (!showVault) {
		cn.push('isHidden');
	};

	const unbind = () => {
		const events = [ 'resize', 'keydown', 'keyup' ];
		const ns = 'vault';

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on('resize.vault', () => resize());
		win.on('keydown.vault', e => onKeyDown(e));
		win.on('keyup.vault', e => onKeyUp(e));
	};

	const getSpaceItems = () => {
		return U.Menu.getVaultItems().filter(it => !it.isButton);
	};

	const onKeyDown = (e: any) => {
		const key = e.key.toLowerCase();
		const { isClosed, width } = sidebar.data;
		const { showVault } = S.Common;
		const items = getSpaceItems();

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			pressed.current.add(key);
		};

		keyboard.shortcut('prevSpace, nextSpace', e, pressed => {
			checkKeyUp.current = true;
			onArrow(pressed == 'prevSpace' ? -1 : 1);

			if (sidebar.isAnimating) {
				return;
			};

			if (!showVault) {
				S.Common.showVaultSet(true);
				sidebar.resizePage(width, null, false);
				closeVault.current = true;
			};

			if (isClosed) {
				closeSidebar.current = true;
				sidebar.open(width);
			};
		});

		for (let i = 1; i <= 9; i++) {
			const id = Number(i) - 1;
			keyboard.shortcut(`space${i}`, e, () => {
				if (items[id]) {
					onClick(e, items[id]);
				};
			});
		};
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

		const { width } = sidebar.data;
		const node = $(nodeRef.current);
		const items = getSpaceItems();
		const item = items[n.current];

		checkKeyUp.current = false;

		if (item) {
			node.find('.item.hover').removeClass('hover');
			onClick(e, item);
		};

		if (!sidebar.isAnimating) {
			if (closeVault.current) {
				S.Common.showVaultSet(false);
				sidebar.resizePage(width, null, false);
				closeVault.current = false;
			};

			if (closeSidebar.current) {
				sidebar.close();
				closeSidebar.current = false;
			};
		};

		Preview.tooltipHide();
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		switch (item.id) {
			case 'add': {
				onAdd();
				break;
			};

			case 'gallery': {
				S.Popup.open('usecase', {
					data: { 
						route: analytics.route.usecaseApp,
					},
				});
				break;
			};

			case 'settings': {
				U.Router.go('/main/settings/index', {});
				break;
			};

			default: {
				if (!item.isLocalOk) {
					break;
				};

				if (item.targetSpaceId != S.Common.space) {
					U.Router.switchSpace(item.targetSpaceId, '', true, { replace: true, animate: true }, false);
				} else {
					U.Space.openDashboard();
					sidebar.leftPanelSetState({ page: 'widget' });
				};
				break;
			};
		};
	};

	const onAdd = () => {
		Action.spaceCreateMenu({
			element: `#vault #item-add`,
			className: 'spaceCreate fixed',
			classNameWrap: 'fromSidebar',
			vertical: I.MenuDirection.Center,
			offsetX: 54,
		}, analytics.route.vault);
	};

	const onArrow = (dir: number) => {
		const items = getSpaceItems();

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

		const next = items[n.current];

		if (next) {
			setHover(next);
		};
	};

	const setActive = (id: string) => {
		const node = $(nodeRef.current);

		node.find('.item.isActive').removeClass('isActive');
		node.find(`#item-${id}`).addClass('isActive');

		n.current = getSpaceItems().findIndex(it => it.id == id);
	};

	const setHover = (item: any) => {
		const node = $(nodeRef.current);
		const head = node.find('.head');
		const scroll = node.find('#scroll');
		const el = node.find(`#item-${item.id}`);
		const t = el.offset().top - scroll.position().top + top.current;
		const height = scroll.height();
		const hh = head.height();
		const ih = el.height() + 8;

		node.find('.item.hover').removeClass('hover');
		el.addClass('hover');

		let s = -1;
		if (t < top.current) {
			s = 0;
		};
		if (t + ih > height + top.current + hh) {
			s = top.current + height;
		};

		if (s >= 0) {
			Preview.tooltipHide(true);
			scroll.stop().animate({ scrollTop: s }, 200, 'swing', () => tooltipShow(item, 1));
		} else {
			tooltipShow(item, 1);
		};
	};

	const onContextMenu = (e: any, item: any) => {
		U.Menu.spaceContext(item, {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			element: `#vault #item-${item.id}`,
			vertical: I.MenuDirection.Center,
			route: analytics.route.vault,
			offsetX: 42,
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

	const onScroll = () => {
		const node = $(nodeRef.current);
		const scroll = node.find('#scroll');

		top.current = scroll.scrollTop();
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isDragging) {
			tooltipShow(item, 300);
		};
	};

	const tooltipShow = (item: any, delay: number) => {
		const node = $(nodeRef.current);
		const element = node.find(`#item-${item.id}`);
		const items = getSpaceItems();
		const idx = items.findIndex(it => it.id == item.id) + 1;
		const caption = (idx >= 1) && (idx <= 9) ? keyboard.getCaption(`space${idx}`) : '';
		const text = Preview.tooltipCaption(U.Common.htmlSpecialChars(item.tooltip || item.name), caption);

		Preview.tooltipShow({ 
			text, 
			element, 
			className: 'fromVault', 
			typeX: I.MenuDirection.Left,
			typeY: I.MenuDirection.Center,
			offsetX: 42,
			delay,
		});
	};

	const resize = () => {
		$(nodeRef.current).css({ height: U.Common.getWindowDimensions().wh });
	};

	useEffect(() => {
		resize();
		rebind();

		return () => {
			unbind();
			window.clearTimeout(timeoutHover.current);
		};
	}, []);

	useEffect(() => {
		S.Chat.setBadge();

		$(nodeRef.current).find('#scroll').scrollTop(top.current);
		setActive(S.Block.spaceview);
	});

	useImperativeHandle(ref, () => ({
		toggleClass: (name, value) => {
			$(nodeRef.current).toggleClass(name, value);
		},
		setActive,
		getNode: () => nodeRef.current,
	}));

	return (
		<div 
			ref={nodeRef}
			id="vault"
			className={cn.join(' ')}
		>
			<div className="head" />
			<div className="body">
				<div id="scroll" className="side top" onScroll={onScroll}>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={onSortStart}
						onDragEnd={onSortEnd}
						onDragCancel={onSortCancel}
						modifiers={[ restrictToVerticalAxis, restrictToParentElement ]}
					>
						<SortableContext
							items={pinned.map(item => item.id)}
							strategy={verticalListSortingStrategy}
						>
							{pinned.map((item, i) => (
								<VaultItem 
									key={`item-space-${item.id}`}
									item={item}
									onClick={e => onClick(e, item)}
									onMouseEnter={e => onMouseEnter(e, item)}
									onMouseLeave={() => Preview.tooltipHide()}
									onContextMenu={item.isButton ? null : e => onContextMenu(e, item)}
								/>
							))}
						</SortableContext>
					</DndContext>

					{pinned.length && unpinned.length ? <div className="div" /> : ''}

					{unpinned.map((item, i) => (
						<VaultItem 
							key={`item-space-${item.id}`}
							item={item}
							onClick={e => onClick(e, item)}
							onMouseEnter={e => onMouseEnter(e, item)}
							onMouseLeave={() => Preview.tooltipHide()}
							onContextMenu={item.isButton ? null : e => onContextMenu(e, item)}
						/>
					))}
				</div>

				<div className="side bottom" onDragStart={e => e.preventDefault()}>
					{canCreate ? (
						<VaultItem 
							item={itemAdd}
							onClick={e => onClick(e, itemAdd)}
							onContextMenu={null}
							onMouseEnter={e => onMouseEnter(e, itemAdd)}
							onMouseLeave={() => Preview.tooltipHide()}
						/>
					) : ''}
					<VaultItem 
						item={itemSettings}
						onClick={e => onClick(e, itemSettings)}
						onContextMenu={null}
						onMouseEnter={e => onMouseEnter(e, itemSettings)}
						onMouseLeave={() => Preview.tooltipHide()}
					/>
				</div>
			</div>
		</div>
	);
}));

export default Vault;
