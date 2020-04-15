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
	onDrop?(e: any, dropType: string, rootId: string, targetId: string, position: I.BlockPosition): void;
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
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { children, className } = this.props;
		
		let cn = [ 'dropTarget' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave} onDrop={this.onDrop} onClick={this.onClick}>
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
		const { dragProvider } = dataset || {};
		
		if (disabled || !dragProvider) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const ex = e.pageX;
		const ey = e.pageY;
		const domRect = (node.get(0) as Element).getBoundingClientRect() as DOMRect;
		const isFileDrop = (e.dataTransfer.items && e.dataTransfer.items.length) || (e.dataTransfer.files && e.dataTransfer.files.length);
		
		let { x, y, width, height } = domRect;
		y += win.scrollTop();
		
		let rect = {
			x: x + width * 0.15,
			y: y + height * 0.3,
			width: x + width * 0.60,
			height: y + height * 0.7
		};
		
		this.canDrop = true;
		
		if (!isFileDrop && (dragProvider.type == I.DragItem.Block)) {
			let parentIds: string[] = [];
			this.getParentIds(id, parentIds);
			
			for (let dropId of dragProvider.ids) {
				if ((dropId == id) || (parentIds.length && (parentIds.indexOf(dropId) >= 0))) {
					this.canDrop = false;
					break;
				};
			};
		};
		
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
		if (type == I.BlockType.IconPage) {
			this.position = I.BlockPosition.None;
		};
		
		// You can drop only on bottom of Title
		if (type == I.BlockType.Title) {
			this.position = I.BlockPosition.None;
		};
		
		// You cant drop in Headers
		if ((this.position == I.BlockPosition.Inner) && (type == I.BlockType.Text) && [ I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3, I.TextStyle.Header4 ].indexOf(style) >= 0) {
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
		
		const { disabled, onDrop, dropType, rootId, id } = this.props;
		if (disabled) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isOver top bottom left right middle');
		
		if (this.canDrop && onDrop && (this.position != I.BlockPosition.None)) {
			onDrop(e, dropType, rootId, id, this.position);
		};
	};
	
	onClick (e: any) {
		const { onClick } = this.props;
		
		if (onClick) {
			onClick(e);
		};
	};
	
};

export default DropTarget;