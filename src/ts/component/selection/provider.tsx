import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { I, M, focus, keyboard, scrollOnMove, Util } from 'Lib';
import { blockStore, menuStore, popupStore } from 'Store';

interface Props {
	children?: React.ReactNode;
};

const THRESHOLD = 10;

const SelectionProvider = observer(class SelectionProvider extends React.Component<Props> {

	_isMounted = false;
	x = 0;
	y = 0;
	dir = 0;
	moved = false;
	focused = '';
	range: any = null;
	nodes: any[] = [];
	top = 0;
	containerOffset = null;
	frame = 0;

	cache: Map<string, any> = new Map();
	ids: Map<string, string[]> = new Map();
	idsOnStart: Map<string, string[]> = new Map();

	isSelecting = false;
	
	constructor (props: Props) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
	};

	render () {
		const children = this.injectProps(this.props.children);
		return (
			<div 
				id="selection" 
				className="selection" 
				onMouseDown={this.onMouseDown}
			>
				<div id="selection-rect" />
				{children}
			</div>
		);
	};
	
	componentDidMount () {
		const isPopup = keyboard.isPopup();

		this._isMounted = true;
		this.unbind();

		Util.getScrollContainer(isPopup).on('scroll.selection', (e: any) => { this.onScroll(e); });
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		this.unbindMouse();
		this.unbindKeyboard();
	};
	
	unbindMouse () {
		$(window).off('mousemove.selection mouseup.selection');
	};
	
	unbindKeyboard () {
		const isPopup = keyboard.isPopup();

		$(window).off('keydown.selection keyup.selection');
		(Util.getScrollContainer(isPopup)).off('scroll.selection');
	};

	scrollToElement (id: string, dir: number) {
		const isPopup = keyboard.isPopup();

		if (dir > 0) {
			focus.scroll(isPopup, id);
		} else {
			const node = $('.focusable.c' + id);
			if (!node.length) {
				return;
			};

			const container = Util.getScrollContainer(isPopup);
			const no = node.offset().top;
			const nh = node.outerHeight();
			const st = container.scrollTop();
			const hh = Util.sizeHeader();
			const y = isPopup ? (no - container.offset().top + st) : no;

			if (y <= st + hh) {
				container.scrollTop(y - nh - hh);
			};
		};
	};
	
	onMouseDown (e: any) {
		const isPopup = keyboard.isPopup();

		if (e.button || !this._isMounted || menuStore.isOpen() || (!isPopup && popupStore.isOpen())) {
			return;
		};
		
		if (keyboard.isSelectionDisabled) {
			this.hide();
			return;
		};
		
		const { focused } = focus.state;
		const win = $(window);
		const nodes = this.getPageContainer().find('.selectable');
		const container = Util.getScrollContainer(isPopup);
		const selectionRect = $('#selection-rect');

		isPopup ? selectionRect.addClass('fromPopup') : selectionRect.removeClass('fromPopup');
		
		this.x = e.pageX;
		this.y = e.pageY;
		this.moved = false;
		this.focused = focused;
		this.top = container.scrollTop();
		this.cache.clear();
		this.idsOnStart = new Map(this.ids);
		this.setIsSelecting(true);

		keyboard.disablePreview(true);

		if (isPopup && container.length) {
			this.containerOffset = container.offset();
			this.x -= this.containerOffset.left;
			this.y -= this.containerOffset.top - this.top;
		};

		nodes.each((i: number, item: any) => {
			item = $(item);

			const node = {
				id: item.attr('data-id'),
				type: item.attr('data-type'),
				obj: item,
			};

			this.nodes.push(node);
			this.cacheRect(node);
		});

		if (keyboard.isShift()) {
			let target = $(e.target).closest('.selectable');
			let type = target.attr('data-type') as I.SelectType;
			let id = target.attr('data-id');
			let ids = this.get(type);

			if (!ids.length && (id != focused)) {
				this.set(type, ids.concat([ focused ]));
			};
		};
		
		scrollOnMove.onMouseDown(e, isPopup);
		this.unbindMouse();

		win.on(`mousemove.selection`, (e: any) => { this.onMouseMove(e); });
		win.on(`blur.selection mouseup.selection`, (e: any) => { this.onMouseUp(e); });
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		if (keyboard.isSelectionDisabled) {
			this.hide();
			return;
		};

		const isPopup = keyboard.isPopup();
		const rect = this.getRect(this.x, this.y, e.pageX, e.pageY);

		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};
		
		this.top = Util.getScrollContainer(isPopup).scrollTop();
		this.checkNodes(e);
		this.drawRect(e.pageX, e.pageY);
		this.moved = true;

		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	onScroll (e: any) {
		if (!this.isSelecting || !this.moved) {
			return;
		};

		const isPopup = keyboard.isPopup();
		const top = Util.getScrollContainer(isPopup).scrollTop();
		const d = top > this.top ? 1 : -1;
		const x = keyboard.mouse.page.x;
		const y = keyboard.mouse.page.y + Math.abs(top - this.top) * d;
		const rect = this.getRect(this.x, this.y, x, y);

		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};

		this.nodes.forEach(it => this.cacheRect(it));

		this.checkNodes({ ...e, pageX: x, pageY: y });
		this.drawRect(x, y);
		this.renderSelection();

		scrollOnMove.onMouseMove(keyboard.mouse.client.x, keyboard.mouse.client.y);
		this.moved = true;
	};
	
	onMouseUp (e: any) {
		if (!this._isMounted) {
			return;
		};

		if (!this.moved) {
			if (!keyboard.isShift() && !keyboard.isAlt() && !keyboard.isCtrlOrMeta()) {
				if (!keyboard.isSelectionClearDisabled) {
					this.initIds();
					this.renderSelection();

					$(window).trigger('selectionClear');
				};
			} else {
				let needCheck = false;
				if (keyboard.isCtrlOrMeta()) {
					for (let i in I.SelectType) {
						const idsOnStart = this.idsOnStart.get(I.SelectType[i]) || [];
						needCheck = needCheck || Boolean(idsOnStart.length);
					};
				};

				if (needCheck) {
					this.checkNodes(e);
				};
				
				const ids = this.get(I.SelectType.Block, true);
				const target = $(e.target).closest('.selectable');
				const id = target.attr('data-id');
				const type = target.attr('data-type');
				
				if (target.length && keyboard.isShift() && ids.length && (type == I.SelectType.Block)) {
					const rootId = keyboard.getRootId();
					const first = ids.length ? ids[0] : this.focused;
					const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
					const list = blockStore.unwrapTree(tree);
					const idxStart = list.findIndex(it => it.id == first);
					const idxEnd = list.findIndex(it => it.id == id);
					const start = idxStart < idxEnd ? idxStart : idxEnd;
					const end = idxStart < idxEnd ? idxEnd : idxStart;
					const slice = list.slice(start, end + 1).
						map(it => new M.Block(it)).
						filter(it => it.isSelectable()).
						map(it => it.id);

					this.set(type, ids.concat(slice));
				};
			};
		} else {
			$(window).trigger('selectionEnd');
		};
		
		scrollOnMove.onMouseUp(e);

		this.checkSelected(I.SelectType.Block);
		this.clearState();
	};

	initIds () {
		for (let i in I.SelectType) {
			this.ids.set(I.SelectType[i], []);
		};
	};

	clearState () {
		keyboard.disablePreview(false);
		
		this.hide();
		this.setIsSelecting(false);

		this.cache.clear();
		this.focused = '';
		this.range = null;
		this.nodes = [];
	};

	drawRect (x: number, y: number) {
		if (!this.nodes.length) {
			return;
		};

		const el = $('#selection-rect');
		const range = Util.selectionRange();
		const isPopup = keyboard.isPopup();

		let x1 = this.x;
		let y1 = this.y;

		if (isPopup) {
			x1 = x1 + this.containerOffset.left;
			y1 = y1 + this.containerOffset.top - this.top;
		};

		const rect = this.getRect(x1, y1, x, y);

		if (range) {
			el.hide();
		} else {
			el.show().css({ transform: `translate3d(${rect.x}px, ${rect.y}px, 0px)`, width: rect.width, height: rect.height });
		};
	};
	
	getRect (x1: number, y1: number, x2: number, y2: number) {
		return {
			x: Math.min(x1, x2),
			y: Math.min(y1, y2),
			width: Math.abs(x2 - x1),
			height: Math.abs(y2 - y1),
		};
	};
	
	cacheRect (node: any) {
		let cached = this.cache.get(node.id);
		if (cached) {
			return cached;
		};

		const offset = node.obj.offset();
		const rect = node.obj.get(0).getBoundingClientRect() as DOMRect;
		const { x, y } = this.recalcCoords(offset.left, offset.top);

		cached = { x, y, width: rect.width, height: rect.height };

		this.cache.set(node.id, cached);
		return cached;
	};
	
	checkEachNode (e: any, rect: any, node: any) {
		const { id, type } = node;
		if (!id || !type) {
			return;
		};
			
		const cached = this.cacheRect(node);
		if (!cached || !Util.rectsCollide(rect, cached)) {
			return;
		};

		let ids = this.get(type, false);

		if (keyboard.isCtrlOrMeta()) {
			const idsOnStart = this.idsOnStart.get(type) || [];
			if (idsOnStart.includes(id)) {
				ids = ids.filter(it => it != id);
			} else {
				ids.push(id);
			};
		} else
		if (keyboard.isAlt()) {
			ids = ids.filter(it => it != id);
		} else {
			ids.push(id);
		};

		this.ids.set(type, Util.arrayUnique(ids));
	};
	
	checkNodes (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const { focused, range } = focus.state;
		const { x, y } = this.recalcCoords(e.pageX, e.pageY);
		const rect = Util.objectCopy(this.getRect(this.x, this.y, x, y));

		if (!keyboard.isShift() && !keyboard.isAlt() && !keyboard.isCtrlOrMeta()) {
			this.initIds();
		};

		this.nodes.forEach((item: any) => { 
			this.checkEachNode(e, rect, item);
		});
		
		this.renderSelection();

		const ids = this.get(I.SelectType.Block, false);
		const length = ids.length;

		if (!length) {
			return;
		};

		if ((length <= 1) && !keyboard.isCtrlOrMeta()) {
			const selected = $(`#block-${ids[0]}`);
			const value = selected.find('#value');
			
			if (!value.length) {
				return;
			};

			const el = value.get(0) as Element;
			const range = getRange(el); 
			
			if (!this.range) {
				this.focused = selected.attr('data-id');
				this.range = range;
			};

			if (this.range) {
				if (this.range.end) {
					this.initIds();
					this.renderSelection();
				};
				
				if (!range) {
					focus.set(this.focused, { from: this.range.start, to: this.range.end });
					focus.apply();
				};
			};
		} else {
			if (focused && range.to) {
				focus.clear(false);
			};
			
			keyboard.setFocus(false);
			window.getSelection().empty();
			window.focus();
		};
	};

	hide () {
		$('#selection-rect').hide();
		this.unbindMouse();
	};
	
	clear () {
		if (!this._isMounted) {
			return;
		};

		this.initIds();
		this.renderSelection();
		this.clearState();

		$(window).trigger('selectionClear');
	};
	
	set (type: I.SelectType, ids: string[]) {
		this.ids.set(type, Util.arrayUnique(ids || []));
		this.renderSelection();
	};
	
	get (type: I.SelectType, withChildren?: boolean): string[] {
		let ids = Util.objectCopy(this.ids.get(type) || []);

		if (type == I.SelectType.Block) {
			if (withChildren) {
				ids.forEach(id => this.getChildrenIds(id, ids));
			} else {
				let childrenIds = [];
				ids.forEach(id => this.getChildrenIds(id, childrenIds));
				ids = ids.filter(it => !childrenIds.includes(it));
			};
		};

		return ids;
	};

	checkSelected (type: I.SelectType) {
		let ids = this.get(type, true);
		if (!ids.length) {
			return;
		};

		focus.clear(true);
		menuStore.close('blockContext');
	};

	getChildrenIds (id: string, ids: string[]) {
		const rootId = keyboard.getRootId();
		const block = blockStore.getLeaf(rootId, id);
		
		if (!block || block.isTable()) {
			return;
		};
		
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		if (!childrenIds.length) {
			return;
		};

		for (let childId of childrenIds) {
			ids.push(childId);
			this.getChildrenIds(childId, ids);
		};
	};

	getPageContainer () {
		return $(Util.getCellContainer(keyboard.isPopup() ? 'popup' : 'page'));
	};

	renderSelection () {
		if (!this._isMounted) {
			return;
		};

		const rootId = keyboard.getRootId();

		$('.isSelectionSelected').removeClass('isSelectionSelected');

		for (let i in I.SelectType) {
			const type = I.SelectType[i];
			const ids = this.get(type, true);

			for (let id of ids) {
				$(`#selectable-${id}`).addClass('isSelectionSelected');

				if (type == I.SelectType.Block) {
					$(`#block-${id}`).addClass('isSelectionSelected');

					const childrenIds = blockStore.getChildrenIds(rootId, id);
					childrenIds.forEach((childId: string) => {
						$(`#block-${childId}`).addClass('isSelectionSelected');
					});
				};
			};
		};
	};

	recalcCoords (x: number, y: number): { x: number, y: number } {
		const isPopup = keyboard.isPopup();

		if (isPopup && this.containerOffset) {
			const top = Util.getScrollContainer(isPopup).scrollTop();

			x -= this.containerOffset.left;
			y -= this.containerOffset.top - top;
		};

		return { x, y };
	};
	
	injectProps (children: any) {
		keyboard.setSelection(this);

		return React.Children.map(children, (child: any) => {
			if (!child) {
				return;
			};

			let props = child.props || {};
			let children = props.children;
			let dataset = props.dataset || {};
			
			if (children) {
				child = React.cloneElement(child, { children: this.injectProps(children) });
			};
			
			dataset.selection = this;
			return React.cloneElement(child, { dataset: dataset });
		});
	};

	setIsSelecting (v: boolean) {
		this.isSelecting = v;
	};
	
});

export default SelectionProvider;