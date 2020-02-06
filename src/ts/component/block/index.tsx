import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, Util } from 'ts/lib';
import { Icon, DropTarget, ListChildren } from 'ts/component';
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
	blockStore?: any;
	rootId: string;
	index: number;
	dataset?: any;
	cnt?: number;
	css?: any;
	className?: string;
	onKeyDown? (e: any, text?: string): void;
	onKeyUp? (e: any, text?: string): void;
	onMenuAdd? (id: string): void;
	onPaste? (e: any): void;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const THROTTLE = 20;

class Block extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onMenuDown = this.onMenuDown.bind(this);
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, rootId, type, fields, content, index, cnt, css, className } = this.props;
		const { style } = content || {};
		
		let canSelect = true;
		let cn: string[] = [ 'block', 'index' + index ];
		let cd: string[] = [];
		let BlockComponent: any = (): any => null;
		
		if (className) {
			cn.push(className);
		};
		
		switch (type) {
			case I.BlockType.Text:
				cn.push('blockText ' + Util.styleClass(content.style));
				if (content.bgColor) {
					cd.push('bgColor bgColor-' + content.bgColor);
				};
				if (content.checked) {
					cn.push('isChecked');
				};
				BlockComponent = () => (
					<BlockText onToggle={this.onToggle} onFocus={this.onFocus} onBlur={this.onBlur} {...this.props} />
				);
				break;
				
			case I.BlockType.Layout:
				canSelect = false;
				cn.push('blockLayout c' + content.style);
				break;
				
			case I.BlockType.Icon:
				cn.push('blockIcon');
				BlockComponent = BlockIcon;
				break;
				
			case I.BlockType.File:
				switch (content.type) {
					default: 
					case I.FileType.File: 
						cn.push('blockFile');
						BlockComponent = BlockFile;
						break;
						
					case I.FileType.Image: 
						cn.push('blockImage');
						BlockComponent = () => (
							<BlockImage {...this.props} width={fields.width || 1} />
						);
						break;
						
					case I.FileType.Video: 
						cn.push('blockVideo');
						BlockComponent = BlockVideo;
						break;
				};
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
				cn.push('blockDiv c' + content.style);
				
				let inner: any = null;
				switch (content.style) {
					case I.DivStyle.Dot:
						inner = (
							<React.Fragment>
								<div className="dot" />
								<div className="dot" />
								<div className="dot" />
							</React.Fragment>
						);
						break;
				};
				
				BlockComponent = () => <div className="div">{inner}</div>;
				break;
				
			case I.BlockType.Link:
				cn.push('blockLink');
				BlockComponent = BlockLink;
				break;
		};
		
		return (
			<div id={'block-' + id} data-id={id} className={cn.join(' ')} style={css}>
				<div className="wrapMenu">
					<div className="icon dnd" draggable={true} onDragStart={this.onDragStart} onMouseDown={this.onMenuDown} onClick={this.onMenuClick} />
				</div>
				
				<div className="wrapContent">
					{canSelect ? (
						<div className={[ 'selectable', 'c' + id ].join(' ')} data-id={id} data-type={type}>
							<DropTarget {...this.props} className={cd.join(' ')} rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} onDrop={this.onDrop}>
								<BlockComponent {...this.props} />
							</DropTarget>
						</div>
					) : ''}
					
					{(type == I.BlockType.Layout) && (content.style == I.LayoutStyle.Row) ? (
						<React.Fragment>
							<DropTarget {...this.props} className="targetTop" rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} onDrop={this.onDrop} />
							<DropTarget {...this.props} className="targetBot" rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} onDrop={this.onDrop} />
						</React.Fragment>
					): ''}
					
					<ListChildren {...this.props} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave} onResizeStart={this.onResizeStart} />
				</div>
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
		const { dataset, id, type, content } = this.props;
		const { selection, onDragStart } = dataset;
		
		if (!dataset) {
			return;
		};
		
		const { style } = content;

		let canDrag = true;
		
		if (type == I.BlockType.Icon) {
			canDrag = false;
		};
		
		if (style == I.TextStyle.Title) {
			canDrag = false;
		};
		
		if (!canDrag) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};
		
		let ids = [ id ];
		if (selection) {
			let selectedIds = selection.get();
			if (selectedIds.length && (selectedIds.indexOf(id) >= 0)) {
				ids = selectedIds;
			};
			
			selection.set(ids);
			selection.hide();
			selection.setPreventSelect(true);
			selection.setPreventClear(true);
		};
		
		if (onDragStart) {
			onDragStart(e, I.DragItem.Block, ids, this);				
		};
	};
	
	onDrop (e: any, type: string, targetId: string, position: I.BlockPosition) {
		const { dataset } = this.props;
		const { selection, onDrop } = dataset;
		
		if (selection) {
			selection.setPreventClear(false);
		};
		
		if (dataset && onDrop) {
			onDrop(e, type, targetId, position);			
		};
	};
	
	onMenuDown (e: any) {
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		
		if (selection) {
			selection.setPreventClear(true);
		};
	};
	
	onMenuClick (e: any) {
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		let ids = [];
		if (selection) {
			selection.setPreventClear(false);
			ids = selection.get();
			if (ids.length <= 1) {
				ids = [ id ];
			};
			selection.set(ids);
			selection.setPreventClear(true);
		};
		
		commonStore.menuOpen('blockAction', { 
			element: 'block-' + id,
			type: I.MenuType.Vertical,
			offsetX: node.outerWidth() - 26,
			offsetY: -node.outerHeight(),
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				blockId: id,
				blockIds: ids,
				rootId: rootId,
			},
			onClose: () => {
				selection.setPreventClear(false);
			}
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
		
		let offset = node.find('#block-' + $.escapeSelector(prevBlock.id)).offset().left + Constant.size.blockMenu;
		
		if (selection) {
			selection.setPreventSelect(true);
		};
		this.unbind();
		node.addClass('isResizing');
		
		win.on('mousemove.block', (e: any) => { this.onResize(e, index, offset); });
		win.on('mouseup.block', throttle((e: any) => { this.onResizeEnd(e, index, offset); }));
	};

	onResize (e: any, index: number, offset: number) {
		e.preventDefault();
		e.stopPropagation();
		
		const { childBlocks } = this.props;		
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlock = childBlocks[index - 1];
		const prevNode = node.find('#block-' + $.escapeSelector(prevBlock.id));
		const currentBlock = childBlocks[index];
		const currentNode = node.find('#block-' + $.escapeSelector(currentBlock.id));
		const res = this.calcWidth(e.pageX - offset, index);
		
		const w1 = res.percent * res.sum;
		const w2 = (1 - res.percent) * res.sum;
		
		prevNode.css({ width: w1 * 100 + '%' });
		currentNode.css({ width: w2 * 100 + '%' });
		
		node.find('.colResize.active').removeClass('active');
		node.find('.colResize.c' + index).addClass('active');
	};

	onResizeEnd (e: any, index: number, offset: number) {
		const { dataset, childBlocks, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlock = childBlocks[index - 1];
		const currentBlock = childBlocks[index];
		const res = this.calcWidth(e.pageX - offset, index);
		
		if (selection) {
			selection.setPreventSelect(false);	
		};
		this.unbind();
		node.removeClass('isResizing');
		
		C.BlockListSetFields(rootId, [
			{ blockId: prevBlock.id, fields: { width: res.percent * res.sum } },
			{ blockId: currentBlock.id, fields: { width: (1 - res.percent) * res.sum } },
		]);
	};
	
	calcWidth (x: number, index: number) {
		const { childBlocks } = this.props;
		const prevBlock = childBlocks[index - 1];
		const currentBlock = childBlocks[index];
		const dw = 1 / childBlocks.length;
		const sum = (prevBlock.fields.width || dw) + (currentBlock.fields.width || dw);
		
		x = Math.max(60, x);
		x = Math.min(sum * Constant.size.editorPage - 35, x);
		x = x / (sum * Constant.size.editorPage);
		
		return { sum: sum, percent: x };
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, id, childBlocks, type, content } = this.props;
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
			const child = childBlocks[i];
			
			c += child.fields.width || 1 / childBlocks.length;
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
	
	onMouseLeave (e: any) {
		$('.colResize.active').removeClass('active');
	};
	
	unbind () {
		$(window).unbind('mousemove.block mouseup.block');
	};
	
};

export default Block;