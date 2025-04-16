import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { I, M, S, U, J, focus, keyboard, scrollOnMove } from 'Lib';

interface Props {
	children?: React.ReactNode;
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
};

const THRESHOLD = 20;

const SelectionProvider = observer(forwardRef<SelectionRefProps, Props>((props, ref) => {

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

	const rebind = () => {
		unbind();
		U.Common.getScrollContainer(keyboard.isPopup()).on('scroll.selection', e => onScroll(e));
	};

	const unbind = () => {
		unbindMouse();
		unbindKeyboard();
	};
	
	const unbindMouse = () => {
		$(window).off('mousemove.selection mouseup.selection');
	};
	
	const unbindKeyboard = () => {
		const isPopup = keyboard.isPopup();

		$(window).off('keydown.selection keyup.selection');
		U.Common.getScrollContainer(isPopup).off('scroll.selection');
	};

	const scrollToElement = (id: string, dir: number) => {
		const isPopup = keyboard.isPopup();

		if (dir > 0) {
			focus.scroll(isPopup, id);
		} else {
			const node = $('.focusable.c' + id);
			if (!node.length) {
				return;
			};

			const container = U.Common.getScrollContainer(isPopup);
			const no = node.offset().top;
			const nh = node.outerHeight();
			const st = container.scrollTop();
			const hh = J.Size.header;
			const y = isPopup ? (no - container.offset().top + st) : no;

			if (y <= st + hh) {
				container.scrollTop(y - nh - hh);
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
		const win = $(window);
		const container = U.Common.getScrollContainer(isPopup);
		const rect = $(rectRef.current);

		rect.toggleClass('fromPopup', isPopup);
		x.current = e.pageX;
		y.current = e.pageY;
		hasMoved.current = false;
		focusedId.current = focused;
		top.current = startTop.current = container.scrollTop();
		idsOnStart.current = new Map(ids.current);
		cacheChildrenMap.current.clear();
		cacheNodeMap.current.clear();
		setIsSelecting(true);

		keyboard.disablePreview(true);

		if (isPopup && container.length) {
			containerOffset.current = container.offset();
			x.current -= containerOffset.current.left;
			y.current -= containerOffset.current.top - top.current;
		};

		initNodes();
		target.current = $(e.target).closest('.selectionTarget');

		if (e.shiftKey && focused) {
			const type = target.current.attr('data-type') as I.SelectType;
			const id = target.current.attr('data-id');
			const ids = get(type);

			if (!ids.length && (id != focused)) {
				set(type, ids.concat([ focused ]));
			};
		};
		
		scrollOnMove.onMouseDown(e, isPopup);
		unbindMouse();

		win.on(`mousemove.selection`, e => onMouseMove(e));
		win.on(`blur.selection mouseup.selection`, e => onMouseUp(e));
	};

	const initNodes = () => {
		const list = getPageContainer().find('.selectionTarget');

		list.each((i: number, item: any) => {
			item = $(item);

			const id = item.attr('data-id');
			if (!id) {
				return;
			};

			const type = item.attr('data-type');
			const node = { id, type, obj: item };

			nodes.current.push(node);

			cacheNode(node);
			cacheChildrenIds(id);
		});
	};
	
	const onMouseMove = (e: any) => {
		if (keyboard.isSelectionDisabled) {
			hide();
			return;
		};

		const isPopup = keyboard.isPopup();
		const rect = getRect(x.current, y.current, e.pageX, e.pageY);

		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};
		
		top.current = U.Common.getScrollContainer(isPopup).scrollTop();
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
		const container = U.Common.getScrollContainer(isPopup);
		const st = container.scrollTop();
		const d = st > top.current ? 1 : -1;
		const cx = keyboard.mouse.page.x;
		const cy = keyboard.mouse.page.y + (!isPopup ? Math.abs(st - top.current) * d : 0);
		const rect = getRect(x.current, y.current, cx, cy);
		const wh = container.height();

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

					$(window).trigger('selectionClear');
				};
			} else {
				let needCheck = false;
				if (e.ctrlKey || e.metaKey) {
					for (const i in I.SelectType) {
						const list = idsOnStart.current.get(I.SelectType[i]) || [];

						needCheck = needCheck || Boolean(list.length);
					};
				};

				if (needCheck) {
					checkNodes(e);
				};
				
				const rootId = keyboard.getRootId();
				const ids = get(I.SelectType.Block, true);
				const target = $(e.target).closest('.selectionTarget');
				const id = target.attr('data-id');
				const type = target.attr('data-type');

				if (target.length && e.shiftKey && ids.length && (type == I.SelectType.Block)) {
					const first = ids.length ? ids[0] : focusedId.current;
					const tree = S.Block.getTree(rootId, S.Block.getBlocks(rootId));
					const list = S.Block.unwrapTree(tree);
					const idxStart = list.findIndex(it => it.id == first);
					const idxEnd = list.findIndex(it => it.id == id);
					const start = idxStart < idxEnd ? idxStart : idxEnd;
					const end = idxStart < idxEnd ? idxEnd : idxStart;
					const slice = list.slice(start, end + 1).
						map(it => new M.Block(it)).
						filter(it => it.isSelectable()).
						map(it => it.id);

					set(type, ids.concat(slice));
				};
			};
		} else {
			$(window).trigger('selectionEnd');
		};
		
		scrollOnMove.onMouseUp(e);

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

		const el = $(rectRef.current);
		const x1 = x.current + ox;
		const y1 = y.current + oy;
		const rect = getRect(x1, y1, dx, dy);

		if (allowRect.current) {
			el.show().css({ transform: `translate3d(${rect.x}px, ${rect.y}px, 0px)`, width: rect.width, height: rect.height });
		} else {
			el.hide();	
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

		const offset = node.obj.offset();
		const rect = node.obj.get(0).getBoundingClientRect() as DOMRect;
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

		if (e.ctrlKey || e.metaKey) {
			list = (idsOnStart.current.get(type) || []).includes(node.id) ? list.filter(it => it != node.id) : list.concat(node.id);
		} else
		if (e.altKey) {
			list = list.filter(it => it != node.id);
		} else {
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

		if (!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
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

		if ((!target.current.length && !allowRect.current) || isAllowedRect()) {
			allowRect.current = true;
		};

		if (!length) {
			renderSelection();
			return;
		};

		if ((length == 1) && !(e.ctrlKey || e.metaKey)) {
			const selected = $(`#block-${list[I.SelectType.Block][0]}`);
			const value = selected.find('#value');

			if (!value.length) {
				return;
			};

			const el = value.get(0) as Element;
			const rc = getRange(el);
			
			if (!range.current) {
				focusedId.current = selected.attr('data-id');
				range.current = rc;
			};

			if (range.current) {
				if (range.current.end) {
					initIds();
				};
				
				if (!rc) {
					focus.set(focusedId.current, { from: range.current.start, to: range.current.end });
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
		$(rectRef.current).hide();
		unbindMouse();
	};
	
	const clear = () => {
		initIds();
		renderSelection();
		clearState();

		$(window).trigger('selectionClear');
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
		return $(U.Common.getCellContainer(keyboard.isPopup() ? 'popup' : 'page'));
	};

	const renderSelection = () => {
		const { config } = S.Common;
		const container = getPageContainer();

		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			$('.isSelectionSelected').removeClass('isSelectionSelected');

			for (const i in I.SelectType) {
				const type = I.SelectType[i];
				const list = get(type, true);

				if (!list.length) {
					continue;
				};

				if (config.debug.ui) {
					console.log('renderSelection', type, list);
					console.trace();
				};

				for (const id of list) {
					container.find(`#selectionTarget-${id}`).addClass('isSelectionSelected');

					if (type == I.SelectType.Block) {
						container.find(`#block-${id}`).addClass('isSelectionSelected');

						const childrenIds = getChildrenIds(id);
						if (childrenIds.length) {
							childrenIds.forEach(childId => {
								container.find(`#block-${childId}`).addClass('isSelectionSelected');
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
		const st = U.Common.getScrollContainer(isPopup).scrollTop();
		const { left, top } = containerOffset.current;

		x -= left;
		y -= top - st;

		return { x, y };
	};
	
	const setIsSelecting = (v: boolean) => {
		isSelecting.current = v;
		$('html').toggleClass('isSelecting', v);
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	});

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
	}));

	return (
		<div 
			id="selection" 
			className="selection" 
			onMouseDown={onMouseDown}
		>
			<div ref={rectRef} id="selection-rect" />
			{children}
		</div>
	);

}));

export default SelectionProvider;
