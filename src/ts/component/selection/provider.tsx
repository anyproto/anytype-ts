import React, { forwardRef, useRef, useEffect, useImperativeHandle, ReactNode, MouseEvent } from 'react';
import raf from 'raf';
import { getRange } from 'selection-ranges';
import * as I from 'Interface';
import * as M from 'Model';
import { focus } from 'Lib/focus';

interface Props {
	children?: ReactNode;
};

type ContextMenuHandler = (e: MouseEvent, ids: string[]) => void;

interface SelectionRefProps {
	get(type: I.SelectType): string[];
	getForClick(id: string, withChildren: boolean, save: boolean): string[];
	set(type: I.SelectType, ids: string[]): void;
	clear(): void;
	scrollToElement(id: string, dir: number): void;
	renderSelection(): void;
	isSelecting(): boolean;
	setIsSelecting(v: boolean): void;
	hide(): void;
	rebind(): void;
	setContextMenuHandler(handler: ContextMenuHandler | null): void;
};

const THRESHOLD = 20;

const SelectionProvider = forwardRef<SelectionRefProps, Props>((props, ref) => {

	const x = useRef(0);
	const y = useRef(0);
	const focusedId = useRef('');
	const range = useRef(null);
	const nodes = useRef([]);
	const top = useRef(0);
	const startTop = useRef(0);
	const containerOffset = useRef(null);
	const frame = useRef(0);
	const hasMoved = useRef(false);
	const isSelecting = useRef(false);
	const cacheNodeMap = useRef(new Map());
	const cacheChildrenMap = useRef(new Map());
	const ids = useRef(new Map());
	const idsOnStart = useRef(new Map());
	const { list } = S.Popup;
	const { children } = props;
	const length = list.length;
	const rectRef = useRef(null);
	const allowRect = useRef(false);
	const target = useRef(null);
	const contextMenuHandler = useRef<ContextMenuHandler | null>(null);

	const mouseEvents = useRef<[string, EventListener][]>([]);
	const scrollContainer = useRef<EventTarget | null>(null);
	const scrollEvent = useRef<[string, EventListener][]>([]);

	const rebind = () => {
		unbind();
		const container = U.Dom.getScrollContainer(keyboard.isPopup());
		if (container) {
			scrollContainer.current = container;
			scrollEvent.current = [ [ 'scroll', (e: Event) => onScroll(e) ] ];
			U.Dom.addEvents(container, scrollEvent.current);
		};
	};

	const unbindMouse = () => {
		if (mouseEvents.current.length) {
			U.Dom.removeEvents(window, mouseEvents.current);
			mouseEvents.current = [];
		};
	};

	const unbind = () => {
		unbindMouse();
		if (scrollContainer.current && scrollEvent.current.length) {
			U.Dom.removeEvents(scrollContainer.current, scrollEvent.current);
			scrollContainer.current = null;
			scrollEvent.current = [];
		};
	};

	const scrollToElement = (id: string, dir: number) => {
		const isPopup = keyboard.isPopup();

		if (dir > 0) {
			focus.scroll(isPopup, id);
		} else {
			const node = U.Dom.select(`.focusable.c${U.Common.esc(id)}`);
			if (!node) {
				return;
			};

			const container = U.Dom.getScrollContainer(isPopup);
			if (!container) {
				return;
			};

			const no = node.getBoundingClientRect().top;
			const nh = node.offsetHeight;
			const st = container.scrollTop;
			const hh = J.Size.header;
			const y = no - container.getBoundingClientRect().top + st;

			if (y <= st + hh) {
				container.scrollTop = y - nh - hh;
			};
		};
	};
	
	const onMouseDown = (e: any) => {
		if (
			e.button ||
			S.Menu.isOpen('', '', [ 'onboarding', 'searchText' ]) ||
			S.Popup.isOpen('', [ 'page' ])
		) {
			return;
		};

		if (keyboard.isSelectionDisabled) {
			hide();
			return;
		};
		
		const isPopup = keyboard.isPopup();
		const { focused } = focus.state;
		const container = U.Dom.getScrollContainer(isPopup);
		const rect = rectRef.current;

		U.Dom.toggleClass(rect, 'fromPopup', isPopup);
		x.current = e.pageX;
		y.current = e.pageY;
		hasMoved.current = false;
		focusedId.current = focused;
		top.current = startTop.current = container?.scrollTop || 0;
		idsOnStart.current = new Map(ids.current);
		cacheChildrenMap.current.clear();
		cacheNodeMap.current.clear();
		setIsSelecting(true);

		keyboard.disablePreview(true);

		if (container) {
			const containerRect = container.getBoundingClientRect();
			containerOffset.current = { left: containerRect.left, top: containerRect.top + (container.scrollTop || 0) };
			x.current -= containerOffset.current.left;
			y.current -= containerOffset.current.top - top.current;
		};

		initNodes();
		target.current = (e.target as HTMLElement).closest('.selectionTarget');

		if (e.shiftKey && focused) {
			const type = target.current?.getAttribute('data-type') as I.SelectType;
			const id = target.current?.getAttribute('data-id');
			const ids = get(type);

			if (!ids.length && (id != focused)) {
				set(type, ids.concat([ focused ]));
			};
		};
		
		scrollOnMove.onMouseDown({ container: container || undefined });
		unbindMouse();

		mouseEvents.current = [
			[ 'mousemove', (e: any) => onMouseMove(e) ],
			[ 'mouseup', (e: any) => onMouseUp(e) ],
			[ 'blur', (e: any) => onMouseUp(e) ],
		];
		U.Dom.addEvents(window, mouseEvents.current);
	};

	const initNodes = () => {
		const container = getPageContainer();
		if (!container) {
			return;
		};

		const list = U.Dom.selectAll('.selectionTarget', container);

		list.forEach((el: Element) => {
			const id = el.getAttribute('data-id');
			if (!id) {
				return;
			};

			const type = el.getAttribute('data-type');
			const node = { id, type, obj: el };

			nodes.current.push(node);

			cacheNode(node);
			cacheChildrenIds(id);
		});
	};
	
	const onMouseMove = (e: any) => {
		if (keyboard.isSelectionDisabled || keyboard.isDragging) {
			hide();
			return;
		};

		const isPopup = keyboard.isPopup();
		const { x: x1, y: y1 } = recalcCoords(e.pageX, e.pageY);
		const rect = getRect(x.current, y.current, x1, y1);

		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};
		
		top.current = U.Dom.getScrollContainer(isPopup)?.scrollTop || 0;
		checkNodes(e);
		drawRect(e.pageX, e.pageY);
		hasMoved.current = true;

		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	const onScroll = (e: any) => {
		if (!isSelecting.current || !hasMoved.current || keyboard.isSelectionDisabled) {
			return;
		};

		const isPopup = keyboard.isPopup();
		const container = U.Dom.getScrollContainer(isPopup);
		const st = container?.scrollTop || 0;
		const d = st > top.current ? 1 : -1;
		const cx = keyboard.mouse.page.x;
		const cy = keyboard.mouse.page.y + Math.abs(st - top.current) * d;
		const rect = getRect(x.current, y.current, cx, cy);
		const wh = container?.clientHeight || 0;

		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};

		if (Math.abs(st - startTop.current) >= wh / 2) {
			initNodes();
			startTop.current = st;
		} else {
			nodes.current.forEach(it => cacheNode(it));
		};

		checkNodes({ ...e, pageX: cx, pageY: cy });
		drawRect(cx, cy);

		scrollOnMove.onMouseMove(keyboard.mouse.client.x, keyboard.mouse.client.y);
		hasMoved.current = true;
	};
	
	const onMouseUp = (e: any) => {
		if (!hasMoved.current) {
			if (!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
				if (!keyboard.isSelectionClearDisabled) {
					initIds();
					renderSelection();

					U.Dom.eventDispatch(window, 'selectionClear');
				};
			} else {
				if (keyboard.isCmd(e)) {
					const t = (e.target as HTMLElement).closest('.selectionTarget');
					const type = t?.getAttribute('data-type') as I.SelectType;
					const startRecordIds = idsOnStart.current.get(I.SelectType.Record) || [];

					if ((type != I.SelectType.Record) || startRecordIds.length) {
						checkNodes(e);
					};
				};
				
				const rootId = keyboard.getRootId();
				const currentIds = get(I.SelectType.Block, false);
				const target = (e.target as HTMLElement).closest('.selectionTarget') as HTMLElement;
				const id = target?.getAttribute('data-id');
				const type = target?.getAttribute('data-type') as I.SelectType;

				if (target && e.shiftKey && (type == I.SelectType.Block)) {
					const first = (currentIds.length && currentIds[0]) ? currentIds[0] : focusedId.current;

					if (first && id && (first !== id)) {
						const tree = S.Block.getTree(rootId, S.Block.getBlocks(rootId));
						const list = S.Block.unwrapTree(tree);
						const idxStart = list.findIndex(it => it.id == first);
						const idxEnd = list.findIndex(it => it.id == id);

						if ((idxStart !== -1) && (idxEnd !== -1)) {
							const start = Math.min(idxStart, idxEnd);
							const end = Math.max(idxStart, idxEnd);
							const slice = list.slice(start, end + 1).
								map(it => new M.Block(it)).
								filter(it => it.isSelectable()).
								map(it => it.id);

							set(type, slice);
						};
					};
				};
			};
		} else {
			U.Dom.eventDispatch(window, 'selectionEnd');
		};
		
		scrollOnMove.onMouseUp();

		const list = ids.current.get(I.SelectType.Block) || [];
		
		if (list.length) {
			focus.clear(true);
			S.Menu.close('blockContext');
		};

		clearState();
	};

	const initIds = () => {
		for (const i in I.SelectType) {
			ids.current.set(I.SelectType[i], []);
		};
	};

	const drawRect = (dx: number, dy: number) => {
		if (!nodes.current.length) {
			return;
		};

		let ox = 0;
		let oy = 0;

		if (containerOffset.current) {
			ox = containerOffset.current.left;
			oy = containerOffset.current.top - top.current;
		};

		const el = rectRef.current;
		const x1 = x.current + ox;
		const y1 = y.current + oy;
		const rect = getRect(x1, y1, dx, dy);

		if (!el) {
			return;
		};

		if (allowRect.current) {
			U.Dom.css(el, {
				display: 'block',
				transform: `translate3d(${rect.x}px, ${rect.y}px, 0px)`,
				width: `${rect.width}px`,
				height: `${rect.height}px`,
			});
		} else {
			U.Dom.css(el, { display: 'none' });
		};
	};
	
	const getRect = (x1: number, y1: number, x2: number, y2: number) => {
		return {
			x: Math.min(x1, x2),
			y: Math.min(y1, y2),
			width: Math.abs(x2 - x1),
			height: Math.abs(y2 - y1),
		};
	};
	
	const cacheNode = (node: any): { x: number; y: number; width: number; height: number; } => {
		if (!node.id) {
			return { x: 0, y: 0, width: 0, height: 0 };
		};

		let cache = cacheNodeMap.current.get(node.id);
		if (cache) {
			return cache;
		};

		const elRect = node.obj.getBoundingClientRect();
		const offset = { left: elRect.left + window.scrollX, top: elRect.top + window.scrollY };
		const rect = U.Dom.getElementRect(node.obj);
		const { x, y } = recalcCoords(offset.left, offset.top);

		cache = { x, y, width: rect.width, height: rect.height };

		cacheNodeMap.current.set(node.id, cache);
		return cache;
	};
	
	const checkEachNode = (e: any, type: I.SelectType, rect: any, node: any, list: string[]): string[] => {
		const cache = cacheNode(node);

		if (!cache || !U.Common.rectsCollide(rect, cache)) {
			return list;
		};

		if (keyboard.isCmd(e)) {
			list = (idsOnStart.current.get(type) || []).includes(node.id) ? list.filter(it => it != node.id) : list.concat(node.id);
		} else
		if (e.altKey) {
			list = list.filter(it => it != node.id);
		} else 
		if (!list.includes(node.id)) {
			list.push(node.id);
		};

		return list;
	};

	const isAllowedRect = () => {
		const match = keyboard.getMatch();
		return [ 'set', 'type', 'relation' ].includes(match.params.action);
	};

	const checkNodes = (e: any) => {
		const recalc = recalcCoords(e.pageX, e.pageY);
		const rect = U.Common.objectCopy(getRect(x.current, y.current, recalc.x, recalc.y));

		if (!e.shiftKey && !e.altKey && !keyboard.isCmd(e)) {
			initIds();
		};

		const list = {};

		for (const i in I.SelectType) {
			const type = I.SelectType[i];

			list[type] = get(type, false);

			nodes.current.filter(it => it.type == type).forEach(item => {
				list[type] = checkEachNode(e, type, rect, item, list[type]);
			});

			ids.current.set(type, list[type]);
		};

		const length = (list[I.SelectType.Block] || []).length;

		if ((!target.current && !allowRect.current) || isAllowedRect()) {
			allowRect.current = true;
		};

		if (!length) {
			renderSelection();
			return;
		};

		if ((length == 1) && !keyboard.isCmd(e)) {
			const selected = U.Dom.get(`block-${list[I.SelectType.Block][0]}`);
			const value = selected ? U.Dom.select('#value', selected) : null;

			if (!value) {
				renderSelection();
				return;
			};

			const el = value as Element;
			const rc = getRange(el);

			if (!range.current) {
				focusedId.current = selected?.getAttribute('data-id');
				range.current = rc;
			} else 
			if (rc) {
				const anchor = range.current.anchor !== undefined ? range.current.anchor : range.current.start;
				range.current = { ...rc, anchor };
			};

			if (range.current) {
				if (range.current.end) {
					initIds();
				};

				if (!rc) {
					const anchor = range.current.anchor !== undefined ? range.current.anchor : range.current.start;
					
					// Find extent: the point that's different from anchor (handles backward selection)
					let extent = anchor;
					if ((range.current.start !== undefined) && (range.current.start !== anchor)) {
						extent = range.current.start;
					} else 
					if ((range.current.end !== undefined) && (range.current.end !== anchor)) {
						extent = range.current.end;
					};

					focus.set(focusedId.current, { from: Math.min(anchor, extent), to: Math.max(anchor, extent) });
					focus.apply();

					allowRect.current = false;
				};
			};
		} else {
			const { focused, range: fr } = focus.state;

			if (focused && fr.to) {
				focus.clear(false);
			};
			
			keyboard.setFocus(false);
			window.getSelection().empty();
			window.focus();

			allowRect.current = true;
		};

		renderSelection();		
	};

	const hide = () => {
		if (rectRef.current) {
			U.Dom.css(rectRef.current, { display: 'none' });
		};
		unbindMouse();
	};
	
	const clear = () => {
		initIds();
		renderSelection();
		clearState();

		U.Dom.eventDispatch(window, 'selectionClear');
	};

	const clearState = () => {
		keyboard.disablePreview(false);
		hide();
		setIsSelecting(false);
		cacheNodeMap.current.clear();
		focusedId.current = '';
		nodes.current = [];
		range.current = null;
		containerOffset.current = null;
		allowRect.current = false;
		target.current = null;
	};

	const set = (type: I.SelectType, list: string[]) => {
		ids.current.set(type, U.Common.arrayUnique(list || []));
		renderSelection();
	};
	
	const get = (type: I.SelectType, withChildren?: boolean): string[] => {
		let list: string[] = [ ...new Set(ids.current.get(type) || []) ] as string[];

		if (!list.length) {
			return [];
		};

		if (type != I.SelectType.Block) {
			return list;
		};

		// Sort blocks by their document tree order
		const rootId = keyboard.getRootId();
		const tree = S.Block.getTree(rootId, S.Block.getChildren(rootId, rootId));
		const treeOrder = S.Block.unwrapTree(tree).map(it => it.id);
		const orderMap = new Map(treeOrder.map((id, idx) => [ id, idx ]));

		list.sort((a, b) => {
			const idxA = orderMap.get(a) ?? -1;
			const idxB = orderMap.get(b) ?? -1;
			return idxA - idxB;
		});

		let ret = [];

		if (withChildren) {
			list.forEach(id => {
				ret.push(id);
				ret = ret.concat(getChildrenIds(id));
			});
		} else {
			let childrenIds = [];

			list.forEach(id => {
				childrenIds = childrenIds.concat(getChildrenIds(id));
			});

			if (childrenIds.length) {
				list = list.filter(it => !childrenIds.includes(it));
			};

			ret = list;
		};

		return ret;
	};

	// Used to click and set selection automatically in block menu for example
	const getForClick = (id: string, withChildren: boolean, save: boolean): string[] => {
		let ids: string[] = get(I.SelectType.Block, withChildren);

		if (id && !ids.includes(id)) {
			clear();
			set(I.SelectType.Block, [ id ]);

			ids = get(I.SelectType.Block, withChildren);

			if (!save) {
				clear();
			};
		};
		return ids;
	};

	const cacheChildrenIds = (id: string): string[] => {
		const rootId = keyboard.getRootId();
		const block = S.Block.getLeaf(rootId, id);

		if (!block) {
			return [];
		};

		let ids = [];

		if (!block.isTable()) {
			const childrenIds = S.Block.getChildrenIds(rootId, id);

			for (const childId of childrenIds) {
				ids.push(childId);
				ids = ids.concat(cacheChildrenIds(childId));
			};
		};

		cacheChildrenMap.current.set(id, [ ...ids ]);
		return ids;
	};

	const getChildrenIds = (id: string) => {
		return cacheChildrenMap.current.get(id) || [];
	};

	const getPageContainer = () => {
		return U.Dom.getPageFlexContainer(keyboard.isPopup());
	};

	const renderSelection = () => {
		const container = getPageContainer();

		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			if (!container) {
				U.Dom.selectAll('.isSelectionSelected').forEach(el => U.Dom.removeClass(el, 'isSelectionSelected'));
				return;
			};

			U.Dom.selectAll('.isSelectionSelected', container).forEach(el => U.Dom.removeClass(el, 'isSelectionSelected'));

			for (const i in I.SelectType) {
				const type = I.SelectType[i];
				const list = get(type, true);

				if (!list.length) {
					continue;
				};

				for (const id of list) {
					U.Dom.addClass(U.Dom.select(`#selectionTarget-${U.Common.esc(id)}`, container), 'isSelectionSelected');

					if (type == I.SelectType.Block) {
						U.Dom.addClass(U.Dom.select(`#block-${U.Common.esc(id)}`, container), 'isSelectionSelected');

						const childrenIds = getChildrenIds(id);
						if (childrenIds.length) {
							childrenIds.forEach(childId => {
								U.Dom.addClass(U.Dom.select(`#block-${U.Common.esc(childId)}`, container), 'isSelectionSelected');
							});
						};
					};
				};
			};
		});
	};

	const recalcCoords = (x: number, y: number): { x: number, y: number } => {
		if (!containerOffset.current) {
			return { x, y };
		};

		const isPopup = keyboard.isPopup();
		const st = U.Dom.getScrollContainer(isPopup)?.scrollTop || 0;
		const { left, top } = containerOffset.current;

		x -= left;
		y -= top - st;

		return { x, y };
	};
	
	const setIsSelecting = (v: boolean) => {
		isSelecting.current = v;
		U.Dom.toggleClass(document.documentElement, 'isSelecting', v);
	};

	const handleContextMenu = (e: MouseEvent) => {
		const handler = contextMenuHandler.current;

		if (!handler) {
			return;
		};

		const selectedIds = get(I.SelectType.Block, false);

		if (!selectedIds.length) {
			return;
		};

		// Check if clicking on a block that will handle its own context menu
		const el = e.target as HTMLElement;
		const block = el.closest('.block');
		if (block && U.Dom.select('.dropTarget', block)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		handler(e, selectedIds);
	};

	const setContextMenuHandler = (handler: ContextMenuHandler | null) => {
		contextMenuHandler.current = handler;
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useImperativeHandle(ref, () => ({
		get,
		getForClick,
		set,
		clear,
		scrollToElement,
		renderSelection,
		isSelecting: () => isSelecting.current,
		setIsSelecting,
		hide,
		rebind,
		setContextMenuHandler,
	}));

	return (
		<div
			id="selection"
			className="selection"
			onMouseDown={onMouseDown}
			onContextMenu={handleContextMenu}
		>
			<div ref={rectRef} id="selection-rect" />
			{children}
		</div>
	);

});

export default SelectionProvider;