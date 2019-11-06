import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';

interface Props {
	id: string;
	type: string;
	className?: string;
	onClick?(e: any): void;
	onDrop?(e: any, type: string, id: string, direction: string): void;
};

const $ = require('jquery');

class DropTarget extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	direction: string;
	
	constructor (props: any) {
		super(props);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};
	
	render () {
		const { children, className, onClick } = this.props;
		
		let cn = [ 'dropTarget' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave} onDrop={this.onDrop} onClick={onClick}>
				{children}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onDragOver (e: any) {
		e.preventDefault();
		
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		
		let win = $(window);
		let offset = node.offset();
		let width = node.width();
		let height = node.height();
		let x = offset.left;
		let y = offset.top;
		let ex = e.pageX;
		let ey = e.pageY;
		
		let rect = {
			x: x + width * 0.15,
			y: y + height * 0.15,
			width: x + width * 0.60,
			height: y + height * 0.85
		};
		
		this.direction = '';
		
		if ((ey >= y) && (ey <= rect.y)) {
			this.direction = 'top';
		} else 
		if ((ey >= rect.height) && (ey <= y + height)) {
			this.direction = 'bottom';
		} else
		if ((ex >= x) && (ex < rect.x) && (ey > rect.y) && (ey < rect.height)) {
			this.direction = 'left';
		} else 
		if ((ex > rect.width) && (ex <= x + width) && (ey > rect.y) && (ey < rect.height)) {
			this.direction = 'right';
		} else 
		if ((ex > rect.x) && (ex < rect.width) && (ey > rect.y) && (ey < rect.height)) {
			this.direction = 'middle';
		};
		
		node.removeClass('top bottom left right middle');
		node.addClass('isOver ' + this.direction);
	};
	
	onDragLeave (e: any) {
		e.preventDefault();
		
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isOver top bottom left right middle');
	};
	
	onDrop (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isOver top bottom left right middle');
		
		if (this.props.onDrop) {
			this.props.onDrop(e, this.props.type, this.props.id, this.direction);			
		};
	};
	
};

export default DropTarget;