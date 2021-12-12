import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange } from 'selection-ranges';
import { I, M, C, Key, focus, keyboard, scrollOnMove, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore, menuStore } from 'ts/store';
import { throttle } from 'lodash';

interface Props {
	className?: string;
}

const $ = require('jquery');

const THROTTLE = 20;
const THRESHOLD = 10;

const SelectionProvider = observer(class SelectionProvider extends React.Component<Props, {}> {

	_isMounted = false;
	x: number = 0;
	y: number = 0;
	dir: number = 0;
	ids: string[] = [];
	lastIds: string[] = [];
	moved: boolean = false;
	focused: string = '';
	range: any = null;
	nodes: any = null;
	isSelectionPrevented: boolean = false;
	isClearPrevented: boolean = false;
	rects: Map<string, any> = new Map();
	selecting: boolean = false;
	top: number = 0;
	containerOffset = null;
	
	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
	};

	render () {
		const { className } = this.props;
		const children = this.injectProps(this.props.children);
		
		let cn = [ 'selection' ];
		if (className) {
			cn.push(className);
		};

		return (
			<div id="selection" className={cn.join(' ')} onMouseDown={this.onMouseDown}>
				<div id="selection-rect" />
				{children}
			</div>
		);
	};
	
	componentDidMount () {
		const isPopup = keyboard.isPopup();
		const win = $(window); 

		this._isMounted = true;
		this.unbind();

		win.on(`keydown.selection`, (e: any) => { this.onKeyDown(e); })
		Util.getScrollContainer(isPopup).on('scroll.selection', (e: any) => { this.onScroll(e); });
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const rootId = keyboard.getRootId();
		const cmd = keyboard.ctrlKey();

		const ids = this.get();
		const idsWithChildren = this.get(true);

		if (!ids.length) {
			return;
		};

		keyboard.shortcut(`${cmd}+shift+arrowup, ${cmd}+shift+arrowdown`, e, (pressed: string) => {
			focus.clear(true);

			let dir = pressed.match(Key.up) ? -1 : 1;
			let next;
			
			if (dir < 0) {
				next = blockStore.getNextBlock(rootId, idsWithChildren[0], dir);
			} else {
				next = blockStore.getNextBlock(rootId, idsWithChildren[idsWithChildren.length - 1], dir);
			};

			if (next && ids.indexOf(next.id) < 0) {
				C.BlockListMove(rootId, rootId, ids, next.id, (dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom));
			};
		});

		keyboard.shortcut(`shift+arrowup, shift+arrowdown`, e, (pressed: string) => {
			focus.clear(true);
				
			let dir = pressed.match(Key.up) ? -1 : 1;
			let method = '';
			
			if (ids.length == 1) {
				this.dir = dir;
			};

			if (this.dir && (dir != this.dir)) {
				method = dir < 0 ? 'pop' : 'shift';
				ids[method]();
			} else {
				const idx = (dir < 0) ? 0 : idsWithChildren.length - 1;
				const next = blockStore.getNextBlock(rootId, idsWithChildren[idx], dir, (it: any) => { return !it.isSystem(); });

				method = dir < 0 ? 'unshift' : 'push';
				if (next) {
					ids[method](next.id);
					this.scrollToElement(next.id, dir);
				};
			};
			
			this.set(ids);
		});
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
	
	onScroll (e: any) {
		if (!this.selecting || !this.moved) {
			return;
		};

		const isPopup = keyboard.isPopup();
		const top = Util.getScrollContainer(isPopup).scrollTop();
		const d = top > this.top ? 1 : -1;

		let { x, y } = keyboard.mouse.page;
		if (!isPopup) {
			y += Math.abs(top - this.top) * d;
		};

		const rect = this.getRect(x, y);
		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};

		this.checkNodes({ ...e, pageX: x, pageY: y });
		this.drawRect(rect);

		scrollOnMove.onMouseMove(keyboard.mouse.client.x, keyboard.mouse.client.y);
		this.moved = true;
	};
	
	onMouseDown (e: any) {
		if (!this._isMounted) {
			return
		};
		
		if (this.isSelectionPrevented) {
			this.hide();
			return;
		};
		
		const isPopup = keyboard.isPopup();
		const { focused } = focus.state;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#selection-rect');
		
		el.css({ transform: 'translate3d(0px, 0px, 0px)', width: 0, height: 0 }).show();

		this.nodes = node.find('.selectable');
		this.x = e.pageX;
		this.y = e.pageY;
		this.moved = false;
		this.lastIds = [];
		this.focused = focused;
		this.selecting = true;
		this.top = Util.getScrollContainer(isPopup).scrollTop();

		if (isPopup) {
			const container = $('#popupPage #innerWrap');
			if (container.length) {
				this.containerOffset = container.offset();
				this.x -= this.containerOffset.left;
				this.y -= this.containerOffset.top - this.top;
			};
		};

		keyboard.disablePreview(true);
		
		this.nodes.each((i: number, item: any) => {
			this.cacheRect($(item));
		});

		if (e.shiftKey) {
			let ids = this.get();
			let target = $(e.target.closest('.selectable'));
			let targetId = target.data('id');

			if (!ids.length && (targetId != focused)) {
				this.set(this.get().concat([ focused ]));
			};
		};
		
		scrollOnMove.onMouseDown(e, isPopup);
		this.unbindMouse();

		win.on(`mousemove.selection`, throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on(`mouseup.selection`, (e: any) => { this.onMouseUp(e); });
	};
	
	onMouseMove (e: any) {
		e.preventDefault();
		
		if (!this._isMounted) {
			return;
		};
		
		if (this.isSelectionPrevented) {
			this.hide();
			return;
		};
		
		const isPopup = keyboard.isPopup();
		const rect = this.getRect(e.pageX, e.pageY);

		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};

		this.top = Util.getScrollContainer(isPopup).scrollTop();
		this.checkNodes(e);
		this.drawRect(rect);
		
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
		this.moved = true;
	};
	
	onMouseUp (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const rootId = keyboard.getRootId();
		
		let ids = this.get(true);
		let first = ids.length ? ids[0] : this.focused;

		if (!this.moved) {
			if (!e.shiftKey && !e.altKey && !(e.ctrlKey || e.metaKey)) {
				this.clear();
			} else {
				this.checkNodes(e);
				
				let target = $(e.target.closest('.selectable'));
				let targetId = target.data('id');
				
				if (target.length && e.shiftKey && ids.length) {
					const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
					const list = blockStore.unwrapTree(tree);
					const idxStart = list.findIndex((it: I.Block) => { return it.id == first; });
					const idxEnd = list.findIndex((it: I.Block) => { return it.id == targetId; });
					const start = idxStart < idxEnd ? idxStart : idxEnd;
					const end = idxStart < idxEnd ? idxEnd : idxStart;

					let slice = list.slice(start, end + 1).
						map((it: I.Block) => { return new M.Block(it); }).
						filter((it: I.Block) => { return it.isSelectable(); }).
						map((it: I.Block) => { return it.id; });

					this.set(ids.concat(slice));
				};
			};
		};
		
		ids = this.get(true);
		if (ids.length > 0) {
			menuStore.close('blockContext');
		};
		
		scrollOnMove.onMouseUp(e);
		this.clearState();
	};

	clearState () {
		keyboard.disablePreview(false);
		this.hide();

		this.rects.clear();
		this.lastIds = [];
		this.focused = '';
		this.range = null;
		this.selecting = false;
	};

	drawRect (rect: any) {
		const { config } = commonStore;
		if (!config.debug.ui) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#selection-rect');

		el.css({ 
			transform: `translate3d(${rect.x + 10}px, ${rect.y + 10}px, 0px)`,
			width: rect.width - 10, 
			height: rect.height - 10,
		});
	};
	
	getRect (x: number, y: number) {
		const isPopup = keyboard.isPopup();
		
		if (isPopup && this.containerOffset) {
			const top = Util.getScrollContainer(isPopup).scrollTop();
			x -= this.containerOffset.left;
			y -= this.containerOffset.top - top;
		};

		const rect = {
			x: Math.min(this.x, x),
			y: Math.min(this.y, y),
			width: Math.abs(x - this.x) - 10,
			height: Math.abs(y - this.y) - 10
		};
		return rect;
	};
	
	cacheRect (obj: any) {
		const id = String(obj.data('id') || '');
		if (!id) {
			return null;
		};
		
		let cached = this.rects.get(id);
		if (cached) {
			return cached;
		};
		
		const isPopup = keyboard.isPopup();
		const offset = obj.offset();
		const rect = obj.get(0).getBoundingClientRect() as DOMRect;
		
		let x = offset.left;
		let y = offset.top;

		if (isPopup && this.containerOffset) {
			const top = Util.getScrollContainer(isPopup).scrollTop();
			x -= this.containerOffset.left;
			y -= this.containerOffset.top - top;
		};

		cached = { x: x, y: y, width: rect.width, height: rect.height };

		this.rects.set(id, cached);
		return cached;
	};
	
	checkEachNode (e: any, rect: any, item: any) {
		const id = String(item.data('id') || '');
		
		if (!id) {
			return;
		};
			
		const cached = this.cacheRect(item);
		if (!cached || !this.rectsCollide(rect, cached)) {
			return;
		};

		const block = $(`#block-${id}`);
		
		if ((e.ctrlKey || e.metaKey)) {
			if (this.lastIds.indexOf(id) < 0) {
				if (item.hasClass('isSelectionSelected')) {
					item.removeClass('isSelectionSelected');
					block.removeClass('isSelectionSelected');
				} else {
					item.addClass('isSelectionSelected');
					block.addClass('isSelectionSelected');
				};
			};
		} else
		if (e.altKey) {
			item.removeClass('isSelectionSelected');
			block.removeClass('isSelectionSelected');
		} else 
		if (!item.hasClass('isSelectionSelected')) {
			item.addClass('isSelectionSelected');
			block.addClass('isSelectionSelected');
		};
			
		this.lastIds.push(id);
	};
	
	checkNodes (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const { focused, range } = focus.state;
		const rect = this.getRect(e.pageX, e.pageY);

		if (!e.shiftKey && !e.altKey && !(e.ctrlKey || e.metaKey)) {
			this.clear();
		};
		
		this.nodes.each((i: number, item: any) => { 
			this.checkEachNode(e, Util.objectCopy(rect), $(item)); 
		});
		
		const selected = $('.selectable.isSelectionSelected');
		const length = selected.length;
		if (!length) {
			return;
		};
		
		if ((length <= 1) && !(e.ctrlKey || e.metaKey)) {
			const value = selected.find('.value');
			if (!value.length) {
				return;
			};

			const el = value.get(0) as Element;			
			const range = getRange(el); 
			
			if (!this.range) {
				this.focused = selected.data('id');
				this.range = range;
			};

			if (this.range) {
				if (this.range.end) {
					$('.isSelectionSelected').removeClass('isSelectionSelected');
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
		
		this.set(this.get());
	};
	
	hide () {
		if (!this._isMounted) {
			return
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#selection-rect');
		
		el.hide();
		this.unbindMouse();
	};
	
	clear (force?: false) {
		if (!this._isMounted || (this.isClearPrevented && !force)) {
			return;
		};

		if (force) {
			this.preventClear(false);
		};
		$('.isSelectionSelected').removeClass('isSelectionSelected');
	};
	
	unbind () {
		this.unbindMouse();
		this.unbindKeyboard();
	};
	
	unbindMouse () {
		$(window).unbind(`mousemove.selection mouseup.selection`);
	};
	
	unbindKeyboard () {
		const isPopup = keyboard.isPopup();

		$(window).unbind(`keydown.selection keyup.selection`);
		Util.getScrollContainer(isPopup).unbind('scroll.selection');
	};

	nameSpace () {
		return keyboard.isPopup() ? 'Popup' : '';
	};
	
	preventSelect (v: boolean) {
		this.isSelectionPrevented = v;
	};
	
	preventClear (v: boolean) {
		this.isClearPrevented = v;
	};
	
	set (ids: string[]) {
		if (!this._isMounted) {
			return;
		};
		
		this.clear();
		
		if (!ids.length) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		
		ids = Util.arrayUnique(ids);
		this.lastIds = ids;

		for (let id of ids) {
			node.find('#block-' + id).addClass('isSelectionSelected');
			node.find('#selectable-' + id).addClass('isSelectionSelected');
			node.find('#block-children-' + id + ' .block').addClass('isSelectionSelected');
		};

		node.find('.block.isSelectionSelected .children .selectable.isSelectionSelected').removeClass('isSelectionSelected');
		
		if (ids.length) {
			focus.clear(true);
		};
	};
	
	get (withChildren?: boolean): string[] {
		if (!this._isMounted) {
			return [];
		};

		const node = $(ReactDOM.findDOMNode(this));

		let ids = [] as string[];

		node.find('.selectable.isSelectionSelected').each((i: number, item: any) => {
			let id = String($(item).data('id') || '');
			if (!id) {
				return;
			};

			ids.push(id);
			if (withChildren) {
				this.getChildrenIds(id, ids);
			};
		});

		ids = ids.filter((it: string) => { return it; });
		return [ ...new Set(ids) ];
	};

	getChildrenIds (id: string, ids: string[]) {
		const rootId = keyboard.getRootId();
		const childrenIds = blockStore.getChildrenIds(rootId, id);

		if (!childrenIds.length) {
			return;
		};

		for (let childId of childrenIds) {
			ids.push(childId);
			this.getChildrenIds(childId, ids);
		};
	};
	
	injectProps (children: any) {
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

	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};
	
});

export default SelectionProvider;