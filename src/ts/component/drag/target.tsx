import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';

interface Props {
	id: string;
	type: string;
	className?: string;
	disabled?: boolean;
	onClick?(e: any): void;
	onDrop?(e: any, type: string, targetId: string, position: I.BlockPosition): void;
};

const $ = require('jquery');

class DropTarget extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	position: I.BlockPosition = I.BlockPosition.None;
	
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

		const { disabled } = this.props;
		if (disabled) {
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
		
		this.position = I.BlockPosition.None;
		
		if ((ey >= y) && (ey <= rect.y)) {
			this.position = I.BlockPosition.Before;
		} else 
		if ((ey >= rect.height) && (ey <= y + height)) {
			this.position = I.BlockPosition.After;
		} else
		if ((ex >= x) && (ex < rect.x) && (ey > rect.y) && (ey < rect.height)) {
			this.position = I.BlockPosition.Left;
		} else 
		if ((ex > rect.width) && (ex <= x + width) && (ey > rect.y) && (ey < rect.height)) {
			this.position = I.BlockPosition.Right;
		} else 
		if ((ex > rect.x) && (ex < rect.width) && (ey > rect.y) && (ey < rect.height)) {
			this.position = I.BlockPosition.Inner;
		};
		
		node.removeClass('top bottom left right middle');
		node.addClass('isOver ' + this.getDirectionClass(this.position));
	};
	
	getDirectionClass (dir: I.BlockPosition) {
		let c = '';
		switch (dir) {
			case I.BlockPosition.None: c = ''; break;
			case I.BlockPosition.Before: c = 'top'; break;
			case I.BlockPosition.After: c = 'bottom'; break;
			case I.BlockPosition.Left: c = 'left'; break;
			case I.BlockPosition.Right: c = 'right'; break;
			case I.BlockPosition.Inner: c = 'middle'; break;
		};
		return c;
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
		
		const { disabled } = this.props;
		if (disabled) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isOver top bottom left right middle');
		
		if (this.props.onDrop) {
			this.props.onDrop(e, this.props.type, this.props.id, this.position);			
		};
	};
	
};

export default DropTarget;