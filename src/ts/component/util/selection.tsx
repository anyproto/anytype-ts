import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer, inject } from 'mobx-react';
import { throttle } from 'lodash';

interface Props {
	blockStore?: any;
	className?: string;
};

const $ = require('jquery');
const THRESHOLD = 10;

@inject('blockStore')
@observer
class SelectionProvider extends React.Component<Props, {}> {

	x: number = 0;
	y: number = 0;
	lastIds: string[] = [];
	nodeList: any = null;
	blocked: boolean = false;
	moved: boolean = false;
	
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
		win.on('mousemove.selection', throttle((e: any) => { this.onMouseMove(e); }, 20));
		win.on('mouseup.selection', (e: any) => { this.onMouseUp(e); });
	};
	
	onMouseMove (e: any) {
		if (this.blocked) {
			this.hide();
			return;
		};

		let win = $(window);
		let wh = win.height();
		let st = win.scrollTop();
		let cx = e.pageX;
		let cy = e.pageY - st;
		let rect = {
			x: (this.x < cx) ? this.x : cx,
			y: (this.y < cy) ? this.y : cy,
			width: Math.abs(cx - this.x),
			height: Math.abs(cy - this.y)
		};
		
		if ((rect.width < THRESHOLD) || (rect.height < THRESHOLD)) {
			return;
		};
		
		let node = $(ReactDOM.findDOMNode(this));
		let el = node.find('#rect');
		
		el.css({ 
			transform: `translate3d(${rect.x}px, ${rect.y}px, 0px)`,
			width: rect.width, 
			height: rect.height
		});
		
		this.moved = true;
		this.checkNodes(e);
	};
	
	onMouseUp (e: any) {
		this.hide();
		this.lastIds = [];
		
		if (!this.moved) {
			if (!e.shiftKey) {
				this.clear();	
			} else {
				this.checkNodes(e);
			};
		};
	};
	
	onMouseLeave (e: any) {
		this.onMouseUp(e);
	};
	
	checkNodes (e: any) {
		let win = $(window);
		let wh = win.height();
		let st = win.scrollTop();
		let cx = e.pageX;
		let cy = e.pageY - st;
		let rect = {
			x: (this.x < cx) ? this.x : cx,
			y: (this.y < cy) ? this.y : cy,
			width: Math.abs(cx - this.x),
			height: Math.abs(cy - this.y)
		};
		
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
	
	get () {
		let res = [] as string[];
		
		$('.selectable.isSelected').each((i: number, item: any) => {
			item = $(item);
			let id = String(item.data('id') || '');
			
			res.push(id);
		});
		
		return res;
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