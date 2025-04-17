import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, keyboard, focus, Storage, Preview, Mark, translate, Action } from 'Lib';
import { DropTarget, ListChildren, Icon, SelectionTarget, IconObject, Loader } from 'Component';

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
import BlockChat from './chat';

import BlockFile from './media/file';
import BlockImage from './media/image';
import BlockVideo from './media/video';
import BlockAudio from './media/audio';
import BlockPdf from './media/pdf'; 

import BlockEmbed from './embed';

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
		this.renderLinks = this.renderLinks.bind(this);
		this.renderMentions = this.renderMentions.bind(this);
		this.renderObjects = this.renderObjects.bind(this);
		this.renderEmoji = this.renderEmoji.bind(this);
	};

	render () {
		const { rootId, css, className, block, readonly, isInsideTable, isSelectionDisabled, blockContextParam, onMouseEnter, onMouseLeave } = this.props;
		
		if (!block) {
			return null;
		};

		const { id, type, fields, content, bgColor } = block;

		if (!id) {
			return null;
		};

		let hAlign = null;
		if (blockContextParam && (block.isTextTitle() || block.isTextDescription() || block.isFeatured())) {
			hAlign = blockContextParam.hAlign;
		} else {
			hAlign = block.hAlign;
		};

		hAlign = hAlign || I.BlockHAlign.Left;

		const index = Number(this.props.index) || 0;
		const { style, checked } = content;
		const root = S.Block.getLeaf(rootId, rootId);
		const cn: string[] = [ 'block', U.Data.blockClass(block), `align${hAlign}`, `index${index}` ];
		const cd: string[] = [ 'wrapContent' ];
		const setRef = ref => this.ref = ref;
		const key = [ 'block', block.id, 'component' ].join(' ');
		const participantId = S.Block.getParticipantId(rootId, block.id);

		let participant = null;
		if (participantId) {
			participant = U.Space.getParticipant(participantId);
		};

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
			cd.push(`bgColor bgColor-${bgColor}`);
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

				blockComponent = (
					<BlockText 
						key={key} 
						ref={setRef} 
						{...this.props} 
						onToggle={this.onToggle} 
						renderLinks={this.renderLinks} 
						renderMentions={this.renderMentions}
						renderObjects={this.renderObjects}
						renderEmoji={this.renderEmoji}
						checkMarkOnBackspace={this.checkMarkOnBackspace}
					/>
				);
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
				const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'isDeleted' ], true);
				
				if (!object.isDeleted && (content.state == I.BookmarkState.Done)) {
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
				const inSets = U.Object.isInSetLayouts(root.layout);
				const isInline = !inSets;

				canDrop = canDrop && isInline;
				canSelect = canSelect && isInline;

				if (isInline) {
					cn.push('isInline');
				};

				blockComponent = <BlockDataview key={key} ref={setRef} isInline={isInline} {...this.props} />;
				break;
			};

			case I.BlockType.Chat: {
				canDrop = canSelect = false;
				blockComponent = (
					<BlockChat 
						key={key} 
						ref={setRef} 
						{...this.props}
						renderLinks={this.renderLinks} 
						renderMentions={this.renderMentions}
						renderObjects={this.renderObjects}
						renderEmoji={this.renderEmoji}
						checkMarkOnBackspace={this.checkMarkOnBackspace}
					/>
				);
				break;
			};
				
			case I.BlockType.Div: {
				blockComponent = <BlockDiv key={key} ref={setRef} {...this.props} />;
				break;
			};
				
			case I.BlockType.Link: {
				const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'restrictions' ], true);
				
				if (S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
					canDropMiddle = canDrop;
				};

				cn.push(U.Data.linkCardClass(content.cardStyle));

				blockComponent = <BlockLink key={key} ref={setRef} {...this.props} />;
				break;
			};

			case I.BlockType.Bookmark: {
				const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'restrictions', 'isDeleted' ], true);
				
				if (S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
					canDropMiddle = canDrop;
				};

				if (!object.isDeleted && (content.state == I.BookmarkState.Done)) {
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
				{...U.Common.dataProps({ id })}
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
					{participant ? <IconObject object={participant} size={24} iconSize={18} /> : ''}
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

		if (block && (focused == block.id)) {
			focus.apply();
		};

		this.initToggle();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	initToggle () {
		const { rootId, block } = this.props;

		if (block && block.id && block.isTextToggle()) {
			S.Block.toggle(rootId, block.id, Storage.checkToggle(rootId, block.id));
		};
	};
	
	onToggle (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const node = $(this.node);
		
		S.Block.toggle(rootId, block.id, !node.hasClass('isToggled'));
		focus.apply();
	};
	
	onDragStart (e: any) {
		e.stopPropagation();

		if (!this._isMounted || keyboard.isResizing) {
			e.preventDefault();
			return;
		};
		
		const { block } = this.props;
		const dragProvider = S.Common.getRef('dragProvider');
		const selection = S.Common.getRef('selectionProvider');

		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};
		
		keyboard.disableSelection(true);

		if (selection) {
			if (selection.isSelecting()) {
				selection.setIsSelecting(false);
			};

			this.ids = selection.getForClick(block.id, false, true);
		};
		
		dragProvider?.onDragStart(e, I.DropType.Block, this.ids, this);
	};
	
	onMenuDown (e: any) {
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		focus.clear(true);
		this.ids = selection?.getForClick(this.props.block.id, false, false);
	};
	
	onMenuClick () {
		const { block } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const element = $(`#button-block-menu-${block.id}`);

		if (!element.length) {
			return;
		};

		const offset = element.offset();

		selection.set(I.SelectType.Block, this.ids);

		this.menuOpen({
			horizontal: I.MenuDirection.Right,
			offsetX: element.outerWidth(),
			rect: { x: offset.left, y: keyboard.mouse.page.y, width: element.width(), height: 0 },
		});
	};

	onContextMenu (e: any) {
		const { focused } = focus.state;
		const { rootId, block, readonly, isContextMenuDisabled } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		if (
			isContextMenuDisabled || 
			readonly || 
			(block.isText() && (focused == block.id)) || 
			!block.canContextMenu()
		) {
			return;
		};

		const root = S.Block.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		if (root.isLocked() || U.Object.isInSetLayouts(root.layout)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		S.Menu.closeAll([], () => {
			if (selection) {
				this.ids = selection.getForClick(block.id, false, false);
				selection.set(I.SelectType.Block, this.ids);
			};

			this.menuOpen({
				rect: { x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 },
			});
		});
	};

	menuOpen (param?: Partial<I.MenuParam>) {
		const { rootId, block, blockRemove, onCopy } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		// Hide block menus and plus button
		$('#button-block-add').removeClass('show');
		$('.block.showMenu').removeClass('showMenu');
		$('.block.isAdding').removeClass('isAdding top bottom');

		const menuParam: Partial<I.MenuParam> = Object.assign({
			noFlipX: true,
			subIds: J.Menu.action,
			onClose: () => {
				selection?.clear();
				focus.apply();
			},
			data: {
				blockId: block.id,
				blockIds: this.ids,
				rootId,
				blockRemove,
				onCopy,
			}
		}, param || {});

		S.Menu.open('blockAction', menuParam);
	};
	
	onResizeStart (e: any, index: number) {
		e.stopPropagation();

		const { rootId, block, readonly } = this.props;

		if (!this._isMounted || readonly) {
			return;
		};

		const { id } = block;
		const childrenIds = S.Block.getChildrenIds(rootId, id);
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $(this.node);
		const prevBlockId = childrenIds[index - 1];
		const offset = (prevBlockId ? node.find('#block-' + prevBlockId).offset().left : 0) + J.Size.blockMenu;
		
		selection?.clear();

		this.unbind();
		node.addClass('isResizing');
		$('body').addClass('colResize');
		
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
		const childrenIds = S.Block.getChildrenIds(rootId, id);
		
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
		const childrenIds = S.Block.getChildrenIds(rootId, id);
		const node = $(this.node);
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		const res = this.calcWidth(e.pageX - offset, index);

		this.unbind();
		node.removeClass('isResizing');
		$('body').removeClass('colResize');

		keyboard.setResize(false);
		keyboard.disableSelection(false);	
		
		node.find('.colResize.active').removeClass('active');

		if (res) {
			C.BlockListSetFields(rootId, [
				{ blockId: prevBlockId, fields: { width: res.percent * res.sum } },
				{ blockId: currentBlockId, fields: { width: (1 - res.percent) * res.sum } },
			]);
		};
		
		node.find('.resizable').trigger('resizeEnd', [ e ]);
	};
	
	calcWidth (x: number, index: number) {
		const { rootId, block, getWrapperWidth } = this.props;
		const { id } = block;
		const childrenIds = S.Block.getChildrenIds(rootId, id);
		const snaps = [ 0.25, 0.5, 0.75 ];
		
		const prevBlockId = childrenIds[index - 1];
		const prevBlock = S.Block.getLeaf(rootId, prevBlockId);
		
		const currentBlockId = childrenIds[index];
		const currentBlock = S.Block.getLeaf(rootId, currentBlockId);

		if (!prevBlock || !currentBlock) {
			return;
		};

		const width = getWrapperWidth();
		const dw = 1 / childrenIds.length;
		const sum = (prevBlock.fields.width || dw) + (currentBlock.fields.width || dw);
		const offset = J.Size.blockMenu * 2;
		
		x = Math.max(offset, x);
		x = Math.min(sum * width - offset, x);
		x = x / (sum * width);
		
		// Snap
		for (const s of snaps) {
			if ((x >= s - SNAP) && (x <= s + SNAP)) {
				x = s;
			};
		};

		return { sum, percent: x };
	};
	
	onMouseMove (e: any) {
		const { rootId, block, readonly } = this.props;

		if (!this._isMounted || keyboard.isDragging || keyboard.isResizing || readonly || !block.isLayoutRow()) {
			return;
		};
		
		const sm = J.Size.blockMenu;
		const node = $(this.node);
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);
		const length = childrenIds.length;
		const children = S.Block.getChildren(rootId, block.id);
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
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);
		
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

	renderLinks (node: any, marks: I.Mark[], getValue: () => string, props: any, param?: any) {
		node = $(node);
		param = param || {};

		const { readonly, block } = props;
		const items = node.find(Mark.getTag(I.MarkType.Link));

		if (!items.length) {
			return;
		};

		const getParam = (item: any) => {
			const range = String(item.attr('data-range') || '').split('-');
			const url = String(item.attr('href') || '');
			const scheme = U.Common.getScheme(url);
			const isInside = scheme == J.Constant.protocol;

			let route = '';
			let target;
			let type;

			if (isInside) {
				route = '/' + url.split('://')[1];

				const search = url.split('?')[1];
				if (search) {
					const searchParam = U.Common.searchParam(search);
					target = searchParam.objectId;
				} else {
					const routeParam = U.Router.getParam(route);
					target = routeParam.id;
				};
			} else {
				target = U.Common.urlFix(url);
				type = I.PreviewType.Link;
			};

			return { route, target, type, range, isInside };
		};

		items.each((i: number, item: any) => {
			item = $(item);

			item.off('click.link').on('click.link', e => {
				e.preventDefault();
			});

			item.off('mousedown.link').on('mousedown.link', e => {
				e.preventDefault();

				const item = $(e.currentTarget);
				const { isInside, route, target } = getParam(item);

				isInside ? U.Router.go(route, {}) : Action.openUrl(target);
			});

			item.off('mouseenter.link').on('mouseenter.link', e => {
				const sr = U.Common.getSelectionRange();
				if (sr && !sr.collapsed) {
					return;
				};

				const item = $(e.currentTarget);
				const url = String(item.attr('href') || '');

				if (!url) {
					return;
				};

				const { target, type, range } = getParam(item);

				Preview.previewShow({
					target,
					type,
					markType: I.MarkType.Link,
					element: item,
					range: { 
						from: Number(range[0]) || 0,
						to: Number(range[1]) || 0, 
					},
					marks,
					onChange: marks => this.setMarksCallback(getValue(), marks, param.onChange),
					noUnlink: readonly,
					noEdit: readonly,
				});
			});

			U.Common.textStyle(item, { border: 0.35 });
		});
	};

	renderMentions (rootId: string, node: any, marks: I.Mark[], getValue: () => string, param?: any) {
		node = $(node);
		param = param || {};

		const { block } = this.props;
		const size = U.Data.emojiParam(block.content.style);
		const items = node.find(Mark.getTag(I.MarkType.Mention));

		if (!items.length) {
			return;
		};

		items.each((i: number, item: any) => {
			item = $(item);
			
			const smile = item.find('smile');
			if (!smile.length) {
				return;
			};

			const range = String(item.attr('data-range') || '').split('-');
			const target = String(item.attr('data-param') || '');
			const object = S.Detail.get(rootId, target, []);
			const { id, _empty_, layout, done, isDeleted, isArchived } = object;
			const isTask = U.Object.isTaskLayout(layout);
			const name = item.find('name');
			const clickable = isTask ? name : item;

			let icon = null;
			if (_empty_) {
				icon = <Loader type={I.LoaderType.Loader} className={[ 'c' + size, 'inline' ].join(' ')} />;
			} else {
				icon = (
					<IconObject 
						id={`mention-${block.id}-${i}`}
						size={size} 
						iconSize={size}
						object={object} 
						canEdit={!isArchived && isTask} 
						onSelect={icon => this.onMentionSelect(getValue, marks, id, icon)} 
						onUpload={objectId => this.onMentionUpload(getValue, marks, id, objectId)} 
						onCheckbox={() => this.onMentionCheckbox(getValue, marks, id, !done)}
					/>
				);
			};

			item.removeClass('disabled isDone withImage');

			if (_empty_ || isDeleted) {
				item.addClass('disabled');
			};

			if ((layout == I.ObjectLayout.Task) && done) {
				item.addClass('isDone');
			};

			ReactDOM.render(icon, smile.get(0), () => {
				if (smile.html()) {
					item.addClass('withImage c' + size);
				};
			});

			if (!target || item.hasClass('disabled')) {
				return;
			};

			clickable.off('mousedown.mention').on('mousedown.mention', e => {
				e.preventDefault();
				U.Object.openEvent(e, object);
			});

			clickable.off('mouseenter.mention').on('mouseenter.mention', e => {
				const sr = U.Common.getSelectionRange();
				if (sr && !sr.collapsed) {
					return;
				};

				Preview.previewShow({
					target: object.id,
					markType: I.MarkType.Mention,
					object,
					element: name,
					range: { 
						from: Number(range[0]) || 0,
						to: Number(range[1]) || 0, 
					},
					noUnlink: true,
					withPlural: true,
					marks,
					onChange: marks => this.setMarksCallback(getValue(), marks, param.onChange),
				});
			});

			U.Common.textStyle(item, { border: 0.35 });
		});
	};

	renderObjects (rootId: string, node: any, marks: I.Mark[], getValue: () => string, props: any, param?: any) {
		node = $(node);
		param = param || {};

		const { readonly } = props;
		const items = node.find(Mark.getTag(I.MarkType.Object));

		if (!items.length) {
			return;
		};

		items.each((i: number, item: any) => {
			item = $(item);
			
			const param = item.attr('data-param');
			const object = S.Detail.get(rootId, param, []);
			const range = String(item.attr('data-range') || '').split('-');

			if (!param) {
				return;
			};

			if (object._empty_ || object.isDeleted) {
				item.addClass('disabled');
			};

			item.off('mousedown.object').on('mousedown.object', e => {
				e.preventDefault();
				U.Object.openEvent(e, object);
			});

			item.off('mouseleave.object').on('mouseleave.object', () => Preview.tooltipHide(false));

			item.off('mouseenter.object').on('mouseenter.object', () => {
				const sr = U.Common.getSelectionRange();
				const tt = object.isDeleted ? translate('commonDeletedObject') : '';

				if (sr && !sr.collapsed) {
					return;
				};

				if (tt) {
					Preview.tooltipShow({ text: tt, element: item });
					return;
				};

				Preview.previewShow({
					target: object.id,
					markType: I.MarkType.Object,
					object,
					element: item,
					marks,
					range: { 
						from: Number(range[0]) || 0,
						to: Number(range[1]) || 0, 
					},
					noUnlink: readonly,
					noEdit: readonly,
					withPlural: true,
					onChange: marks => this.setMarksCallback(getValue(), marks, param.onChange),
				});

				U.Common.textStyle(item, { border: 0.35 });
			});
		});
	};

	renderEmoji (node: any) {
		node = $(node);

		const items = node.find(Mark.getTag(I.MarkType.Emoji));
		if (!items.length) {
			return;
		};

		const { block } = this.props;
		const size = U.Data.emojiParam(block.content.style);

		items.each((i: number, item: any) => {
			item = $(item);

			const param = item.attr('data-param');
			const smile = item.find('smile');

			if (smile.length) {
				ReactDOM.render(<IconObject size={size} iconSize={size} object={{ iconEmoji: param }} />, smile.get(0));
			};
		});
	};

	setMarksCallback (text: string, marks: I.Mark[], onChange: (text: string, marks: I.Mark[]) => void) {
		const { block } = this.props;
		const restricted = [];

		if (block.isTextHeader()) {
			restricted.push(I.MarkType.Bold);
		};

		const parsed = Mark.fromHtml(text, restricted);

		if (onChange) {
			onChange(parsed.text, marks);
		} else {
			this.setMarks(parsed.text, marks);
		};
	};

	checkMarkOnBackspace (value: string, range: I.TextRange, oM: I.Mark[]) {
		if (!range || !range.to) {
			return;
		};

		const types = [ I.MarkType.Mention, I.MarkType.Emoji ];
		const marks = U.Common.arrayUnique(oM).filter(it => types.includes(it.type));

		let rM = [];
		let save = false;
		let mark = null;

		for (const m of marks) {
			if ((m.range.from < range.from) && (m.range.to == range.to)) {
				mark = m;
				break;
			};
		};

		if (mark) {
			value = U.Common.stringCut(value, mark.range.from, mark.range.to);
			rM = oM.filter(it => {
				return (it.type != mark.type) || (it.range.from != mark.range.from) || (it.range.to != mark.range.to) || (it.param != mark.param);
			});

			rM = Mark.adjust(rM, mark.range.from, mark.range.from - mark.range.to);
			save = true;
		};

		return { value, marks: rM, save };
	};

	onMentionSelect (getValue: () => string, marks: I.Mark[], id: string, icon: string) {
		const { rootId, block } = this.props;

		U.Data.blockSetText(rootId, block.id, getValue(), marks, true, () => {
			U.Object.setIcon(id, icon, '');
		});
	};

	onMentionUpload (getValue: () => string, marks: I.Mark[], targetId: string, objectId: string) {
		const { rootId, block } = this.props;

		U.Data.blockSetText(rootId, block.id, getValue(), marks, true, () => {
			U.Object.setIcon(targetId, '', objectId);
		});
	};

	onMentionCheckbox (getValue: () => string, marks: I.Mark[], objectId: string, done: boolean) {
		const { rootId, block } = this.props;

		U.Data.blockSetText(rootId, block.id, getValue(), marks, true, () => {
			U.Object.setDone(objectId, done);
		});
	};

	setMarks (value: string, marks: I.Mark[]) {
		const { rootId, block } = this.props;

		if (!block.canHaveMarks()) {
			marks = [];
		};

		U.Data.blockSetText(rootId, block.id, value, marks, true);
	};

});

export default Block;