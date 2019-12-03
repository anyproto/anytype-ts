import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { Block as Child, Icon, DropTarget } from 'ts/component';
import { throttle } from 'lodash';
import { commonStore, blockStore } from 'ts/store';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockIcon from './icon';
import BlockVideo from './video';
import BlockFile from './file';
import BlockBookmark from './bookmark';
import BlockLink from './link';

interface Props extends I.Block, RouteComponentProps<any> {
	rootId: string;
	index: number;
	dataset?: any;
	onKeyDown? (e: any): void;
	onKeyUp? (e: any): void;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const THROTTLE = 20;

class Block extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refObj: any = {};
	refComponent: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.resize = this.resize.bind(this);
	};

	render () {
		const { id, type, fields, content, childBlocks, index, restrictions } = this.props;
		const { style } = content;
		
		let canDrop = true;
		let canSelect = true;
		let cn = [ 'block', 'index' + index ];
		let BlockComponent: any = null;
		let ColResize: React.ReactType<{ index: number }> = () => null;
		let css: any = {
			width: (fields.width || 1) * 100 + '%'
		};
		
		switch (type) {
			default:
			case I.BlockType.Text:
				cn.push('blockText');
				
				if (style == I.TextStyle.Toggle) {
					cn.push('canToggle');
				};
				
				BlockComponent = () => (
					<BlockText onToggle={this.onToggle} onFocus={this.onFocus} onBlur={this.onBlur} {...this.props} />
				);
				break;
				
			case I.BlockType.Layout:
				canDrop = false;
				canSelect = false;
				cn.push('blockLayout c' + style);
				
				if (style == I.LayoutStyle.Row) {
					ColResize = (item: any) => (
						<div className={[ 'colResize', 'c' + item.index ].join(' ')} onMouseDown={(e: any) => { this.onResizeStart(e, item.index); }}>
							<div className="inner" />
						</div>
					);
				};
				
				BlockComponent = (): any => null;
				break;
				
			case I.BlockType.Image:
				cn.push('blockImage');
				BlockComponent = () => (
					<BlockImage ref={(ref: any) => { this.refComponent = ref; }} {...this.props} width={fields.width || 1} />
				);
				break;
				
			case I.BlockType.Icon:
				cn.push('blockIcon');
				BlockComponent = BlockIcon;
				break;
				
			case I.BlockType.Video:
				cn.push('blockVideo');
				BlockComponent = BlockVideo;
				break;
				
			case I.BlockType.File:
				cn.push('blockFile');
				BlockComponent = BlockFile;
				break;
				
			case I.BlockType.Bookmark:
				cn.push('blockBookmark');
				BlockComponent = BlockBookmark;
				break;
			
			case I.BlockType.Dataview:
				cn.push('blockDataview');
				BlockComponent = BlockDataview;
				break;
				
			case I.BlockType.Div:
				cn.push('blockDiv');
				BlockComponent = () => <div className="div" />;
				break;
				
			case I.BlockType.Link:
				cn.push('blockLink');
				BlockComponent = BlockLink;
				break;
		};
		
		let wrapMenu = (
			<div className="wrapMenu">
				<div className="icon dnd" draggable={true} onDragStart={this.onDragStart} onClick={this.onMenu} />
			</div>
		);
		
		let wrapContent = (
			<div className="wrapContent">
				<div className={[ (canSelect ? 'selectable' : ''), 'c' + id ].join(' ')} data-id={id} data-type={type}>
					<DropTarget id={id} type={I.DragItem.Block} disabled={restrictions.dropOn} onDrop={this.onDrop}>
						<BlockComponent {...this.props} />
					</DropTarget>
				</div>
					
				<div className="children" onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
					{childBlocks.map((item: any, i: number) => {
						return (
							<React.Fragment key={item.id}>
								{i > 0 ? <ColResize index={i} /> : ''}
								<Child ref={(ref: any) => this.refObj[item.id] = ref} {...this.props} {...item} index={i} />
							</React.Fragment>
						);
					})}
				</div>
			</div>
		);
		
		return (
			<div id={'block-' + id} data-id={id} className={cn.join(' ')} style={css}>
				<div className="id tag red">{id}</div>
				{wrapMenu}
				{wrapContent}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onToggle (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		
		node.hasClass('isToggled') ? node.removeClass('isToggled') : node.addClass('isToggled');
	};
	
	onDragStart (e: any) {
		const { dataset, id, restrictions } = this.props;
		const { selection, onDragStart } = dataset;
		
		if (!dataset) {
			return;
		};
		
		if (restrictions.drag) {
			e.preventDefault();
			e.stopPropagation();
		};
		
		let ids = [ id ];
		if (selection) {
			let selectedIds = selection.get();
			if (selectedIds.length && (selectedIds.indexOf(id) >= 0)) {
				ids = selectedIds;
			};
			
			selection.set(ids);
			selection.hide();
			selection.setBlocked(true);
		};
		
		if (!restrictions.drag && onDragStart) {
			onDragStart(e, I.DragItem.Block, ids, this);				
		};
	};
	
	onDrop (e: any, type: string, id: string, direction: string) {
		const { dataset } = this.props;
		const { onDrop } = dataset;
		
		if (dataset && onDrop) {
			onDrop(e, type, id, direction);			
		};
	};
	
	onMenu (e: any) {
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (selection) {
			selection.set([ id ]);
		};
		
		commonStore.menuOpen('blockAction', { 
			element: 'block-' + id,
			type: I.MenuType.Vertical,
			offsetX: 50,
			offsetY: -node.outerHeight(),
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				blockId: id, 
				rootId: rootId,
			},
		});
	};
	
	onFocus (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('isFocused');
	};
	
	onBlur (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isFocused');
	};
	
	onResizeStart (e: any, index: number) {
		const { dataset, childBlocks } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlock = childBlocks[index - 1];
		const currentBlock = childBlocks[index];
		const offset = node.find('#block-' + prevBlock.id).offset().left + Constant.size.blockMenu;
		
		if (selection) {
			selection.setBlocked(true);
		};
		this.unbind();
		node.addClass('isResizing');
		
		this.onResize(e, index, offset);
		win.on('mousemove.block', (e: any) => { this.onResize(e, index, offset); });
		win.on('mouseup.block', throttle((e: any) => { this.onResizeEnd(e, index, offset); }));
	};

	onResize (e: any, index: number, offset: number) {
		e.preventDefault();
		e.stopPropagation();
		
		const { childBlocks } = this.props;		
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlock = childBlocks[index - 1];
		const prevNode = node.find('#block-' + prevBlock.id);
		const currentBlock = childBlocks[index];
		const currentNode = node.find('#block-' + currentBlock.id);
		const res = this.calcWidth(e.pageX - offset, index);
		const w1 = res.percent * res.sum;
		const w2 = (1 - res.percent) * res.sum;
		
		prevNode.css({ width: w1 * 100 + '%' });
		currentNode.css({ width: w2 * 100 + '%' });
		
		this.callChildMethod(prevBlock.id, 'resize', [ w1 ]);
		this.callChildMethod(currentBlock.id, 'resize', [ w2 ]);
	};

	onResizeEnd (e: any, index: number, offset: number) {
		const { dataset, childBlocks } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlock = childBlocks[index - 1];
		const currentBlock = childBlocks[index];
		const res = this.calcWidth(e.pageX - offset, index);
		
		if (selection) {
			selection.setBlocked(false);	
		};
		this.unbind();
		node.removeClass('isResizing');
		
		prevBlock.fields.width = res.percent * res.sum;
		currentBlock.fields.width = (1 - res.percent) * res.sum;
	};
	
	calcWidth (x: number, index: number) {
		const { childBlocks } = this.props;
		const prevBlock = childBlocks[index - 1];
		const currentBlock = childBlocks[index];
		const dw = 1 / childBlocks.length;
		const sum = (prevBlock.fields.width || dw) + (currentBlock.fields.width || dw);
		
		x = Math.max(120, x);
		x = Math.min(sum * (Constant.size.editorPage - 120), x);
		x = x / (sum * Constant.size.editorPage);
		
		return { sum: sum, percent: x };
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { childBlocks, type, content } = this.props;
		const { style } = content;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!childBlocks.length || (type != I.BlockType.Layout) || (style != I.LayoutStyle.Row)) {
			return;
		};
		
		const rect = node.get(0).getBoundingClientRect() as DOMRect;
		const p = (e.pageX - rect.x) / (Constant.size.editorPage + 50);
		
		let c = 0;
		let num = 0;
		
		for (let i in childBlocks) {
			let child = childBlocks[i];
			
			c += child.fields.width;
			
			if ((p >= c - 0.1) && (p <= c + 0.1)) {
				num = Number(i) + 1;
				break;
			};
		};
		
		node.find('.colResize.active').removeClass('active');
		if (num) {
			node.find('.colResize.c' + num).addClass('active');
		};
	};
	
	callChildMethod (id: string, method: string, args?: any[]) {
		if (this.refObj[id] && this.refObj[id][method]) {
			this.refObj[id][method].apply(this.refObj[id], args);
		};
	};
	
	resize (width: number) {
		if (this.refComponent && this.refComponent.resize) {
			this.refComponent.resize(width);
		};
		for (let id in this.refObj) {
			if (this.refObj[id].refComponent && this.refObj[id].refComponent.resize) {
				this.refObj[id].refComponent.resize(width);
			};
		};
	};
	
	onMouseLeave (e: any) {
		$('.colResize.active').removeClass('active');
	};
	
	unbind () {
		$(window).unbind('mousemove.block mouseup.block');
	};
	
};

export default Block;