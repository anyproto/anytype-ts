import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange } from 'selection-ranges';
import { I, M, C, Key, focus, keyboard, scrollOnMove, Util, analytics } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore, menuStore } from 'ts/store';
import { throttle } from 'lodash';

interface Props {};

const $ = require('jquery');

const THROTTLE = 20;
const THRESHOLD = 10;

const SelectionProvider = observer(class SelectionProvider extends React.Component<Props, {}> {

	_isMounted = false;
	x: number = 0;
	y: number = 0;
	dir: number = 0;
	lastIds: string[] = [];
	moved: boolean = false;
	focused: string = '';
	range: any = null;
	nodes: any = null;
	top: number = 0;
	containerOffset = null;

	cache: Map<string, any> = new Map();
	ids: Map<string, string[]> = new Map();

	isSelecting: boolean = false;
	isSelectionPrevented: boolean = false;
	isClearPrevented: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
	};

	render () {
		const children = this.injectProps(this.props.children);
		return (
			<div id="selection" className="selection" onMouseDown={this.onMouseDown}>
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
		$(window).unbind(`mousemove.selection mouseup.selection`);
	};
	
	unbindKeyboard () {
		const isPopup = keyboard.isPopup();

		$(window).unbind(`keydown.selection keyup.selection`);
		Util.getScrollContainer(isPopup).unbind('scroll.selection');
	};

	preventSelect (v: boolean) {
		this.isSelectionPrevented = v;
	};
	
	preventClear (v: boolean) {
		this.isClearPrevented = v;
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
		if (!this.isSelecting || !this.moved) {
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
		if (e.button || !this._isMounted || menuStore.isOpen()) {
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
		const pageContainer = $(Util.getPageContainer(isPopup ? 'popup' : 'page'));
		
		el.css({ transform: 'translate3d(0px, 0px, 0px)', width: 0, height: 0 }).show();

		this.nodes = pageContainer.find('.selectable');
		this.x = e.pageX;
		this.y = e.pageY;
		this.moved = false;
		this.lastIds = [];
		this.focused = focused;
		this.isSelecting = true;
		this.top = Util.getScrollContainer(isPopup).scrollTop();

		if (isPopup) {
			const popupContainer = $('#popupPage #innerWrap');
			if (popupContainer.length) {
				this.containerOffset = popupContainer.offset();
				this.x -= this.containerOffset.left;
				this.y -= this.containerOffset.top - this.top;
			};
		};

		keyboard.disablePreview(true);
		
		this.nodes.each((i: number, item: any) => {
			this.cacheRect($(item));
		});

		if (e.shiftKey) {
			let target = $(e.target.closest('.selectable'));
			let data = target.data();
			let ids = this.get(data.type);

			if (!ids.length && (data.id != focused)) {
				this.set(data.type, ids.concat([ focused ]));
			};
		};
		
		scrollOnMove.onMouseDown(e, isPopup);
		this.unbindMouse();

		win.on(`mousemove.selection`, throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on(`blur.selection mouseup.selection`, (e: any) => { this.onMouseUp(e); });
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
		
		let ids = this.get(I.SelectType.Block, true);
		let first = ids.length ? ids[0] : this.focused;

		if (!this.moved) {
			if (!e.shiftKey && !e.altKey && !(e.ctrlKey || e.metaKey)) {
				this.clear();
			} else {
				this.checkNodes(e);
				
				let target = $(e.target.closest('.selectable'));
				let data = target.data();
				
				if (target.length && e.shiftKey && ids.length && (data.type == I.SelectType.Block)) {
					const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
					const list = blockStore.unwrapTree(tree);
					const idxStart = list.findIndex((it: I.Block) => { return it.id == first; });
					const idxEnd = list.findIndex((it: I.Block) => { return it.id == data.id; });
					const start = idxStart < idxEnd ? idxStart : idxEnd;
					const end = idxStart < idxEnd ? idxEnd : idxStart;

					let slice = list.slice(start, end + 1).
						map((it: I.Block) => { return new M.Block(it); }).
						filter((it: I.Block) => { return it.isSelectable(); }).
						map((it: I.Block) => { return it.id; });

					this.set(data.type, ids.concat(slice));
				};
			};
		};
		
		ids = this.get(I.SelectType.Block, true);
		if (ids.length > 0) {
			menuStore.close('blockContext');
		};
		
		scrollOnMove.onMouseUp(e);
		this.clearState();
	};

	clearState () {
		keyboard.disablePreview(false);
		this.hide();

		this.cache.clear();
		this.lastIds = [];
		this.focused = '';
		this.range = null;
		this.isSelecting = false;
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
		
		let cached = this.cache.get(id);
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

		cached = { x, y, width: rect.width, height: rect.height };

		this.cache.set(id, cached);
		return cached;
	};
	
	checkEachNode (e: any, rect: any, item: any) {
		const data = item.data();
		const id = String(data.id || '');
		const type = String(data.type || '');
		
		if (!id || !type) {
			return;
		};
			
		const cached = this.cacheRect(item);
		if (!cached || !Util.rectsCollide(rect, cached)) {
			return;
		};

		const ids = this.get(type, false);

		if ((e.ctrlKey || e.metaKey)) {
			if (ids.includes(id)) {
				ids.filter(it => it != id);
			} else {
				ids.push(id);
			};
		} else
		if (e.altKey) {
			ids.filter(it => it != id);
		} else {
			ids.push(id);
		};

		this.set(type, ids);
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
		
		this.renderSelection();

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
					this.clear();
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

		for (let i in I.SelectType) {
			this.ids.set(I.SelectType[i], []);
		};

		this.renderSelection();
	};
	
	set (type: any, ids: string[]) {
		this.ids.set(type, Util.arrayUnique(ids));
	};
	
	get (type: any, withChildren?: boolean): any {
		const ids = this.ids.get(type) || [];
		if (withChildren && (type == I.SelectType.Block)) {
			for (let id of ids) {
				this.getChildrenIds(id, ids);
			};
		};
		return ids;
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

	renderSelection () {
		if (!this._isMounted) {
			return;
		};

		$('.isSelectionSelected').removeClass('isSelectionSelected');

		const node = $(ReactDOM.findDOMNode(this));

		for (let i in I.SelectType) {
			const type = I.SelectType[i];
			const ids = this.ids.get(type);

			for (let id of ids) {
				node.find(`#selectable-${id}`).addClass('isSelectionSelected');

				if (type == I.SelectType.Block) {
					node.find(`#block-${id}`).addClass('isSelectionSelected');
					node.find(`#block-children-${id} .block`).addClass('isSelectionSelected');
				};
			};

			if (type == I.SelectType.Block) {
				node.find('.block.isSelectionSelected .children .selectable.isSelectionSelected').removeClass('isSelectionSelected');
			};
		};
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
	
});

export default SelectionProvider;