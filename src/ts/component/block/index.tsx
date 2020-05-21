import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, Util, DataUtil, keyboard, focus, Storage } from 'ts/lib';
import { Icon, DropTarget, ListChildren } from 'ts/component';
import { throttle } from 'lodash';
import { observer } from 'mobx-react';
import { commonStore, blockStore } from 'ts/store';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockImage from './image';
import BlockIconPage from './iconPage';
import BlockIconUser from './iconUser';
import BlockTitle from './title';
import BlockVideo from './video';
import BlockFile from './file';
import BlockBookmark from './bookmark';
import BlockLink from './link';
import BlockCover from './cover';

interface Props extends RouteComponentProps<any> {
	index?: any;
	rootId: string;
	dataset?: any;
	cnt?: number;
	css?: any;
	className?: string;
	block: I.Block;
	onKeyDown? (e: any, text?: string): void;
	onKeyUp? (e: any, text?: string): void;
	onMenuAdd? (id: string, text: string, range: I.TextRange): void;
	onPaste? (e: any): void;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const THROTTLE = 20;
const SNAP = 0.02;

@observer
class Block extends React.Component<Props, {}> {

	public static defaultProps = {
		align: I.BlockAlign.Left,
	};

	_isMounted: boolean = false;
		
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
		this.onToggleClick = this.onToggleClick.bind(this);
		this.onEmptyClick = this.onEmptyClick.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onMenuDown = this.onMenuDown.bind(this);
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { rootId, cnt, css, index, className, block } = this.props;
		const { id, type, fields, content, align, bgColor } = block;
		const { style, checked } = content || {};
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		
		let canSelect = true;
		let cn: string[] = [ 'block', (index ? 'index-' + index : ''), 'align' + align ];
		let cd: string[] = [ 'wrapContent' ];
		let blockComponent = null;
		let empty = null;
		
		if (className) {
			cn.push(className);
		};
		
		if (bgColor) {
			cd.push('bgColor bgColor-' + bgColor);
		};
		
		switch (type) {
			case I.BlockType.Text:
				cn.push('blockText ' + DataUtil.styleClassText(style));
				
				if (checked) {
					cn.push('isChecked');
				};
				
				if (block.isToggle()) {
					if (!childrenIds.length) {
						empty = (
							<div className="emptyToggle" onClick={this.onToggleClick}>Empty toggle. Click and drop block inside</div>
						);
					};
				};
				
				blockComponent = <BlockText {...this.props} onToggle={this.onToggle} onFocus={this.onFocus} onBlur={this.onBlur} />;
				break;
				
			case I.BlockType.Layout:
				canSelect = false;
				cn.push('blockLayout c' + content.style);
				break;
				
			case I.BlockType.IconPage:
				canSelect = false;
				cn.push('blockIconPage');
				blockComponent = <BlockIconPage {...this.props} />;
				break;
				
			case I.BlockType.IconUser:
				canSelect = false;
				cn.push('blockIconUser');
				blockComponent = <BlockIconUser {...this.props} />;
				break;
				
			case I.BlockType.Title:
				canSelect = false;
				cn.push('blockTitle');
				blockComponent = <BlockTitle {...this.props} />;
				break;
				
			case I.BlockType.File:
				switch (content.type) {
					default: 
					case I.FileType.File: 
						cn.push('blockFile');
						blockComponent = <BlockFile {...this.props} />;
						break;
						
					case I.FileType.Image: 
						cn.push('blockMedia');
						blockComponent = <BlockImage {...this.props} />;
						break;
						
					case I.FileType.Video: 
						cn.push('blockMedia');
						blockComponent = <BlockVideo {...this.props} />;
						break;
				};
				break;
				
			case I.BlockType.Bookmark:
				cn.push('blockBookmark');
				blockComponent = <BlockBookmark {...this.props} />;
				break;
			
			case I.BlockType.Dataview:
				cn.push('blockDataview');
				blockComponent = <BlockDataview {...this.props} />;
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
				
				blockComponent = <div className="div">{inner}</div>;
				break;
				
			case I.BlockType.Link:
				cn.push('blockLink');
				blockComponent = <BlockLink {...this.props} />;
				break;
				
			case I.BlockType.Cover:
				canSelect = false;
				cn.push('blockCover');
				blockComponent = <BlockCover {...this.props} block={block} />;
				break;
		};
		
		let object = (
			<DropTarget {...this.props} rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block}>
				{blockComponent}
			</DropTarget>
		);
		
		if (canSelect) {
			object = (
				<div id={'selectable-' + id} className="selectable" data-id={id}>
					{object}
					<div className="selectionOver" />
				</div>
			);
		} else {
			object = (
				<div className="selectable">
					{object}
				</div>
			);
		};
		
		return (
			<div id={'block-' + id} data-id={id} className={cn.join(' ')} style={css}>
				<div className="wrapMenu">
					<div id={'button-block-menu-' + id} className="icon dnd" draggable={true} onDragStart={this.onDragStart} onMouseDown={this.onMenuDown} onClick={this.onMenuClick} />
				</div>
				
				<div className={cd.join(' ')}>
					{object}
					
					{block.isLayoutRow() ? (
						<React.Fragment>
							<DropTarget {...this.props} className="targetTop" rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} />
							<DropTarget {...this.props} className="targetBot" rootId={rootId} id={id} style={style} type={type} dropType={I.DragItem.Block} />
						</React.Fragment>
					): ''}
					
					{empty}
					<ListChildren {...this.props} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave} onResizeStart={this.onResizeStart} />
					
					{block.isLayoutColumn() ? (
						<div className="columnEmpty" onClick={this.onEmptyClick} />
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.initToggle();
	};
	
	componentDidUpdate () {
		const { block, dataset } = this.props;
		const { id, content } = block
		const { selection } = dataset || {};
		const { focused } = focus;
		
		if (selection) {
			selection.set(selection.get());
		};

		if (focused == id) {
			focus.apply();
		};

		this.initToggle();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	initToggle () {
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));

		if (block.isToggle()) {
			Storage.checkToggle(rootId, block.id) ? node.addClass('isToggled') : node.removeClass('isToggled');
		};
	};
	
	onToggle (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (node.hasClass('isToggled')) {
			node.removeClass('isToggled');
			Storage.setToggle(rootId, block.id, false);
		} else {
			node.addClass('isToggled');
			Storage.setToggle(rootId, block.id, true);
		};
	};
	
	onToggleClick (e: any) {
		const { rootId, block } = this.props;
		const { id } = block;
		const param = {
			type: I.BlockType.Text
		};
		
		C.BlockCreate(param, rootId, id, I.BlockPosition.Inner, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
	onDragStart (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, block } = this.props;
		const { selection, onDragStart } = dataset || {};
		
		if (!selection) {
			return;
		};
		
		if (!block.isDraggable()) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};
		
		if (!onDragStart) {
			return;
			
		};
			
		let ids: string[] = selection.get(false);
			
		if (ids.indexOf(block.id) < 0) {
			selection.clear(true);
			selection.set([ block.id ]);
			ids = [ block.id ];
		};
				
		selection.preventSelect(true);
		selection.preventClear(true);
		
		onDragStart(e, I.DragItem.Block, ids, this);
	};
	
	onMenuDown (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		if (selection) {
			selection.preventClear(true);
		};
	};
	
	onMenuClick (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, rootId, block } = this.props;
		const { id } = block;
		const { selection } = dataset || {};

		commonStore.menuOpen('blockAction', { 
			element: '#button-block-menu-' + id,
			type: I.MenuType.Vertical,
			offsetX: 20,
			offsetY: 0,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Right,
			data: {
				blockId: id,
				blockIds: DataUtil.selectionGet(id, this.props),
				rootId: rootId,
				dataset: dataset,
			},
			onClose: () => {
				selection.preventClear(false);
				selection.clear();
			}
		});
	};
	
	onFocus (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('isFocused');
	};
	
	onBlur (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isFocused');
	};
	
	onResizeStart (e: any, index: number) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const offset = node.find('#block-' + prevBlockId).offset().left + Constant.size.blockMenu;
		const add = $('#button-add');
		
		if (selection) {
			selection.preventSelect(true);
		};

		this.unbind();
		node.addClass('isResizing');
		keyboard.setResize(true);
		add.css({ opacity: 0 });
		
		node.find('.colResize.active').removeClass('active');
		node.find('.colResize.c' + index).addClass('active');
		
		win.on('mousemove.block', throttle((e: any) => { this.onResize(e, index, offset); }, THROTTLE));
		win.on('mouseup.block', throttle((e: any) => { this.onResizeEnd(e, index, offset); }));
		
		node.find('.resizable').trigger('resizeStart', [ e ]);
	};

	onResize (e: any, index: number, offset: number) {
		if (!this._isMounted) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();
		
		const { rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		
		const prevNode = node.find('#block-' + prevBlockId);
		const currentNode = node.find('#block-' + currentBlockId);
		const res = this.calcWidth(e.pageX - offset, index);
		
		const w1 = res.percent * res.sum;
		const w2 = (1 - res.percent) * res.sum;
		
		prevNode.css({ width: w1 * 100 + '%' });
		currentNode.css({ width: w2 * 100 + '%' });
		
		node.find('.resizable').trigger('resize', [ e ]);
	};

	onResizeEnd (e: any, index: number, offset: number) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const { selection } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		const res = this.calcWidth(e.pageX - offset, index);
		
		if (selection) {
			selection.preventSelect(false);	
		};
		this.unbind();
		node.removeClass('isResizing');
		keyboard.setResize(false);
		
		node.find('.colResize.active').removeClass('active');
		
		C.BlockListSetFields(rootId, [
			{ blockId: prevBlockId, fields: { width: res.percent * res.sum } },
			{ blockId: currentBlockId, fields: { width: (1 - res.percent) * res.sum } },
		]);
		
		node.find('.resizable').trigger('resizeEnd', [ e ]);
	};
	
	calcWidth (x: number, index: number) {
		const { rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		
		const prevBlockId = childrenIds[index - 1];
		const prevBlock = blockStore.getLeaf(rootId, prevBlockId);
		
		const currentBlockId = childrenIds[index];
		const currentBlock = blockStore.getLeaf(rootId, currentBlockId);
		
		const dw = 1 / childrenIds.length;
		const sum = (prevBlock.fields.width || dw) + (currentBlock.fields.width || dw);
		const offset = Constant.size.blockMenu * 2;
		
		x = Math.max(offset, x);
		x = Math.min(sum * Constant.size.editorPage - offset, x);
		x = x / (sum * Constant.size.editorPage);
		
		// Snap
		if (x > 0.5 - SNAP && x < 0.5) {
			x = 0.5;
		};
		if (x < 0.5 + SNAP && x > 0.5) {
			x = 0.5;
		};
		
		return { sum: sum, percent: x };
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted|| keyboard.isResizing) {
			return;
		};
		
		const { rootId, block } = this.props;
		const { id } = block;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!block.isLayoutRow() || keyboard.isDragging) {
			return;
		};
		
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const length = childrenIds.length;
		const children = blockStore.getChildren(rootId, id);
		const rect = node.get(0).getBoundingClientRect() as DOMRect;
		const p = (e.pageX - rect.x) / (Constant.size.editorPage + 50);
		
		let c = 0;
		let num = 0;
		
		for (let i in children) {
			const child = children[i];
			
			c += child.fields.width || 1 / length;
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
		if (!keyboard.isResizing) {
			$('.colResize.active').removeClass('active');
		};
	};
	
	unbind () {
		$(window).unbind('mousemove.block mouseup.block');
	};
	
	onEmptyClick () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		
		if (!block.isLayoutColumn() || !childrenIds.length) {
			return;
		};
		
		const param =  {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		};
		
		C.BlockCreate(param, rootId, childrenIds[childrenIds.length - 1], I.BlockPosition.Bottom, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
};

export default Block;