import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, DataUtil, keyboard, focus, Storage, translate } from 'ts/lib';
import { DropTarget, ListChildren, Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { menuStore, blockStore } from 'ts/store';

import BlockDataview from './dataview';
import BlockText from './text';
import BlockIconPage from './iconPage';
import BlockIconUser from './iconUser';
import BlockBookmark from './bookmark';
import BlockLink from './link';
import BlockCover from './cover';
import BlockDiv from './div';
import BlockRelation from './relation';
import BlockFeatured from './featured';
import BlockType from './type';
import BlockLatex from './latex';
import BlockTable from './table';
import BlockTableOfContents from './tableOfContents';

import BlockFile from './media/file';
import BlockImage from './media/image';
import BlockVideo from './media/video';
import BlockAudio from './media/audio';
import BlockPdf from './media/pdf'; 

interface Props extends I.BlockComponent, RouteComponentProps<any> {
	index?: any;
	css?: any;
	className?: string;
	iconSize?: number;
	isDragging?: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const SNAP = 0.01;

const Block = observer(class Block extends React.Component<Props, {}> {

	ref: any = null;

	public static defaultProps = {
		align: I.BlockAlign.Left,
		traceId: '',
		history: null,
		location: null,
		match: null,
	};

	_isMounted: boolean = false;
		
	constructor (props: any) {
		super(props);
		
		this.onToggle = this.onToggle.bind(this);
		this.onEmptyColumn = this.onEmptyColumn.bind(this);
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
		const { rootId, css, className, block, readonly, isDragging } = this.props;
		const { id, type, fields, content, align, bgColor } = block;

		if (!id) {
			return null;
		};

		const { style, checked } = content;
		const index = Number(this.props.index) || 0;

		let canSelect = true;
		let canDrop = !readonly;
		let cn: string[] = [ 'block', 'align' + align, DataUtil.blockClass(block, isDragging), 'index-' + index ];
		let cd: string[] = [ 'wrapContent' ];
		let blockComponent = null;
		let empty = null;
		let setRef = (ref: any) => { this.ref = ref; };
		
		if (className) {
			cn.push(className);
		};
		if (fields.isUnwrapped) {
			cn.push('isUnwrapped');
		};
		if (readonly) {
			cn.push('isReadonly');
		};

		if (bgColor && !block.isLink()) {
			cd.push('bgColor bgColor-' + bgColor);
		};
		
		switch (type) {
			case I.BlockType.Text:
				if (block.isTextCheckbox() && checked) {
					cn.push('isChecked');
				};

				blockComponent = <BlockText ref={setRef} {...this.props} onToggle={this.onToggle} />;
				break;

			case I.BlockType.Layout:
				canSelect = false;
				break;
				
			case I.BlockType.IconPage:
				canSelect = false;
				blockComponent = <BlockIconPage ref={setRef} {...this.props} />;
				break;
				
			case I.BlockType.IconUser:
				canSelect = false;
				blockComponent = <BlockIconUser ref={setRef} {...this.props} />;
				break;
				
			case I.BlockType.File:
				// Processing File style Link.
				// Making Embed as a default one

				if (isDragging || (style == I.FileStyle.Link)) {
					blockComponent = <BlockFile ref={setRef} {...this.props} />;
					break;
				};

				// Process Embed File
				switch (content.type) {
					default: 
						blockComponent = <BlockFile ref={setRef} {...this.props} />;
						break;
						
					case I.FileType.Image: 
						blockComponent = <BlockImage ref={setRef} {...this.props} />;
						break;
						
					case I.FileType.Video: 
						blockComponent = <BlockVideo ref={setRef} {...this.props} />;
						break;

					case I.FileType.Audio: 
						blockComponent = <BlockAudio ref={setRef} {...this.props} />;
						break;

					case I.FileType.Pdf:
						blockComponent = <BlockPdf ref={setRef} {...this.props} />;
						break;
				};

				break;
				
			case I.BlockType.Bookmark:
				blockComponent = <BlockBookmark ref={setRef} {...this.props} />;
				break;
			
			case I.BlockType.Dataview:
				blockComponent = <BlockDataview ref={setRef} {...this.props} />;
				break;
				
			case I.BlockType.Div:
				blockComponent = <BlockDiv ref={setRef} {...this.props} />;
				break;
				
			case I.BlockType.Link:
				blockComponent = <BlockLink ref={setRef} {...this.props} />;
				break;
				
			case I.BlockType.Cover:
				canSelect = false;
				blockComponent = <BlockCover ref={setRef} {...this.props} />;
				break;

			case I.BlockType.Relation:
				blockComponent = <BlockRelation ref={setRef} {...this.props} />;
				break;

			case I.BlockType.Featured:
				blockComponent = <BlockFeatured ref={setRef} {...this.props} />;
				break;

			case I.BlockType.Type:
				canSelect = false;
				blockComponent = <BlockType ref={setRef} {...this.props} />;
				break;

			case I.BlockType.Latex:
				blockComponent = <BlockLatex ref={setRef} {...this.props} />;
				break;

			case I.BlockType.Table:
				blockComponent = <BlockTable ref={setRef} {...this.props} />;
				break;
				
			case I.BlockType.TableOfContents:
				blockComponent = <BlockTableOfContents ref={setRef} {...this.props} />;
				break;
		};

		let object = null;

		if (canDrop) {
			object = (
				<DropTarget {...this.props} rootId={rootId} id={id} style={style} type={type} dropType={I.DragType.Block}>
					{blockComponent}
				</DropTarget>
			);
		} else {
			object = (
				<div className="dropTarget">
					{blockComponent}
				</div>
			);
		};
		
		if (canSelect) {
			object = (
				<div id={'selectable-' + id} className="selectable" data-id={id}>
					{object}
					<div className="selectionOver" />
					<div className="menuOver" />
				</div>
			);
		} else {
			object = (
				<div className="selectable">
					{object}
				</div>
			);
		};

		let rowDropTargets = null;
		if (block.isLayoutRow()) {
			if (readonly) {
				rowDropTargets = (
					<React.Fragment>
						<div className="dropTarget targetTop" />
						<div className="dropTarget targetBot" />
					</React.Fragment>
				);
			} else {
				rowDropTargets = (
					<React.Fragment>
						<DropTarget {...this.props} className="targetTop" rootId={rootId} id={id} style={style} type={type} dropType={I.DragType.Block} />
						<DropTarget {...this.props} className="targetBot" rootId={rootId} id={id} style={style} type={type} dropType={I.DragType.Block} />
					</React.Fragment>
				);
			};
		};

		return (
			<div id={'block-' + id} data-id={id} className={cn.join(' ')} style={css}>
				<div className="wrapMenu">
					<Icon id={'button-block-menu-' + id} className="dnd" draggable={true} onDragStart={this.onDragStart} onMouseDown={this.onMenuDown} onClick={this.onMenuClick} onContextMenu={this.onMenuClick} />
				</div>
				
				<div className={cd.join(' ')}>
					{object}
					{rowDropTargets}
					{empty}

					<ListChildren 
						key={'block-children-' + id} 
						{...this.props} 
						onMouseMove={this.onMouseMove} 
						onMouseLeave={this.onMouseLeave} 
						onResizeStart={this.onResizeStart} 
					/>
					
					{block.isLayoutColumn() ? (
						<div className="columnEmpty" onClick={this.onEmptyColumn} />
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
		const { block } = this.props;
		const { focused } = focus.state;

		if (focused == block.id) {
			focus.apply();
		};

		this.initToggle();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	initToggle () {
		const { rootId, block } = this.props;

		if (block.id && block.isTextToggle()) {
			blockStore.toggle(rootId, block.id, Storage.checkToggle(rootId, block.id));
		};
	};
	
	onToggle (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		blockStore.toggle(rootId, block.id, !node.hasClass('isToggled'));
		focus.apply();
	};
	
	onDragStart (e: any) {
		e.stopPropagation();

		if (!this._isMounted) {
			return;
		};
		
		const { dataset, block } = this.props;
		const { selection, onDragStart } = dataset || {};
		
		if (!selection || !onDragStart) {
			return;
		};
		
		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};
		
		selection.preventSelect(true);
		selection.preventClear(true);

		const ids: string[] = DataUtil.selectionGet(block.id, false, this.props);
		onDragStart(e, I.DragType.Block, ids, this);
	};
	
	onMenuDown (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		if (selection) {
			selection.preventClear(true);
		};

		focus.clear(true);
	};
	
	onMenuClick (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, rootId, block } = this.props;
		const { selection } = dataset || {};
		const elementId = `#button-block-menu-${block.id}`;
		const element = $(elementId);
		const offset = element.offset();
		const rect = { x: offset.left, y: keyboard.mouse.page.y, width: element.width(), height: 0 };

		menuStore.open('blockAction', { 
			offsetX: element.outerWidth(),
			rect: rect,
			data: {
				blockId: block.id,
				blockIds: DataUtil.selectionGet(block.id, true, this.props),
				rootId: rootId,
				dataset: dataset,
			},
			onClose: () => {
				selection.clear(true);
				focus.apply();
			}
		});
	};
	
	onResizeStart (e: any, index: number) {
		e.stopPropagation();

		const { dataset, rootId, block, readonly } = this.props;

		if (!this._isMounted || readonly) {
			return;
		};

		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const prevBlockId = childrenIds[index - 1];
		const offset = (prevBlockId ? node.find('#block-' + prevBlockId).offset().left : 0) + Constant.size.blockMenu ;
		const add = $('#button-block-add');
		
		if (selection) {
			selection.preventSelect(true);
			selection.clear(true);
		};

		this.unbind();
		node.addClass('isResizing');
		$('body').addClass('colResize');
		keyboard.setResize(true);
		add.css({ opacity: 0 });
		
		node.find('.colResize.active').removeClass('active');
		node.find('.colResize.c' + index).addClass('active');
		
		win.on('mousemove.block', (e: any) => { this.onResize(e, index, offset); });
		win.on('mouseup.block', (e: any) => { this.onResizeEnd(e, index, offset); });
		
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

		if (!res) {
			return;
		};
		
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

		if (!res) {
			return;
		};
		
		if (selection) {
			selection.preventSelect(false);	
		};
		this.unbind();
		node.removeClass('isResizing');
		$('body').removeClass('colResize');
		keyboard.setResize(false);
		
		node.find('.colResize.active').removeClass('active');
		
		C.BlockListSetFields(rootId, [
			{ blockId: prevBlockId, fields: { width: res.percent * res.sum } },
			{ blockId: currentBlockId, fields: { width: (1 - res.percent) * res.sum } },
		]);
		
		node.find('.resizable').trigger('resizeEnd', [ e ]);
	};
	
	calcWidth (x: number, index: number) {
		const { rootId, block, getWrapperWidth } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const snaps = [ 0.25, 0.5, 0.75 ];
		
		const prevBlockId = childrenIds[index - 1];
		const prevBlock = blockStore.getLeaf(rootId, prevBlockId);
		
		const currentBlockId = childrenIds[index];
		const currentBlock = blockStore.getLeaf(rootId, currentBlockId);

		if (!prevBlock || !currentBlock) {
			return;
		};

		const width = getWrapperWidth();
		const dw = 1 / childrenIds.length;
		const sum = (prevBlock.fields.width || dw) + (currentBlock.fields.width || dw);
		const offset = Constant.size.blockMenu * 2;
		
		x = Math.max(offset, x);
		x = Math.min(sum * width - offset, x);
		x = x / (sum * width);
		
		// Snap
		for (let s of snaps) {
			if ((x >= s - SNAP) && (x <= s + SNAP)) {
				x = s;
			};
		};

		return { sum: sum, percent: x };
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted|| keyboard.isResizing) {
			return;
		};
		
		const { rootId, block, readonly } = this.props;
		if (!block.isLayoutRow() || keyboard.isDragging || readonly) {
			return;
		};
		
		const sm = Constant.size.blockMenu;
		const node = $(ReactDOM.findDOMNode(this));
		const width = $('#editorWrapper').width();
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const length = childrenIds.length;
		const children = blockStore.getChildren(rootId, block.id);
		const rect = node.get(0).getBoundingClientRect() as DOMRect;
		const p = e.pageX - rect.x - sm;

		let c = 0;
		let num = 0;
		
		for (let i in children) {
			const child = children[i];

			c += child.fields.width || 1 / length;
			if ((p >= c * width - sm / 2) && (p <= c * width + sm / 2)) {
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
	
	onEmptyColumn () {
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
	
});

export default Block;