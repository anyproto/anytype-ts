import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { throttle } from 'lodash';

interface Props {
	className?: string;
};

interface State {};

const $ = require('jquery');

class SelectionProvider extends React.Component<Props, State> {

	x: number = 0;
	y: number = 0;
	ids: string[] = [];
	nodeList: any = null;
	blocked: boolean = false;
	moved: boolean = false;
	
	constructor (props: any) {
		super(props);
		
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
			<div className={cn.join(' ')} onMouseDown={this.onMouseDown} onMouseLeave={this.onMouseUp}>
				<div id="rect" />
				{children}
			</div>
		);
	};
	
	onMouseDown (e: any) {
		e.stopPropagation();
		
		const node = $(ReactDOM.findDOMNode(this));
		const rect = node.find('#rect');
		
		if (this.blocked) {
			this.unbind();
			rect.hide();
			return;
		};
		
		this.x = e.pageX;
		this.y = e.pageY - $(window).scrollTop();
		this.nodeList = $('.selectable');
		this.moved = false;
		
		rect.css({ 
			transform: `translate3d(${this.x}px, ${this.y}px, 0px)`,
			width: 0, 
			height: 0 
		});
		rect.show();
		
		this.onMouseMove(e);
		this.unbind();

		let win = $(window);
		win.on('mousemove.selection', throttle((e: any) => { this.onMouseMove(e); }, 20));
		win.on('mouseup.selection', (e: any) => { this.onMouseUp(e); });
	};
	
	onMouseMove (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const rect = node.find('#rect');
		
		if (this.blocked) {
			this.unbind();
			rect.hide();
			return;
		};
		
		let win = $(window);
		let wh = win.height();
		let st = win.scrollTop();
		let cx = e.pageX;
		let cy = e.pageY - $(window).scrollTop();
		
		let x = this.x < cx ? this.x : cx;
		let y = this.y < cy ? this.y : cy;
		let width = Math.abs(cx - this.x);
		let height = Math.abs(cy - this.y);
		
		if (width < 10 || height < 10) {
			return;
		};
		
		rect.css({ 
			transform: `translate3d(${x}px, ${y}px, 0px)`,
			width: width, 
			height: height 
		});
		
		this.clear();
		this.moved = true;
		
		this.nodeList.each((i: number, item: any) => {
			item = $(item);
			
			let offset = item.offset();
			let w = item.width();
			let h = item.height();
			let { left, top } = offset;
			
			top -= st;
			
			if ((top < 0) || (top >= wh + st)) {
				return;
			};
			
			if ((x <= left) && (x + width >= left + w) && (y <= top) && (y + height >= top + h)) {
				item.addClass('isSelected');
				this.ids.push(item.data('id'));
			};
		});
	};
	
	onMouseUp (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const rect = node.find('#rect');
		
		rect.hide();
		this.unbind();
		
		if (!this.moved) {
			this.clear();
		};
	};
	
	clear () {
		this.ids = [];
		$('.selectable.isSelected').removeClass('isSelected');
	};
	
	unbind () {
		$(window).unbind('mousemove.selection mouseup.selection');
	};
	
	setBlocked (v: boolean) {
		this.blocked = v;
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