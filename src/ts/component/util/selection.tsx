import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange, setRange } from 'selection-ranges';
import { I, Key } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { throttle } from 'lodash';

interface Props {
	editorStore?: any;
	blockStore?: any;
	className?: string;
};

const $ = require('jquery');
const THRESHOLD = 10;

@inject('editorStore')
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
				<div id="rect" />
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
		const { blockStore } = this.props;
		
		const k = e.which;
		const ids = this.get();
		const dir = (k == Key.up) ? -1 : 1;
		
		if (e.shiftKey && (k == Key.up || k == Key.down) && (ids.length >= 1)) {
			const idx = (dir < 0) ? 0 : ids.length - 1;
			const id = ids[idx];
			const next = blockStore.getNextBlock(id, dir, (item: any) => {
				return item.header.type != I.BlockType.Layout;
			});
			const method = dir < 0 ? 'unshift' : 'push';
				
			if (next) {
				ids[method](next.header.id);
				this.set(ids);
			};
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
		let el = node.find('#rect');
		
		el.css({ transform: 'translate3d(0px, 0px, 0px)', width: 0, height: 0 }).show();

		this.nodes = node.find('.selectable');
		this.x = e.pageX;
		this.y = e.pageY;
		this.moved = false;
		this.lastIds = [];
		
		this.unbindMouse();
		win.on('mousemove.selection', throttle((e: any) => { this.onMouseMove(e); }, 30));
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
		let el = node.find('#rect');
		let length = node.find('.selectable.isSelected').length;
		let opacity = 1;
		
		if (length <= 1) {
			rect.width = rect.height = 0;
			opacity = 0;
		};
		
		el.css({ 
			transform: `translate3d(${rect.x}px, ${rect.y}px, 0px)`,
			width: rect.width, 
			height: rect.height,
			opacity: opacity
		});
		
		this.moved = true;
	};
	
	onMouseUp (e: any) {
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
			};
		};
	};
	
	getRect (e: any) {
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
		const { editorStore } = this.props;
		const { focused, range } = editorStore;
		const rect = this.getRect(e);
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!e.shiftKey && !(e.ctrlKey || e.metaKey)) {
			this.clear();
		};
		
		this.nodes.each((i: number, item: any) => {
			item = $(item);
			
			let id = String(item.data('id') || '');
			let offset = item.offset();
			let { left, top } = offset;
			let width = item.width();
			let height = item.height();
			
			if (!this.coordsCollide(rect.x, rect.y, rect.width, rect.height, left, top, width, height)) {
				return;
			};
			
			if (e.shiftKey) {
				item.addClass('isSelected');
			} else
			if ((e.ctrlKey || e.metaKey)) {
				if (this.lastIds.indexOf(id) < 0) {
					item.hasClass('isSelected') ? item.removeClass('isSelected') : item.addClass('isSelected');	
				};
			} else {
				item.addClass('isSelected');
			};
			
			this.lastIds.push(id);
		});
		
		const selected = node.find('.selectable.isSelected');
		const value = selected.find('.value');
		
		if (!selected.length || !value.length) {
			return;
		};
		
		if (selected.length == 1) {
			if (!this.focused || !this.range) {
				this.focused = selected.data('id');
				this.range = getRange(value.get(0) as Element) || { start: 0, end: 0 };
			};
			
			this.clear();
			if ((this.focused != focused) && (this.range.start != range.from) && (this.range.end != range.to)) {
				editorStore.rangeSave(this.focused, { from: this.range.start, to: this.range.end });	
			};
		} else {
			if (focused && range.from && range.to) {
				editorStore.rangeClear();
			};
			window.getSelection().empty();
		};
	};
	
	hide () {
		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('#rect').hide();
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
			node.find('.selectable.c' + id).addClass('isSelected');
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