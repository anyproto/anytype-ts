import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { Block as Child, Icon, DropTarget } from 'ts/component';
import { throttle } from 'lodash';
import { blockStore } from 'ts/store';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockIcon from './icon';
import BlockVideo from './video';
import BlockFile from './file';
import BlockBookmark from './bookmark';

const Constant = require('json/constant.json');

interface Props extends I.Block {
	index: number;
	number: number;
	dataset?: any;
	onKeyDown? (e: any): void;
	onKeyUp? (e: any): void;
};

interface State {
	toggled: boolean;
};

const $ = require('jquery');

class Block extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		toggled: false
	};
	
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
	};

	render () {
		const { header, fields, content, childBlocks, index } = this.props;
		const { id, type } = header;
		const { style, toggleable } = content;
		const { toggled } = this.state;
		
		let n = 0;
		let canDrop = true;
		let canSelect = true;
		let cn = [ 'block', 'index' + index ];
		let BlockComponent: React.ReactType<{}>;
		let ColResize: React.ReactType<{ index: number }> = () => null;
		let css: any = {
			width: (fields.width || 1) * 100 + '%'
		};
		
		switch (type) {
			default:
			case I.BlockType.Text:
				cn.push('blockText');
				if (toggleable) {
					cn.push('canToggle');
				};
				
				BlockComponent = () => <BlockText toggled={toggled} onToggle={this.onToggle} onFocus={this.onFocus} onBlur={this.onBlur} {...this.props} />;
				break;
				
			case I.BlockType.Layout:
				canDrop = false;
				canSelect = false;
				cn.push('blockLayout c' + style);
				
				if (style == I.LayoutStyle.Row) {
					ColResize = (item: any) => (
						<div className="colResize" onMouseDown={(e: any) => { this.onResizeStart(e, item.index); }}>
							<div className="inner" />
						</div>
					);
				};
				
				BlockComponent = () => null;
				break;
				
			case I.BlockType.Image:
				cn.push('blockImage');
				BlockComponent = BlockImage;
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
		};
		
		let wrapMenu = (
			<div className="wrapMenu">
				<div className="icon dnd" draggable={true} onDragStart={this.onDragStart} onClick={this.onMenu} />
			</div>
		);
		
		let wrapContent = (
			<div className="wrapContent">
				<div className={[ (canSelect ? 'selectable' : ''), 'c' + id ].join(' ')} data-id={id} data-type={type}>
					<DropTarget id={header.id} type={I.DragItem.Block} onDrop={this.onDrop}>
						<BlockComponent {...this.props} />
					</DropTarget>
				</div>
					
				<div className={[ 'children', (toggled ? 'active' : '') ].join(' ')}>
					{childBlocks.map((item: any, i: number) => {
						n = Util.incrementBlockNumber(item, n);
						
						return (
							<React.Fragment key={item.header.id}>
								{i > 0 ? <ColResize index={i} /> : ''}
								<Child {...this.props} {...item} number={n} index={i} />
							</React.Fragment>
						);
					})}
				</div>
			</div>
		);
		
		return (
			<div id={'block-' + id} className={cn.join(' ')} style={css}>
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
		this.setState({ toggled: !this.state.toggled });
	};
	
	onDragStart (e: any) {
		const { dataset, header } = this.props;
		const { selection, onDragStart } = dataset;
		
		if (dataset) {
			let ids = [ header.id ];
			if (selection) {
				let selectedIds = selection.get();
				if (selectedIds.length && (selectedIds.indexOf(header.id) >= 0)) {
					ids = selectedIds;
				};
			};
			if (onDragStart) {
				onDragStart(e, I.DragItem.Block, ids, this);				
			};
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
		const { dataset, header } = this.props;
		const { selection } = dataset;
		
		if (selection) {
			selection.set([ header.id ]);
		};
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
		const offset = node.find('#block-' + prevBlock.header.id).offset().left + Constant.size.blockMenu;
		
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
		const prevNode = node.find('#block-' + prevBlock.header.id);
		const currentBlock = childBlocks[index];
		const currentNode = node.find('#block-' + currentBlock.header.id);
		const res = this.calcWidth(e.pageX - offset, index);
		
		prevNode.css({ width: (res.percent * res.sum * 100) + '%' });
		currentNode.css({ width: ((1 - res.percent) * res.sum * 100) + '%' });
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
		
		blockStore.blockUpdate({
			header: prevBlock.header,
			fields: { width: res.percent * res.sum }
		});
		
		blockStore.blockUpdate({
			header: currentBlock.header,
			fields: { width: (1 - res.percent) * res.sum }
		});
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
	
	unbind () {
		$(window).unbind('mousemove.block mouseup.block');
	};
	
};

export default Block;