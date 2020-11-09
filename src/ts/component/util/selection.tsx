import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange } from 'selection-ranges';
import { I, M, C, Key, focus, keyboard, scrollOnMove, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore } from 'ts/store';
import { throttle } from 'lodash';

interface Props {
	className?: string;
	rootId: string;
};

const $ = require('jquery');

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
	rects: Map<string, any> = new Map();
	
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
		win.on('keydown.selection', (e: any) => { this.onKeyDown(e); })
		win.on('keyup.selection', (e: any) => { this.onKeyUp(e); });
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
		const k = e.key.toLowerCase();
		
		let ids: any = this.get();
		let idsWithChildren: any = this.get(true);
		
		if ((k == Key.up || k == Key.down) && ids.length) {
			let dir = (k == Key.up) ? -1 : 1;
			
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
		
		const { focused } = focus;
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

		if (e.shiftKey) {
			this.set(this.get().concat([ focused ]));
		};
		
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
		
		let { rootId } = this.props;
		
		if (!this.moved) {
			if (!e.shiftKey && !e.altKey && !(e.ctrlKey || e.metaKey)) {
				this.clear();
			} else {
				this.checkNodes(e);
				
				let ids = this.get(true);
				let target = $(e.target.closest('.selectable'));
				let targetId = target.data('id');
				let first = this.focused;
				
				if (ids.length > 0) {
					first = ids[0];
				};

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

					this.set(ids.concat(slice));
				};
			};
		};
		
		let ids = this.get(true);
		if (ids.length > 0) {
			commonStore.menuClose('blockContext');
		};
		
		keyboard.disablePreview(false);
		scrollOnMove.onMouseUp(e);
		this.hide();
		
		this.rects.clear();
		this.lastIds = [];
		this.focused = '';
		this.range = null;
	};
	
	getRect (e: any) {
		return {
			x: Math.min(this.x, e.pageX),
			y: Math.min(this.y, e.pageY),
			width: Math.abs(e.pageX - this.x) - 10,
			height: Math.abs(e.pageY - this.y) - 10
		};
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
		
		const offset = obj.offset();
		const rect = obj.get(0).getBoundingClientRect() as DOMRect;
		
		cached = {
			x: offset.left,
			y: offset.top,
			width: rect.width,
			height: rect.height,
		};

		this.rects.set(id, cached);
		return cached;
	};
	
	checkEachNode (e: any, rect: any, item: any) {
		const id = String(item.data('id') || '');
		
		if (!id) {
			return;
		};
			
		const cached = this.cacheRect(item);
		if (!cached || !Util.rectsCollide(rect, cached)) {
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
		
		this.set(this.get());
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

		if (force) {
			this.preventClear(false);
		};
		$('.isSelected').removeClass('isSelected');
	};
	
	unbind () {
		this.unbindMouse();
		this.unbindKeyboard();
	};
	
	unbindMouse () {
		$(window).unbind('mousemove.selection mouseup.selection');
	};
	
	unbindKeyboard () {
		$(window).unbind('keydown.selection keyup.selection');
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
		
		ids = [ ...new Set(ids) ];
		this.lastIds = ids;

		for (let id of ids) {
			$('#block-' + id).addClass('isSelected');
			$('#selectable-' + id).addClass('isSelected');
			$('#block-children-' + id + ' .block').addClass('isSelected');
		};

		$('.block.isSelected .children .selectable.isSelected').removeClass('isSelected');
		
		// Hide placeholder and remove focus
		if (ids.length) {
			focus.clear(true);
			$('.block.isFocused').removeClass('isFocused');
			$('.placeHolder').hide();
		};
	};
	
	get (withChildren?: boolean): string[] {
		let ids = [] as string[];
		$('.selectable.isSelected').each((i: number, item: any) => {
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
		const { rootId } = this.props;
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