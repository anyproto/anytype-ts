import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange } from 'selection-ranges';
import { I, M, C, Key, focus, keyboard, scrollOnMove } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';
import { throttle } from 'lodash';

interface Props {
	className?: string;
	container: string;
	rootId: string;
};

const $ = require('jquery');
const raf = require('raf');
const THROTTLE = 20;
const THRESHOLD = 10;

@observer
class SelectionProvider extends React.Component<Props, {}> {

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
	rects: any = {};
	
	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
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
			<div className={cn.join(' ')} onMouseDown={this.onMouseDown}>
				{children}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.unbind();
		
		let win = $(window); 
		let doc = $(document);
		
		win.on('keydown.selection', (e: any) => { this.onKeyDown(e); })
		win.on('keyup.selection', (e: any) => { this.onKeyUp(e); });
		
		doc.on('selectstart.selection selectionchange.selection', (e: any) => {});
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const { rootId } = this.props;
		const k = e.which;
		
		let ids: any = this.get();
		let idsWithChildren: any = this.get(true);
		
		if ((k == Key.up || k == Key.down) && ids.length) {
			let dir = (k == Key.up) ? -1 : 1;
			let idx = (dir < 0) ? 0 : ids.length - 1;
			let method = '';
			
			// Move selection with arrows
			if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
				focus.clear(true);
				
				let next;
				if (dir < 0) {
					next = blockStore.getNextBlock(rootId, idsWithChildren[0], dir);
				} else {
					next = blockStore.getNextBlock(rootId, idsWithChildren[idsWithChildren.length - 1], dir);
				};
				
				if (next && ids.indexOf(next.id) < 0) {
					C.BlockListMove(rootId, rootId, ids, next.id, (dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom));
				};
			} else 
			// Expand selection by arrows
			if (e.shiftKey) {
				focus.clear(true);
				
				let idx = (dir < 0) ? 0 : ids.length - 1;
				let method = '';
				
				if (ids.length == 1) {
					this.dir = dir;
				};
				
				if (this.dir && (dir != this.dir)) {
					method = dir < 0 ? 'pop' : 'shift';
					ids[method]();
				} else {
					const next = blockStore.getNextBlock(rootId, ids[idx], dir, (item: any) => {
						return item.type != I.BlockType.Layout;
					});
	
					method = dir < 0 ? 'unshift' : 'push';
					if (next) {
						ids[method](next.id);
					};
				};
				
				this.set(ids);
			};
		};
	};
	
	onKeyUp (e: any) {
	};
	
	onMouseDown (e: any) {
		if (!this._isMounted) {
			return
		};
		
		if (this.isSelectionPrevented) {
			this.hide();
			return;
		};
		
		const { focused, range } = focus;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const el = $('#selection-rect');
		
		el.css({ transform: 'translate3d(0px, 0px, 0px)', width: 0, height: 0 }).show();

		this.nodes = node.find('.selectable');
		this.x = e.pageX;
		this.y = e.pageY;
		this.moved = false;
		this.lastIds = [];
		this.focused = focused;
		keyboard.disablePreview(true);
		
		this.nodes.each((i: number, item: any) => {
			this.cacheRect($(item));
		});
		
		scrollOnMove.onMouseDown(e);
		this.unbindMouse();
		win.on('mousemove.selection', throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('mouseup.selection', (e: any) => { this.onMouseUp(e); });
	};
	
	onMouseMove (e: any) {
		e.preventDefault();
		
		if (!this._isMounted) {
			return
		};
		
		if (this.isSelectionPrevented) {
			this.hide();
			return;
		};
		
		const rect = this.getRect(e);
		if ((rect.width < THRESHOLD) && (rect.height < THRESHOLD)) {
			return;
		};
		
		this.checkNodes(e);
		
		$('#selection-rect').css({ 
			transform: `translate3d(${rect.x + 10}px, ${rect.y + 10}px, 0px)`,
			width: rect.width - 10, 
			height: rect.height - 10,
		});
		
		scrollOnMove.onMouseMove(e);
		this.moved = true;
	};
	
	onMouseUp (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const { rootId } = this.props;
		const { focused, range } = focus;
		
		if (!this.moved) {
			if (!e.shiftKey && !e.altKey && !(e.ctrlKey || e.metaKey)) {
				this.clear();
			} else {
				this.checkNodes(e);
				
				let first = this.focused;
				let ids = this.get(true);
				
				if (ids.length > 0) {
					first = ids[0];
				};
				
				let target = $(e.target.closest('.selectable'));
				let targetId = target.data('id');
				
				if (target.length && e.shiftKey && (targetId != first)) {
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
					
					this.set(slice);
				};
			};
		};
		
		keyboard.disablePreview(false);
		scrollOnMove.onMouseUp(e);
		this.hide();
		
		this.rects = {};
		this.lastIds = [];
		this.focused = '';
		this.range = null;
	};
	
	getRect (e: any) {
		const { container } = this.props;
		
		let cx = e.pageX;
		let cy = e.pageY;
		let rect = {
			x: Math.min(this.x, cx),
			y: Math.min(this.y, cy),
			width: Math.abs(cx - this.x) - 10,
			height: Math.abs(cy - this.y) - 10
		};
		return rect;
	};
	
	cacheRect (obj: any) {
		const id = String(obj.data('id') || '');
		
		if (!id || this.rects[id]) {
			return;
		};
		
		const offset = obj.offset();
		
		this.rects[id] = {
			x: offset.left,
			y: offset.top,
			width: obj.width(),
			height: obj.height(),
		};
	};
	
	checkEachNode (e: any, rect: any, item: any) {
		const id = String(item.data('id') || '');
		
		if (!id) {
			return;
		};
			
		this.cacheRect(item);
			
		if (!this.rects[id] || !this.rectsCollide(rect, this.rects[id])) {
			return;
		};

		const block = $('#block-' + id);
			
		if ((e.ctrlKey || e.metaKey)) {
			if (this.lastIds.indexOf(id) < 0) {
				if (item.hasClass('isSelected')) {
					item.removeClass('isSelected');
					block.removeClass('isSelected');
				} else {
					item.addClass('isSelected');
					block.addClass('isSelected');
				};
			};
		} else
		if (e.altKey) {
			item.removeClass('isSelected');
			block.removeClass('isSelected');
		} else 
		if (!item.hasClass('isSelected')) {
			item.addClass('isSelected');
			block.addClass('isSelected');
		};
			
		this.lastIds.push(id);
	};
	
	checkNodes (e: any) {
		if (!this._isMounted) {
			return
		};
		
		const { focused, range } = focus;
		const rect = this.getRect(e);
		
		if (!e.shiftKey && !e.altKey && !(e.ctrlKey || e.metaKey)) {
			this.clear();
		};
		
		this.nodes.each((i: number, item: any) => { this.checkEachNode(e, rect, $(item)); });
		
		const selected = $('.selectable.isSelected');
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
				if (this.range.end && (this.range.start != this.range.end)) {
					$('.isSelected').removeClass('isSelected');
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
		
		raf(() => {
			this.set(this.get());
		});
	};
	
	hide () {
		if (!this._isMounted) {
			return
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		$('#selection-rect').hide();
		
		this.unbindMouse();
	};
	
	clear (force?: false) {
		if (!this._isMounted || (this.isClearPrevented && !force)) {
			return;
		};

		$('.isSelected').removeClass('isSelected');
	};
	
	unbind () {
		this.unbindMouse();
		this.unbindKeyboard();
		
		$(document).unbind('selectstart.selection selectionchange.selection');
	};
	
	unbindMouse () {
		$(window).unbind('mousemove.selection mouseup.selection');
	};
	
	unbindKeyboard () {
		$(window).unbind('keydown.selection keyup.selection');
	};
	
	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
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
		
		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const { focused } = focus;
		
		this.clear();
		
		if (!ids.length) {
			return;
		};
		
		ids = [ ...new Set(ids) ];
		this.lastIds = ids;
		
		for (let id of ids) {
			let block = $('#block-' + id);
			if (block.hasClass('noSelect')) {
				continue;
			};
			
			block.addClass('isSelected');
			$('#selectable-' + id).addClass('isSelected');
			
			const childrenIds = blockStore.getChildrenIds(rootId, id);
			for (let childId of childrenIds) {
				$('#block-' + childId).addClass('isSelected noSelect');
			};
		};
		
		// Hide placeholder and remove focus
		if (focused) {
			focus.clear(true);
			$('.block.isFocused').removeClass('isFocused');
			$('.placeHolder').hide();
		};
		
		$('.noSelect').removeClass('noSelect');
	};
	
	get (withChildren?: boolean): string[] {
		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		let ids = [] as string[];
		
		node.find('.selectable.isSelected').each((i: number, item: any) => {
			item = $(item);

			let id = String(item.data('id') || '');
			if (id) {
				ids.push(id);
			};
			
			if (withChildren) {
				const childrenIds = blockStore.getChildrenIds(rootId, id);
				ids = ids.concat(childrenIds);
			};
		});
		
		return [ ...new Set(ids) ];
	};
	
	injectProps (children: any) {
		return React.Children.map(children, (child: any) => {
			let children = child.props.children;
			let dataset = child.props.dataset || {};
			
			if (children) {
				child = React.cloneElement(child, { children: this.injectProps(children) });
			};
			
			dataset.selection = this;
			return React.cloneElement(child, { dataset: dataset });
		});
	};
	
};

export default SelectionProvider;