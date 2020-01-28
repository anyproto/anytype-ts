import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';

interface Props {
	id: string;
	rootId: string;
	style?: number;
	type?: I.BlockType;
	dropType: I.DragItem;
	className?: string;
	disabled?: boolean;
	dataset?: any;
	onClick?(e: any): void;
	onDrop?(e: any, dropType: string, targetId: string, position: I.BlockPosition): void;
};

const $ = require('jquery');

class DropTarget extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	position: I.BlockPosition = I.BlockPosition.None;
	canDrop: boolean = false;
	t: number = 0;
	
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

		const { id, disabled, dataset, dropType, style, type, className } = this.props;
		if (disabled) {
			return;
		};
		
		const { dragProvider } = dataset || {};
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
			y: y + height * 0.3,
			width: x + width * 0.60,
			height: y + height * 0.7
		};
		
		let parentIds: string[] = [];
		this.getParentIds(id, parentIds);
		
		this.canDrop = true;
		
		if (dragProvider) {
			for (let dropId of dragProvider.ids) {
				if ((dropId == id) || (parentIds.indexOf(dropId) >= 0)) {
					this.canDrop = false;
					break;
				};
			};
		} else {
			this.canDrop = false;
		};
		
		this.position = I.BlockPosition.None;
		
		if ((ey >= y) && (ey <= rect.y)) {
			this.position = I.BlockPosition.Top;
		} else 
		if ((ey >= rect.height) && (ey <= y + height)) {
			this.position = I.BlockPosition.Bottom;
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
		
		// You can't drop on Icon
		if (type == I.BlockType.Icon) {
			this.position = I.BlockPosition.None;
		};
		
		// You can drop only on bottom of Title
		if ((style == I.TextStyle.Title) && ([ I.BlockPosition.Left, I.BlockPosition.Right, I.BlockPosition.Top ].indexOf(this.position) >= 0)) {
			this.position = I.BlockPosition.None;
		};
		
		// You can drop vertically on Layout.Row
		if ((type == I.BlockType.Layout) && (style == I.LayoutStyle.Row) && (this.position != I.BlockPosition.None)) {
			if (className == 'targetTop') {
				this.position = I.BlockPosition.Top;
			};
			if (className == 'targetBot') {
				this.position = I.BlockPosition.Bottom;
			};
		};
		
		// You can only drop inside of menu items
		if ((dropType == I.DragItem.Menu) && (this.position != I.BlockPosition.None)) {
			this.position = I.BlockPosition.Inner;
		};
		
		node.removeClass('top bottom left right middle');
		if ((this.position != I.BlockPosition.None) && this.canDrop) {
			node.addClass('isOver ' + this.getDirectionClass(this.position));
		};
	};
	
	getParentIds (id: string, parentIds: string[]) {
		const { rootId, dataset } = this.props;
		const { dragProvider } = dataset || {};
		
		if (!dragProvider) {
			return;
		};
		
		const item = dragProvider.map[id];
		if (!item) {
			return;
		};
		
		if (item.parentId == rootId) {
			return;
		};
		
		parentIds.push(item.parentId);
		this.getParentIds(item.parentId, parentIds);
	};
	
	getDirectionClass (dir: I.BlockPosition) {
		let c = '';
		switch (dir) {
			case I.BlockPosition.None: c = ''; break;
			case I.BlockPosition.Top: c = 'top'; break;
			case I.BlockPosition.Bottom: c = 'bottom'; break;
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
		
		const { disabled, onDrop, dropType, id } = this.props;
		if (disabled) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isOver top bottom left right middle');
		
		if (this.canDrop && onDrop && (this.position != I.BlockPosition.None)) {
			onDrop(e, dropType, id, this.position);			
		};
	};
	
};

export default DropTarget;