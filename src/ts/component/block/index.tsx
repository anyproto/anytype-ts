import * as React from 'react';
import $ from 'jquery';
import { I, C, UtilCommon, UtilData, keyboard, focus, Storage } from 'Lib';
import { DropTarget, ListChildren, Icon, SelectionTarget } from 'Component';
import { observer } from 'mobx-react';
import { menuStore, blockStore, detailStore } from 'Store';

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
import BlockTable from './table';
import BlockTableOfContents from './tableOfContents';

import BlockFile from './media/file';
import BlockImage from './media/image';
import BlockVideo from './media/video';
import BlockAudio from './media/audio';
import BlockPdf from './media/pdf'; 

import BlockEmbed from './embed';

import Constant from 'json/constant.json';

interface Props extends I.BlockComponent {
	css?: any;
	iconSize?: number;
};

const SNAP = 0.01;

const Block = observer(class Block extends React.Component<Props> {

	node: any = null;
	ref = null;
	ids: string[] = [];

	public static defaultProps = {
		align: I.BlockHAlign.Left,
		traceId: '',
		history: null,
		location: null,
		match: null,
	};

	_isMounted = false;
		
	constructor (props: Props) {
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
		this.onContextMenu = this.onContextMenu.bind(this);
	};

	render () {
		const { rootId, css, className, block, readonly, isInsideTable, isSelectionDisabled, onMouseEnter, onMouseLeave } = this.props;
		const { id, type, fields, content, hAlign, bgColor } = block;

		if (!id) {
			return null;
		};

		const index = Number(this.props.index) || 0;
		const { style, checked } = content;
		const root = blockStore.getLeaf(rootId, rootId);
		const cn: string[] = [ 'block', UtilData.blockClass(block), `align${hAlign}`, `index${index}` ];
		const cd: string[] = [ 'wrapContent' ];
		const setRef = ref => this.ref = ref;
		const key = [ 'block', block.id, 'component' ].join(' ');

		let canSelect = !isInsideTable && !isSelectionDisabled;
		let canDrop = !readonly && !isInsideTable;
		let canDropMiddle = false;
		let blockComponent = null;
		let additional = null;
		let renderChildren = block.isLayout();

		if (className) {
			cn.push(className);
		};
		if (fields.isUnwrapped) {
			cn.push('isUnwrapped');
		};
		if (readonly) {
			cn.push('isReadonly');
		};

		if (bgColor && !block.isLink() && !block.isBookmark()) {
			cd.push('bgColor bgColor-' + bgColor);
		};

		switch (type) {
			case I.BlockType.Text: {
				canDropMiddle = canDrop && block.canHaveChildren();
				renderChildren = !isInsideTable && block.canHaveChildren();

				if (block.isTextCheckbox() && checked) {
					cn.push('isChecked');
				};

				if (block.isTextQuote()) {
					additional = <div className={[ 'line', (content.color ? `textColor-${content.color}` : '') ].join(' ')} />;
				};

				if (block.isTextTitle() || block.isTextDescription()) {
					canDrop = false;
				};

				blockComponent = <BlockText key={key} ref={setRef} {...this.props} onToggle={this.onToggle} />;
				break;
			};

			case I.BlockType.Layout: {
				canSelect = false;
				break;
			};
				
			case I.BlockType.IconPage: {
				canSelect = false;
				canDrop = false;
				blockComponent = <BlockIconPage key={key} ref={setRef} {...this.props} />;
				break;
			};
				
			case I.BlockType.IconUser: {
				canSelect = false;
				canDrop = false;
				blockComponent = <BlockIconUser key={key} ref={setRef} {...this.props} />;
				break;
			};
				
			case I.BlockType.File: {
				if (content.state == I.BookmarkState.Done) {
					cn.push('withContent');
				};

				if (style == I.FileStyle.Link) {
					blockComponent = <BlockFile key={key} ref={setRef} {...this.props} />;
					break;
				};

				switch (content.type) {
					default: {
						blockComponent = <BlockFile key={key} ref={setRef} {...this.props} />;
						break;
					};
						
					case I.FileType.Image: {
						blockComponent = <BlockImage key={key} ref={setRef} {...this.props} />;
						break;
					};
						
					case I.FileType.Video: {
						blockComponent = <BlockVideo key={key} ref={setRef} {...this.props} />;
						break;
					};

					case I.FileType.Audio: {
						blockComponent = <BlockAudio key={key} ref={setRef} {...this.props} />;
						break;
					};

					case I.FileType.Pdf: {
						blockComponent = <BlockPdf key={key} ref={setRef} {...this.props} />;
						break;
					};
				};

				break;
			};
				
			case I.BlockType.Dataview: {
				canDrop = canSelect = !(root.isObjectSet() || root.isObjectCollection() || root.isObjectDate());
				if (canSelect) {
					cn.push('isInline');
				};
				blockComponent = <BlockDataview key={key} ref={setRef} isInline={canSelect} {...this.props} />;
				break;
			};
				
			case I.BlockType.Div: {
				blockComponent = <BlockDiv key={key} ref={setRef} {...this.props} />;
				break;
			};
				
			case I.BlockType.Link: {
				const object = detailStore.get(rootId, content.targetBlockId, [ 'restrictions' ]);
				
				if (blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
					canDropMiddle = canDrop;
				};

				cn.push(UtilData.linkCardClass(content.cardStyle));

				blockComponent = <BlockLink key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Bookmark: {
				const object = detailStore.get(rootId, content.targetObjectId, [ 'restrictions' ]);
				
				if (blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
					canDropMiddle = canDrop;
				};

				if (content.state == I.BookmarkState.Done) {
					cn.push('withContent');
				};

				blockComponent = <BlockBookmark key={key} ref={setRef} {...this.props} />;
				break;
			};
				
			case I.BlockType.Cover: {
				canSelect = false;
				canDrop = false;

				blockComponent = <BlockCover key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Relation: {
				blockComponent = <BlockRelation key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Featured: {
				canDrop = false;

				blockComponent = <BlockFeatured key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Type: {
				canSelect = false;
				canDrop = false;

				blockComponent = <BlockType key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Embed: {
				blockComponent = <BlockEmbed key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Table: {
				blockComponent = <BlockTable key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.TableOfContents: {
				blockComponent = <BlockTableOfContents key={key} ref={setRef} {...this.props} />;
				break;
			};
		};

		let object = null;
		let targetTop = null;
		let targetBot = null;
		let targetColumn = null;

		if (canDrop) {
			object = (
				<DropTarget 
					{...this.props} 
					rootId={rootId} 
					id={id} 
					style={style} 
					type={type} 
					dropType={I.DropType.Block} 
					canDropMiddle={canDropMiddle} 
					onContextMenu={this.onContextMenu}
				>
					{blockComponent}
				</DropTarget>
			);

			targetBot = <DropTarget {...this.props} isTargetBottom={true} rootId={rootId} id={id} style={style} type={type} dropType={I.DropType.Block} canDropMiddle={canDropMiddle} />;
		} else {
			object = <div className="dropTarget" onContextMenu={this.onContextMenu}>{blockComponent}</div>;
			targetBot = <div className="dropTarget targetBot" />;
		};

		if (block.isLayoutRow()) {
			if (canDrop) {
				targetTop = <DropTarget {...this.props} isTargetTop={true} rootId={rootId} id={id} style={style} type={type} dropType={I.DropType.Block} canDropMiddle={canDropMiddle} />;
			} else {
				targetTop = <div className="dropTarget targetTop" />;
			};
		};

		if (block.isLayoutColumn() && canDrop) {
			targetColumn = (
				<DropTarget 
					{...this.props} 
					isTargetColumn={true} 
					rootId={rootId} 
					id={block.id} 
					style={style} 
					type={type} 
					dropType={I.DropType.Block} 
					canDropMiddle={canDropMiddle} 
					onClick={this.onEmptyColumn} 
				/>
			);
		};
		
		if (canSelect) {
			object = (
				<SelectionTarget id={id} type={I.SelectType.Block}>
					{object}
				</SelectionTarget>
			);
		} else {
			object = (
				<div id={`selectionTarget-${id}`} className="selectionTarget">
					{object}
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				id={`block-${id}`} 
				className={cn.join(' ')} 
				style={css}
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave}
				{...UtilCommon.dataProps({ id })}
			>
				<div className="wrapMenu">
					<Icon 
						id={`button-block-menu-${id}`} 
						className="dnd" 
						draggable={true} 
						onDragStart={this.onDragStart} 
						onMouseDown={this.onMenuDown} 
						onClick={this.onMenuClick} 
					/>
				</div>
				
				<div className={cd.join(' ')}>
					{targetTop}
					{object}
					{additional ? <div className="additional">{additional}</div> : ''}

					{renderChildren ? (
						<ListChildren 
							key={`block-children-${id}`} 
							{...this.props} 
							onMouseMove={this.onMouseMove} 
							onMouseLeave={this.onMouseLeave} 
							onResizeStart={this.onResizeStart} 
						/>
					) : ''}

					{targetBot}
					{targetColumn}
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
		const node = $(this.node);
		
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
		
		if (!onDragStart) {
			return;
		};
		
		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};
		
		keyboard.disableSelection(true);
		if (selection && selection.isSelecting) {
			selection.setIsSelecting(false);
		};

		this.ids = UtilData.selectionGet(block.id, false, true, this.props);
		onDragStart(e, I.DropType.Block, this.ids, this);
	};
	
	onMenuDown (e: any) {
		e.stopPropagation();

		focus.clear(true);
		this.ids = UtilData.selectionGet(this.props.block.id, false, false, this.props);
	};
	
	onMenuClick () {
		const { dataset, block } = this.props;
		const { selection } = dataset || {};
		const element = $(`#button-block-menu-${block.id}`);

		if (!element.length) {
			return;
		};

		selection.set(I.SelectType.Block, this.ids);

		this.menuOpen({
			horizontal: I.MenuDirection.Right,
			offsetX: element.outerWidth(),
			recalcRect: () => {
				const offset = element.offset();
				return { x: offset.left, y: keyboard.mouse.page.y, width: element.width(), height: 0 };
			},
		});
	};

	onContextMenu (e: any) {
		const { focused } = focus.state;
		const { rootId, block, readonly, isContextMenuDisabled } = this.props;

		if (isContextMenuDisabled || readonly || !block.isSelectable() || (block.isText() && (focused == block.id)) || block.isTable() || block.isDataview()) {
			return;
		};

		const root = blockStore.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		if (root.isLocked() || root.isObjectSet() || root.isObjectCollection()) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		menuStore.closeAll([], () => {
			this.ids = UtilData.selectionGet(block.id, false, false, this.props);
			this.menuOpen({
				recalcRect: () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 })
			});
		});
	};

	menuOpen (param?: Partial<I.MenuParam>) {
		const { dataset, rootId, block, blockRemove, onCopy } = this.props;
		const { selection } = dataset;

		// Hide block menus and plus button
		$('#button-block-add').removeClass('show');
		$('.block.showMenu').removeClass('showMenu');
		$('.block.isAdding').removeClass('isAdding top bottom');

		const menuParam: Partial<I.MenuParam> = Object.assign({
			noFlipX: true,
			subIds: Constant.menuIds.action,
			onClose: () => {
				if (selection) {
					selection.clear();
				};
				focus.apply();
			},
			data: {
				blockId: block.id,
				blockIds: this.ids,
				rootId,
				dataset,
				blockRemove,
				onCopy,
			}
		}, param || {});

		menuStore.open('blockAction', menuParam);
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
		const node = $(this.node);
		const prevBlockId = childrenIds[index - 1];
		const offset = (prevBlockId ? node.find('#block-' + prevBlockId).offset().left : 0) + Constant.size.blockMenu ;
		const add = $('#button-block-add');
		
		if (selection) {
			selection.clear();
		};

		this.unbind();
		node.addClass('isResizing');
		$('body').addClass('colResize');
		add.css({ opacity: 0 });
		
		keyboard.setResize(true);
		keyboard.disableSelection(true);
		
		node.find('.colResize.active').removeClass('active');
		node.find('.colResize.c' + index).addClass('active');
		
		win.on('mousemove.block', e => this.onResize(e, index, offset));
		win.on('mouseup.block', e => this.onResizeEnd(e, index, offset));
		
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
		
		const node = $(this.node);
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
		
		node.find('.resizable').trigger('resizeMove', [ e ]);
	};

	onResizeEnd (e: any, index: number, offset: number) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const { id } = block;
		const childrenIds = blockStore.getChildrenIds(rootId, id);
		const node = $(this.node);
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		const res = this.calcWidth(e.pageX - offset, index);

		if (!res) {
			return;
		};
		
		this.unbind();
		node.removeClass('isResizing');
		$('body').removeClass('colResize');

		keyboard.setResize(false);
		keyboard.disableSelection(false);	
		
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
		for (const s of snaps) {
			if ((x >= s - SNAP) && (x <= s + SNAP)) {
				x = s;
			};
		};

		return { sum: sum, percent: x };
	};
	
	onMouseMove (e: any) {
		const { rootId, block, readonly } = this.props;

		if (!this._isMounted || keyboard.isDragging || keyboard.isResizing || readonly || !block.isLayoutRow()) {
			return;
		};
		
		const sm = Constant.size.blockMenu;
		const node = $(this.node);
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const length = childrenIds.length;
		const children = blockStore.getChildren(rootId, block.id);
		const rect = (node.get(0) as Element).getBoundingClientRect();
		const { x, width } = rect;
		const p = e.pageX - x - sm;

		let c = 0;
		let num = 0;

		for (const i in children) {
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
		$(window).off('mousemove.block mouseup.block');
	};
	
	onEmptyColumn () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		
		if (!block.isLayoutColumn() || !childrenIds.length) {
			return;
		};
		
		const param = {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		};
		
		C.BlockCreate(rootId, childrenIds[childrenIds.length - 1], I.BlockPosition.Bottom, param, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
});

export default Block;