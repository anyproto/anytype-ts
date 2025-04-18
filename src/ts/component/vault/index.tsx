import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, U, S, C, Key, keyboard, translate, analytics, Storage, Preview, sidebar, Action } from 'Lib';
import VaultItem from './item';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';

interface VaultRefProps {
	toggleClass: (name: string, value: boolean) => void;
	setActive: (id: string) => void;
	getNode: () => HTMLElement;
};

const Vault = observer(forwardRef<VaultRefProps>((props, ref) => {

	const { config } = S.Common;
	const nodeRef = useRef(null);
	const { showVault } = S.Common;
	const checkKeyUp = useRef(false);
	const closeSidebar = useRef(false);
	const closeVault = useRef(false);
	const top = useRef(0);
	const timeoutHover = useRef(0);
	const pressed = useRef(new Set());
	const isSubscribed = useRef(false);
	const n = useRef(-1);
	const [ dummy, setDummy ] = useState(0);
	const items = U.Menu.getVaultItems();
	const cn = [ 'vault' ];
	const counters = S.Chat.getTotalCounters();
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

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			checkKeyUp.current = true;
			pressed.current.add(key);
		};

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			pressed.current.add(key);
		};

		keyboard.shortcut('ctrl+tab, ctrl+shift+tab', e, pressed => {
			checkKeyUp.current = true;
			onArrow(pressed.match('shift') ? -1 : 1);

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
	};

	const onKeyUp = (e: any) => {
		const key = String(e.key || '').toLowerCase();
		if (!key) {
			return;
		};

		pressed.current.delete(key);

		if (
			(pressed.current.has(Key.ctrl) || 
			pressed.current.has(Key.tab) || 
			pressed.current.has(Key.shift)) ||
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
			if (item.targetSpaceId != S.Common.space) {
				U.Router.switchSpace(item.targetSpaceId, '', true, { animate: true }, false);
			};
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
				Action.createSpace(analytics.route.vault);
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
				U.Router.switchSpace(item.targetSpaceId, '', true, { replace: true, animate: true }, false);
				break;
			};
		};
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
		const { active, over } = result;
		const ids = U.Menu.getVaultItems().map(it => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);

		Storage.set('spaceOrder', arrayMove(ids, oldIndex, newIndex));

		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		setDummy(dummy + 1);

		analytics.event('ReorderSpace');
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

		Preview.tooltipShow({ 
			text: U.Common.htmlSpecialChars(item.name), 
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
		S.Chat.setBadge(counters);
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

	const itemSettings = { id: 'settings', name: translate('commonSettings'), isButton: true };	

	return (
		<div 
			ref={nodeRef}
			id="vault"
			className={cn.join(' ')}
		>
			<div className="head" />
			<div className="body">
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
						<div id="scroll" className="side top" onScroll={onScroll}>
							{items.map((item, i) => (
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
					</SortableContext>
				</DndContext>

				<div className="side bottom" onDragStart={e => e.preventDefault()}>
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