import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange } from 'selection-ranges';
import { I, Key, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { throttle } from 'lodash';

interface Props {
	blockStore?: any;
	className?: string;
	container: string;
	rootId: string;
};

const $ = require('jquery');
const THRESHOLD = 10;
const THROTTLE = 20;

@inject('blockStore')
@observer
class SelectionProvider extends React.Component<Props, {}> {

	x: number = 0;
	y: number = 0;
	dir: number = 0;
	lastIds: string[] = [];
	blocked: boolean = false;
	moved: boolean = false;
	focused: string = '';
	range: any = null;
	nodes: any = null;
	
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
		this.unbind();
		
		let win = $(window); 
		let doc = $(document);
		
		win.on('keydown.selection', (e: any) => { this.onKeyDown(e); })
		win.on('keyup.selection', (e: any) => { this.onKeyUp(e); });
		
		doc.on('selectstart.selection selectionchange.selection', (e: any) => {
			if (this.get().length <= 0) {
				return;
			};
			
			const sel = window.getSelection();
			const range = sel.rangeCount >= 1 ? sel.getRangeAt(0) : null;
			
			if (range && !range.collapsed) {
				window.getSelection().empty();
			};
		});
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	onKeyDown (e: any) {
		const { blockStore, rootId } = this.props;
		const k = e.which;
		
		let ids: any = this.get();
		
		if (e.shiftKey && (k == Key.up || k == Key.down) && (ids.length >= 1)) {
			let dir = (k == Key.up) ? -1 : 1;
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
	
	onKeyUp (e: any) {
		let k = e.which;
	};
	
	onMouseDown (e: any) {
		if (this.blocked) {
			this.hide();
			return;
		};
		
		let win = $(window);
		let node = $(ReactDOM.findDOMNode(this));
		let el = $('#rect');
		
		el.css({ transform: 'translate3d(0px, 0px, 0px)', width: 0, height: 0 }).show();

		this.nodes = node.find('.selectable');
		this.x = e.pageX;
		this.y = e.pageY;
		this.moved = false;
		this.lastIds = [];
		
		this.unbindMouse();
		win.on('mousemove.selection', throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('mouseup.selection', (e: any) => { this.onMouseUp(e); });
	};
	
	onMouseMove (e: any) {
		if (this.blocked) {
			this.hide();
			return;
		};
		
		let rect = this.getRect(e);
		if ((rect.width < THRESHOLD) || (rect.height < THRESHOLD)) {
			return;
		};
		
		this.checkNodes(e);
		
		let node = $(ReactDOM.findDOMNode(this));
		let el = $('#rect');
		let selected = node.find('.selectable.isSelected');
		
		el.css({ 
			transform: `translate3d(${rect.x}px, ${rect.y}px, 0px)`,
			width: rect.width, 
			height: rect.height,
			opacity: selected.length ? 1 : 0.4
		});
		
		this.moved = true;
	};
	
	onMouseUp (e: any) {
		const { focused, range } = focus;
		
		this.hide();
		this.lastIds = [];
		this.focused = '';
		this.range = null;
		this.unbindMouse();
		
		if (!this.moved) {
			if (!e.shiftKey && !(e.ctrlKey || e.metaKey)) {
				this.clear();
			} else {
				this.checkNodes(e);
				
				let target = $(e.target.closest('.selectable'));
				if (target.length && (target.data('id') != focused)) {
					if (e.shiftKey) {
						target.addClass('isSelected');
					} else 
					if (e.ctrlKey || e.metaKey) {
						target.hasClass('isSelected') ? target.removeClass('isSelected') : target.addClass('isSelected');
					};
				};
			};
		};
	};
	
	getRect (e: any) {
		const { container } = this.props;
		
		let cx = e.pageX;
		let cy = e.pageY;
		let rect = {
			x: Math.min(this.x, cx),
			y: Math.min(this.y, cy),
			width: Math.abs(cx - this.x),
			height: Math.abs(cy - this.y)
		};
		return rect;
	};
	
	checkNodes (e: any) {
		const { focused, range } = focus;
		const rect = this.getRect(e);
		const node = $(ReactDOM.findDOMNode(this));
		const scrollTop = $(window).scrollTop();
		
		if (!e.shiftKey && !(e.ctrlKey || e.metaKey)) {
			this.clear();
		};
		
		this.nodes.each((i: number, el: any) => {
			let item = $(el);
			let id = String(item.data('id') || '');
			let elRect = el.getBoundingClientRect() as DOMRect; 
			
			elRect.y += scrollTop;
			
			if (!this.rectsCollide(rect, elRect)) {
				return;
			};
			
			if ((e.ctrlKey || e.metaKey)) {
				if (this.lastIds.indexOf(id) < 0) {
					item.hasClass('isSelected') ? item.removeClass('isSelected') : item.addClass('isSelected');	
				};
			} else 
			if (!item.hasClass('isSelected')) {
				item.addClass('isSelected');	
			};
			
			this.lastIds.push(id);
		});
		
		const selected = node.find('.selectable.isSelected');
		if (!selected.length) {
			return;
		};
		
		if ((selected.length == 1) && !e.shiftKey && !(e.ctrlKey || e.metaKey)) {
			const value = selected.find('.value');
			const el = value.get(0) as Element;
			
			if (value.length) {
				if (!this.focused || !this.range) {
					this.focused = selected.data('id');
					this.range = getRange(el) || { start: 0, end: 0 };
				};
				
				if (this.range.end) {
					this.clear();
					focus.set(this.focused, { from: this.range.start, to: this.range.end });
					focus.apply();
				};
			};
		} else {
			if (focused && range.from && range.to) {
				focus.clear();
			};
			window.getSelection().empty();
		};
	};
	
	hide () {
		const node = $(ReactDOM.findDOMNode(this));
		
		$('#rect').hide();
		this.unbindMouse();
	};
	
	clear () {
		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.selectable.isSelected').removeClass('isSelected');
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
	
	setBlocked (v: boolean) {
		this.blocked = v;
	};
	
	set (ids: string[]) {
		const node = $(ReactDOM.findDOMNode(this));
		this.clear();
		
		ids = [ ...new Set(ids) ];
		this.lastIds = ids;
		
		for (let id of ids) {
			node.find('.selectable.c' + $.escapeSelector(id)).addClass('isSelected');
		};
	};
	
	get (): string[] {
		const node = $(ReactDOM.findDOMNode(this));
		
		let ids = [] as string[];
		node.find('.selectable.isSelected').each((i: number, item: any) => {
			item = $(item);
			ids.push(String(item.data('id') || ''));
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