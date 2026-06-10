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

interface TextSelectionEnd {
	id: string;
	range: I.TextRange;
};

interface TextSelectionState {
	from: TextSelectionEnd;
	to: TextSelectionEnd;
};

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
	getTextSelection(): TextSelectionState | null;
	getTextSelectionIds(): string[];
	clearTextSelection(): void;
	isCrossSelecting(): boolean;
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

	const textAnchorId = useRef('');
	const crossSelecting = useRef(false);
	const crossState = useRef<TextSelectionState | null>(null);
	const crossContainer = useRef<HTMLElement | null>(null);
	const crossEvents = useRef<[string, EventListener][]>([]);
	const crossTimeout = useRef(0);
	const crossAnchor = useRef<{ node: Node; offset: number; id: string; model: number } | null>(null);
	const crossFrame = useRef(0);
	const selectionChangeHandler = useRef<(() => void) | null>(null);

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

		if (crossState.current) {
			// Shift+click extends the native cross-block selection, state is remapped on selectionchange
			if (e.shiftKey) {
				return;
			};
			clearTextSelection();
		};

		const targetValue = (e.target as HTMLElement).closest('.value');
		const targetBlock = targetValue?.closest('.block');

		textAnchorId.current = (targetBlock && targetValue?.closest('.blocks')) ? String(targetBlock.getAttribute('data-id') || '') : '';

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

		// Native painting and autoscroll are used during cross-block text selection, but the native drag
		// re-bases its anchor after the editing host change, so the selection is re-applied each frame
		if (crossSelecting.current) {
			hasMoved.current = true;
			scheduleCrossUpdate(e.clientX, e.clientY);
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
		if (crossSelecting.current) {
			if (isSelecting.current && hasMoved.current) {
				scheduleCrossUpdate(keyboard.mouse.client.x, keyboard.mouse.client.y);
			};
			return;
		};

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
		if (crossSelecting.current) {
			finalizeCrossSelect();
		};

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
			if (!crossSelecting.current && canCrossSelect(e)) {
				startCrossSelect(e);
			};

			if (crossSelecting.current) {
				initIds();
				renderSelection();
				return;
			};

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

	const caretFromPoint = (x: number, y: number): { node: Node; offset: number } | null => {
		const doc = document as any;

		if (doc.caretRangeFromPoint) {
			const r = doc.caretRangeFromPoint(x, y);
			return r ? { node: r.startContainer, offset: r.startOffset } : null;
		};

		if (doc.caretPositionFromPoint) {
			const p = doc.caretPositionFromPoint(x, y);
			return p ? { node: p.offsetNode, offset: p.offset } : null;
		};

		return null;
	};

	const canCrossSelect = (e: any): boolean => {
		if (!textAnchorId.current || keyboard.isCmd(e) || e.altKey || e.shiftKey) {
			return false;
		};

		const block = S.Block.getLeaf(keyboard.getRootId(), textAnchorId.current);
		if (!block || !block.isText()) {
			return false;
		};

		const sel = window.getSelection();
		if (!sel || !sel.rangeCount || !sel.anchorNode) {
			return false;
		};

		// The drag must still be anchored inside the block where it started
		const el = (sel.anchorNode.nodeType == Node.ELEMENT_NODE) ? sel.anchorNode as HTMLElement : sel.anchorNode.parentElement;
		const blockEl = el?.closest('.block');

		return blockEl?.getAttribute('data-id') == textAnchorId.current;
	};

	const startCrossSelect = (e: any) => {
		const sel = window.getSelection();
		const { anchorNode, anchorOffset } = sel;
		const el = (anchorNode.nodeType == Node.ELEMENT_NODE) ? anchorNode as HTMLElement : anchorNode.parentElement;
		const wrapper = el?.closest('.blocks') as HTMLElement;
		const value = el?.closest('.value') as HTMLElement;

		if (!wrapper || !value) {
			return;
		};

		// Merging blocks into a single editing host lets the native drag selection cross block boundaries
		crossContainer.current = wrapper;
		wrapper.setAttribute('contenteditable', 'true');
		wrapper.setAttribute('spellcheck', 'false');

		crossEvents.current = [
			[ 'beforeinput', e => crossGuard(e) ],
			[ 'cut', e => crossGuard(e) ],
			[ 'dragstart', e => crossGuard(e) ],
		];
		U.Dom.addEvents(wrapper, crossEvents.current);

		crossAnchor.current = {
			node: anchorNode,
			offset: anchorOffset,
			id: textAnchorId.current,
			model: getCrossOffset(value, anchorNode, anchorOffset),
		};

		crossSelecting.current = true;
		allowRect.current = false;

		// Changing the editing host re-bases the native drag anchor, so the selection is driven programmatically
		const x = (undefined === e.clientX) ? keyboard.mouse.client.x : e.clientX;
		const y = (undefined === e.clientY) ? keyboard.mouse.client.y : e.clientY;

		applyCrossUpdate(x, y);

		focus.clear(false);
		keyboard.setFocus(false);

		S.Common.clearTimeout('blockContext');
		S.Menu.close('blockContext');

		if (rectRef.current) {
			U.Dom.css(rectRef.current, { display: 'none' });
		};
	};

	const scheduleCrossUpdate = (x: number, y: number) => {
		raf.cancel(crossFrame.current);
		crossFrame.current = raf(() => applyCrossUpdate(x, y));
	};

	// Re-applies the selection from the saved anchor to the pointer, overriding the re-based native drag update
	const applyCrossUpdate = (x: number, y: number) => {
		if (!crossSelecting.current || !crossAnchor.current) {
			return;
		};

		const pos = caretFromPoint(x, y);
		if (!pos || !crossContainer.current?.contains(pos.node)) {
			return;
		};

		let { node, offset } = crossAnchor.current;

		// The anchor block can re-render on blur: recover the anchor from the model offset
		if (!node || !node.isConnected) {
			const value = U.Dom.select(`#block-${U.Common.esc(crossAnchor.current.id)} .value`) as HTMLElement;
			const restored = value ? nodeFromOffset(value, crossAnchor.current.model) : null;

			if (!restored) {
				return;
			};

			crossAnchor.current.node = node = restored.node;
			crossAnchor.current.offset = offset = restored.offset;
		};

		try {
			window.getSelection().setBaseAndExtent(node, offset, pos.node, pos.offset);
		} catch (e) { /**/ };
	};

	// DOM position of a model text offset within a block value (ZWS anchors excluded)
	const nodeFromOffset = (el: HTMLElement, model: number): { node: Node; offset: number } | null => {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

		let rest = model;
		let last = null;

		while (walker.nextNode()) {
			const node = walker.currentNode;
			const text = String(node.textContent || '');

			last = node;

			for (let i = 0; i < text.length; i++) {
				if (text[i] == '\u200B') {
					continue;
				};

				if (!rest) {
					return { node, offset: i };
				};
				rest--;
			};

			if (!rest) {
				return { node, offset: text.length };
			};
		};

		return last ? { node: last, offset: String(last.textContent || '').length } : null;
	};

	const crossGuard = (e: Event) => {
		if (crossSelecting.current || crossState.current) {
			e.preventDefault();
		};
	};

	const finalizeCrossSelect = () => {
		// The native drag can re-base the selection after the last scheduled update, re-apply before reading it
		raf.cancel(crossFrame.current);
		applyCrossUpdate(keyboard.mouse.client.x, keyboard.mouse.client.y);

		crossSelecting.current = false;

		const coverage = getCrossCoverage();

		if (!coverage.length) {
			clearTextSelection();
			return;
		};

		// Selection shrank back into a single block: restore the standard focus flow
		if (coverage.length == 1) {
			const { id, range } = coverage[0];

			clearTextSelection();
			focus.set(id, range);
			focus.apply();
			return;
		};

		crossState.current = { from: coverage[0], to: coverage[coverage.length - 1] };
		bindSelectionChange();
	};

	const getCrossCoverage = (): TextSelectionEnd[] => {
		const ret: TextSelectionEnd[] = [];
		const sel = window.getSelection();

		if (!sel || !sel.rangeCount || sel.isCollapsed || !crossContainer.current) {
			return ret;
		};

		const rootId = keyboard.getRootId();
		const r = sel.getRangeAt(0);
		const values = U.Dom.selectAll('.value.focusable', crossContainer.current);

		values.forEach((el: HTMLElement) => {
			const id = el.closest('.block')?.getAttribute('data-id');
			const block = id ? S.Block.getLeaf(rootId, id) : null;

			if (!block || !block.isText() || !r.intersectsNode(el)) {
				return;
			};

			const full = document.createRange();
			full.selectNodeContents(el);

			const length = block.getLength();
			const from = (full.compareBoundaryPoints(Range.START_TO_START, r) >= 0) ? 0 : getCrossOffset(el, r.startContainer, r.startOffset);
			const to = (full.compareBoundaryPoints(Range.END_TO_END, r) <= 0) ? length : getCrossOffset(el, r.endContainer, r.endOffset);

			if (to > from) {
				ret.push({ id, range: { from, to } });
			};
		});

		return ret;
	};

	// Model text offset of a selection boundary within a block value (ZWS anchors excluded, see Mark.domToModel)
	const getCrossOffset = (el: HTMLElement, node: Node, offset: number): number => {
		const prefix = document.createRange();

		prefix.selectNodeContents(el);

		try {
			prefix.setEnd(node, offset);
		} catch (e) {
			return 0;
		};

		return prefix.toString().replace(/\u200B/g, '').length;
	};

	const bindSelectionChange = () => {
		unbindSelectionChange();
		selectionChangeHandler.current = () => onSelectionChange();
		document.addEventListener('selectionchange', selectionChangeHandler.current);
	};

	const unbindSelectionChange = () => {
		window.clearTimeout(crossTimeout.current);

		if (selectionChangeHandler.current) {
			document.removeEventListener('selectionchange', selectionChangeHandler.current);
			selectionChangeHandler.current = null;
		};
	};

	const onSelectionChange = () => {
		if (crossSelecting.current || !crossState.current) {
			return;
		};

		window.clearTimeout(crossTimeout.current);
		crossTimeout.current = window.setTimeout(() => remapCrossSelect(), 150);
	};

	// Keeps state in sync when the native selection is extended (Shift+Arrow, Shift+Click) or dissolved
	const remapCrossSelect = () => {
		if (!crossState.current) {
			return;
		};

		const sel = window.getSelection();

		if (!sel || !sel.rangeCount || sel.isCollapsed) {
			clearTextSelection();
			return;
		};

		const coverage = getCrossCoverage();

		if (!coverage.length) {
			clearTextSelection();
			return;
		};

		if (coverage.length == 1) {
			const { id, range } = coverage[0];

			clearTextSelection();
			focus.set(id, range);
			focus.apply();
			return;
		};

		crossState.current = { from: coverage[0], to: coverage[coverage.length - 1] };
	};

	const clearTextSelection = () => {
		if (!crossState.current && !crossSelecting.current && !crossContainer.current) {
			return;
		};

		unbindSelectionChange();

		if (crossContainer.current) {
			if (crossEvents.current.length) {
				U.Dom.removeEvents(crossContainer.current, crossEvents.current);
				crossEvents.current = [];
			};

			crossContainer.current.removeAttribute('contenteditable');
			crossContainer.current.removeAttribute('spellcheck');
			crossContainer.current = null;
		};

		crossState.current = null;
		crossSelecting.current = false;

		window.getSelection()?.removeAllRanges();
	};

	const getTextSelection = (): TextSelectionState | null => {
		return crossState.current ? U.Common.objectCopy(crossState.current) : null;
	};

	// Ordered document slice of block ids covered by the cross-block text selection
	const getTextSelectionIds = (): string[] => {
		if (!crossState.current) {
			return [];
		};

		const { from, to } = crossState.current;
		const rootId = keyboard.getRootId();
		const list = S.Block.unwrapTree(S.Block.getTree(rootId, S.Block.getBlocks(rootId)));
		const idxStart = list.findIndex(it => it.id == from.id);
		const idxEnd = list.findIndex(it => it.id == to.id);

		if ((idxStart < 0) || (idxEnd < 0)) {
			return [];
		};

		return list.slice(Math.min(idxStart, idxEnd), Math.max(idxStart, idxEnd) + 1).map(it => it.id);
	};

	const clear = () => {
		clearTextSelection();
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
		textAnchorId.current = '';
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
		return () => {
			clearTextSelection();
			unbind();
		};
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
		getTextSelection,
		getTextSelectionIds,
		clearTextSelection,
		isCrossSelecting: () => crossSelecting.current,
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