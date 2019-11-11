import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { getRange, setRange } from 'selection-ranges';
import { I } from 'ts/lib';
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
	lastIds: string[] = [];
	nodeList: any = null;
	blocked: boolean = false;
	moved: boolean = false;
	focused: string = '';
	range: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className } = this.props;
		const children = this.injectProps(this.props.children);
		
		let cn = [ 'selection' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} onMouseDown={this.onMouseDown} onMouseLeave={this.onMouseLeave}>
				<div id="rect" />
				{children}
			</div>
		);
	};
	
	onMouseDown (e: any) {
		e.stopPropagation();
		
		if (this.blocked) {
			this.hide();
			return;
		};
		
		let node = $(ReactDOM.findDOMNode(this));
		let el = node.find('#rect');
		
		el.css({ transform: 'translate3d(0px, 0px, 0px)', width: 0, height: 0 }).show();

		this.x = e.pageX;
		this.y = e.pageY - $(window).scrollTop();
		this.nodeList = $('.selectable');
		this.moved = false;
		this.unbind();
		this.lastIds = [];
		
		let win = $(window);
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
		let length = $('.selectable.isSelected').length;
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
		
		if (!this.moved) {
			if (!e.shiftKey && !(e.ctrlKey || e.metaKey)) {
				this.clear();	
			} else {
				this.checkNodes(e);
			};
		};
	};
	
	onMouseLeave (e: any) {
		this.onMouseUp(e);
	};
	
	getRect (e: any) {
		let cx = e.pageX;
		let cy = e.pageY - $(window).scrollTop();
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
		
		let win = $(window);
		let wh = win.height();
		let st = win.scrollTop();
		let rect = this.getRect(e);
		
		if (!e.shiftKey && !(e.ctrlKey || e.metaKey)) {
			this.clear();
		};
		
		this.nodeList.each((i: number, item: any) => {
			item = $(item);
			
			let id = String(item.data('id') || '');
			let offset = item.offset();
			let { left, top } = offset;
			let width = item.width();
			let height = item.height();
			
			if ((top + height < st) || (top >= wh + st)) {
				return;
			};
			
			if (!this.coordsCollide(rect.x, rect.y, rect.width, rect.height, left, top - st, width, height)) {
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
		
		let selected = $('.selectable.isSelected');
		let value = selected.find('.value');
		
		if (!selected.length || !value.length) {
			return;
		};
		
		if (selected.length == 1) {
			if (!this.focused || !this.range) {
				this.focused = selected.data('id');
				this.range = getRange(value.get(0) as Element) || { start: 0, end: 0 };
			};
			
			setRange(value.get(0) as Element, this.range);
			editorStore.rangeSave(this.focused, { from: this.range.start, to: this.range.end });
			this.clear();
		} else {
			editorStore.rangeClear();
			window.getSelection().empty();
		};
	};
	
	hide () {
		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('#rect').hide();
		this.unbind();
	};
	
	clear () {
		$('.selectable.isSelected').removeClass('isSelected');
	};
	
	unbind () {
		$(window).unbind('mousemove.selection mouseup.selection');
	};
	
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};
	
	setBlocked (v: boolean) {
		this.blocked = v;
	};
	
	set (ids: string[]) {
		ids = [ ...new Set(ids) ];
		
		this.clear();
		for (let id of ids) {
			$('.selectable.c' + id).addClass('isSelected');
		};
	};
	
	get (): string[] {
		let ids = [] as string[];
		
		$('.selectable.isSelected').each((i: number, item: any) => {
			item = $(item);
			ids.push(String(item.data('id') || ''));
		});
		
		ids = [ ...new Set(ids) ];
		return ids;
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