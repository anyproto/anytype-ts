import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { createRoot, Root } from 'react-dom/client';
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
import BlockTable from './table';
import BlockTableOfContents from './tableOfContents';
import BlockChat from './chat';

import BlockFile from './media/file';
import BlockImage from './media/image';
import BlockVideo from './media/video';
import BlockAudio from './media/audio';
import BlockPdf from './media/pdf';
import BlockLoader from './media/loader';

import BlockEmbed from './embed';

interface Props extends I.BlockComponent {
	css?: any;
	iconSize?: number;
};

interface Ref {
	getNode: () => any;
	getChildNode: () => any;
};

const SNAP = 0.01;

const Block = observer(forwardRef<Ref, Props>((props, ref) => {

	const { 
		rootId, css, className, block, readonly, isInsideTable, isSelectionDisabled, contextParam, onMouseEnter, onMouseLeave,
		isContextMenuDisabled, blockRemove, getWrapperWidth,
	} = props;
	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const idsRef = useRef<string[]>([]);

	useEffect(() => {
		const { focused } = focus.state;

		if (block && (focused == block.id)) {
			focus.apply();
		};

		initToggle();
	});

	const initToggle = () => {
		if (block && block.id && block.isTextToggle()) {
			S.Block.toggle(rootId, block.id, Storage.checkToggle(rootId, block.id));
		};
	};

	const onToggle = (e: any) => {
		e.stopPropagation();

		S.Block.toggle(rootId, block.id, !$(nodeRef.current).hasClass('isToggled'));
		focus.apply();
	};

	const onDragStart = (e: any) => {
		e.stopPropagation();

		if (keyboard.isResizing) {
			e.preventDefault();
			return;
		};
		
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

			idsRef.current = selection.getForClick(block.id, false, true);
		};
		
		dragProvider?.onDragStart(e, I.DropType.Block, idsRef.current, {
			getNode: () => nodeRef.current,
		});
	};
	
	const onMenuDown = (e: any) => {
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		focus.clear(true);
		idsRef.current = selection?.getForClick(block.id, false, false);
	};
	
	const onMenuClick = () => {
		const selection = S.Common.getRef('selectionProvider');
		const element = $(`#button-block-menu-${block.id}`);

		if (!element.length) {
			return;
		};

		const offset = element.offset();

		selection.set(I.SelectType.Block, idsRef.current);

		menuOpen({
			horizontal: I.MenuDirection.Right,
			offsetX: element.outerWidth(),
			rect: { x: offset.left, y: keyboard.mouse.page.y, width: element.width(), height: 0 },
		});
	};

	const onContextMenu = (e: any) => {
		const { focused, range } = focus.state;
		const selection = S.Common.getRef('selectionProvider');
		const selectedIds = selection?.get(I.SelectType.Block, false) || [];
		const hasMultipleBlocksSelected = selectedIds.length > 1;

		if (!U.Common.isPlatformMac() && e.ctrlKey) {
			return;
		};

		// Allow native context menu (spellcheck) when clicking on links
		if ($(e.target).closest('.markupLink').length) {
			return;
		};

		if (
			isContextMenuDisabled ||
			readonly ||
			// Allow native spellcheck menu for focused text blocks, but not when multiple blocks are selected
			(block.isText() && (focused == block.id) && !hasMultipleBlocksSelected) ||
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

		S.Menu.closeAll([], () => {

			if (!(range.to && (range.from != range.to))) {
				focus.clear(true);

				if (selection) {
					idsRef.current = selection.getForClick(block.id, false, false);
					selection.set(I.SelectType.Block, idsRef.current);
				};
			};

			menuOpen({
				rect: { x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 },
				data: { range: U.Common.objectCopy(range) },
			});
		});
	};

	const menuOpen = (param?: Partial<I.MenuParam>) => {
		const selection = S.Common.getRef('selectionProvider');
		const data = param?.data || {};

		// Hide block menus and plus button
		$('#button-block-add').removeClass('show');
		$('.block.showMenu').removeClass('showMenu');
		$('.block.isAdding').removeClass('isAdding top bottom');

		const menuParam: Partial<I.MenuParam> = {
			classNameWrap: 'fromBlock',
			noFlipX: true,
			subIds: J.Menu.action,
			onClose: () => {
				selection?.clear();
				focus.apply();
			},
			...param,
			data: {
				...data,
				blockId: block.id,
				blockIds: idsRef.current,
				rootId,
				blockRemove,
			}
		};

		S.Menu.open('blockAction', menuParam);
	};
	
	const onResizeStart = (e: any, index: number) => {
		e.stopPropagation();

		if (readonly) {
			return;
		};

		const childrenIds = S.Block.getChildrenIds(rootId, block.id);

		if (childrenIds.length < 2) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $(nodeRef.current);
		const prevBlockId = childrenIds[index - 1];
		const offset = (prevBlockId ? node.find(`#block-${prevBlockId}`).offset().left : 0) + J.Size.blockMenu;
		
		selection?.clear();

		unbind();
		node.addClass('isResizing');
		$('body').addClass('colResize');
		
		keyboard.setResize(true);
		keyboard.disableSelection(true);
		
		node.find('.colResize.active').removeClass('active');
		node.find(`.colResize.c${index}`).addClass('active');
		
		win.on('mousemove.block', e => onResize(e, index, offset));
		win.on('mouseup.block', e => onResizeEnd(e, index, offset));
		
		node.find('.resizable').trigger('resizeStart', [ e ]);
	};

	const onResize = (e: any, index: number, offset: number) => {
		e.preventDefault();
		e.stopPropagation();
		
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);

		if (childrenIds.length < 2) {
			return;
		};
		
		const node = $(nodeRef.current);
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		
		const prevNode = node.find(`#block-${prevBlockId}`);
		const currentNode = node.find(`#block-${currentBlockId}`);
		const res = calcWidth(e.pageX - offset, index);

		if (!res) {
			return;
		};
		
		const w1 = res.percent * res.sum;
		const w2 = (1 - res.percent) * res.sum;
		
		prevNode.css({ width: w1 * 100 + '%' });
		currentNode.css({ width: w2 * 100 + '%' });
		
		node.find('.resizable').trigger('resizeMove', [ e ]);
	};

	const onResizeEnd = (e: any, index: number, offset: number) => {
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);
		const node = $(nodeRef.current);
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		const res = calcWidth(e.pageX - offset, index);

		unbind();
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
	
	const calcWidth = (x: number, index: number) => {
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);
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
	
	const onMouseMoveHandler = (e: any) => {
		if (keyboard.isDragging || keyboard.isResizing || readonly || !block.isLayoutRow()) {
			return;
		};
		
		const sm = J.Size.blockMenu;
		const node = $(nodeRef.current);
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
			node.find(`.colResize.c${num}`).addClass('active');
		};
	};
	
	const onMouseLeaveHandler = (e: any) => {
		if (!keyboard.isResizing) {
			$('.colResize.active').removeClass('active');
		};
	};
	
	const unbind = () => {
		$(window).off('mousemove.block mouseup.block');
	};
	
	const onEmptyColumn = () => {
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

	const renderLinks = (rootId: string, node: any, marks: I.Mark[], getValue: () => string, props: any, param?: any) => {
		node = $(node);
		param = param || {};

		const { readonly } = props;
		const items = node.find(Mark.getTag(I.MarkType.Link));
		const subId = param.subId || rootId;

		if (!items.length) {
			return;
		};

		items.each((i: number, item: any) => {
			item = $(item);

			item.off('click.link').on('click.link', e => {
				e.preventDefault();
			});

			item.off('mousedown.link').on('mousedown.link', e => {
				if (e.button) {
					return;
				};

				e.preventDefault();

				const item = $(e.currentTarget);
				const url = String(item.attr('href') || '');
				const { isInside, route, target } = U.Common.getLinkParamFromUrl(url);

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

				const range = String(item.attr('data-range') || '').split('-');
				const { target, spaceId, isInside } = U.Common.getLinkParamFromUrl(url);

				const cb = (object) => {
					Preview.previewShow({
						target,
						object,
						type,
						markType: I.MarkType.Link,
						element: item,
						range: { 
							from: Number(range[0]) || 0,
							to: Number(range[1]) || 0, 
						},
						marks,
						onChange: marks => setMarksCallback(getValue(), marks, param.onChange),
						noUnlink: readonly,
						noEdit: readonly,
					});
				};

				let object;
				let type;

				if (isInside) {
					if (spaceId) {
						U.Object.getById(target, { spaceId }, cb);
					} else {
						cb(S.Detail.get(subId, target, []));
					};
				} else {
					type = I.PreviewType.Link;
					cb(object);
				};
			});
		});
	};

	const renderMentions = (rootId: string, node: any, marks: I.Mark[], getValue: () => string, param?: any) => {
		node = $(node);
		param = param || {};

		const size = param.iconSize || U.Data.emojiParam(block.content.style);
		const items = node.find(Mark.getTag(I.MarkType.Mention));
		const subId = param.subId || rootId;

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
			const object = S.Detail.get(subId, target, []);
			const { id, _empty_, layout, done, isDeleted, isArchived } = object;
			const isTask = U.Object.isTaskLayout(layout);
			const name = item.find('name');
			const clickable = isTask ? name : item;

			let icon = null;
			if (_empty_) {
				icon = <Loader type={I.LoaderType.Loader} className={[ `c${size}`, 'inline' ].join(' ')} />;
			} else {
				icon = (
					<IconObject 
						id={`mention-${block.id}-${i}`}
						size={size} 
						iconSize={size}
						object={object} 
						canEdit={!isArchived && isTask} 
						onSelect={icon => onMentionSelect(getValue, marks, id, icon)} 
						onUpload={objectId => onMentionUpload(getValue, marks, id, objectId)} 
						onCheckbox={() => onMentionCheckbox(getValue, marks, id, !done)}
					/>
				);
			};

			item.removeClass('disabled isDone');

			if (_empty_ || isDeleted) {
				item.addClass('disabled');
			};

			if ((layout == I.ObjectLayout.Task) && done) {
				item.addClass('isDone');
			};


			const container = smile.get(0) as HTMLElement & { _reactRoot?: Root };
			const root = container._reactRoot || createRoot(container);

			container._reactRoot = root;
			root.render(icon);

			item.addClass(`withImage c${size}`);

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
					onChange: marks => setMarksCallback(getValue(), marks, param.onChange),
				});
			});
		});
	};

	const renderObjects = (rootId: string, node: any, marks: I.Mark[], getValue: () => string, props: any, param?: any) => {
		node = $(node);
		param = param || {};

		const { readonly } = props;
		const items = node.find(Mark.getTag(I.MarkType.Object));
		const subId = param.subId || rootId;

		if (!items.length) {
			return;
		};

		items.each((i: number, item: any) => {
			item = $(item);

			const param = item.attr('data-param');
			const scheme = U.String.urlScheme(param);
			const isRoute = scheme && (scheme == J.Constant.protocol);
			
			let id = param;
			let routeParam = null;

			if (isRoute) {
				routeParam = U.Router.getParam(param.replace(`${J.Constant.protocol}://`, ''));
				id = routeParam.id;
			};

			const object = S.Detail.get(subId, id, []);
			const range = String(item.attr('data-range') || '').split('-');

			if (!id) {
				return;
			};

			item.removeClass('disabled');

			if (object._empty_ || object.isDeleted) {
				item.addClass('disabled');
			};

			item.off('mousedown.object').on('mousedown.object', e => {
				e.preventDefault();

				object._routeParam_ = {};
				if (isRoute && routeParam) {
					object._routeParam_ = routeParam;
				};

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
					onChange: marks => setMarksCallback(getValue(), marks, param.onChange),
				});
			});
		});
	};

	const renderEmoji = (node: any, param?: any) => {
		node = $(node);
		param = param || {};

		const items = node.find(Mark.getTag(I.MarkType.Emoji));
		if (!items.length) {
			return;
		};

		const size = param.iconSize || U.Data.emojiParam(block.content.style);

		items.each((i: number, item: any) => {
			item = $(item);

			const id = item.attr('data-param');
			const smile = item.find('smile');

			if (smile.length) {
				const container = smile.get(0) as HTMLElement & { _reactRoot?: Root };
				const root = container._reactRoot || createRoot(container);

				container._reactRoot = root;
				root.render(<IconObject size={size} iconSize={size} object={{ iconEmoji: id }} />);
			};
		});
	};

	const setMarksCallback = (text: string, marks: I.Mark[], onChange: (text: string, marks: I.Mark[]) => void) => {
		const restricted = [];

		if (block.isTextHeader()) {
			restricted.push(I.MarkType.Bold);
		};

		const parsed = Mark.fromHtml(text, restricted);

		if (onChange) {
			onChange(parsed.text, marks);
		} else {
			setMarks(parsed.text, marks);
		};
	};

	const onMentionSelect = (getValue: () => string, marks: I.Mark[], id: string, icon: string) => {
		U.Data.blockSetText(rootId, block.id, getValue(), marks, true, () => {
			U.Object.setIcon(id, icon, '');
		});
	};

	const onMentionUpload = (getValue: () => string, marks: I.Mark[], targetId: string, objectId: string) => {
		U.Data.blockSetText(rootId, block.id, getValue(), marks, true, () => {
			U.Object.setIcon(targetId, '', objectId);
		});
	};

	const onMentionCheckbox = (getValue: () => string, marks: I.Mark[], objectId: string, done: boolean) => {
		U.Data.blockSetText(rootId, block.id, getValue(), marks, true, () => {
			U.Object.setDone(objectId, done);
		});
	};

	const setMarks = (value: string, marks: I.Mark[]) => {
		U.Data.blockSetText(rootId, block.id, value, block.canHaveMarks() ? marks : [], true);
	};
	
	if (!block) {
		return null;
	};

	const { id, type, fields, content, bgColor } = block;
	const index = props.index || '';

	if (!id) {
		return null;
	};

	let hAlign = null;
	if (contextParam && (block.isTextTitle() || block.isTextDescription() || block.isFeatured())) {
		hAlign = contextParam.hAlign;
	} else {
		hAlign = block.hAlign;
	};

	hAlign = hAlign || I.BlockHAlign.Left;

	const { style, checked } = content;
	const root = S.Block.getLeaf(rootId, rootId);
	const cn: string[] = [ 'block', U.Data.blockClass(block), `align${hAlign}`, `index${index}` ];
	const cd: string[] = [ 'wrapContent' ];
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
			renderChildren = !isInsideTable;

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
					ref={childRef}
					{...props}
					onToggle={onToggle}
					renderLinks={renderLinks}
					renderMentions={renderMentions}
					renderObjects={renderObjects}
					renderEmoji={renderEmoji}
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
			blockComponent = <BlockIconPage key={key} ref={childRef} {...props} />;
			break;
		};
			
		case I.BlockType.IconUser: {
			canSelect = false;
			canDrop = false;
			blockComponent = <BlockIconUser key={key} ref={childRef} {...props} />;
			break;
		};
			
		case I.BlockType.File: {
			const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'isDeleted', 'creator', 'syncStatus' ], true);
			const showLoader = 
				(content.state == I.FileState.Uploading) || 
				(
					(object.syncStatus == I.SyncStatusObject.Syncing) && 
					(object.creator != U.Space.getCurrentParticipantId())
				);

			if (showLoader) {
				blockComponent = <BlockLoader key={key} ref={childRef} {...props} />;
				cn.push('isLoading');
				break;
			};

			let hasContent = false;
			if (!object.isDeleted && (content.state == I.FileState.Done)) {
				cn.push('withContent');
				hasContent = true;
			};

			if ((style == I.FileStyle.Link) && hasContent) {
				blockComponent = <BlockFile key={key} ref={childRef} {...props} />;
				break;
			};

			switch (content.type) {
				default: {
					blockComponent = <BlockFile key={key} ref={childRef} {...props} />;
					break;
				};
					
				case I.FileType.Image: {
					blockComponent = <BlockImage key={key} ref={childRef} {...props} />;
					break;
				};
					
				case I.FileType.Video: {
					blockComponent = <BlockVideo key={key} ref={childRef} {...props} />;
					break;
				};

				case I.FileType.Audio: {
					blockComponent = <BlockAudio key={key} ref={childRef} {...props} />;
					break;
				};

				case I.FileType.Pdf: {
					blockComponent = <BlockPdf key={key} ref={childRef} {...props} />;
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

			blockComponent = <BlockDataview key={key} ref={childRef} isInline={isInline} {...props} />;
			break;
		};

		case I.BlockType.Chat: {
			canDrop = canSelect = false;
			blockComponent = (
				<BlockChat 
					key={key} 
					ref={childRef} 
					{...props}
					renderLinks={renderLinks} 
					renderMentions={renderMentions}
					renderObjects={renderObjects}
					renderEmoji={renderEmoji}
				/>
			);
			break;
		};
			
		case I.BlockType.Div: {
			blockComponent = <BlockDiv key={key} ref={childRef} {...props} />;
			break;
		};
			
		case I.BlockType.Link: {
			const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'restrictions' ], true);
			
			if (S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Block ])) {
				canDropMiddle = canDrop;
			};

			cn.push(U.Data.linkCardClass(content.cardStyle));

			blockComponent = <BlockLink key={key} ref={childRef} {...props} />;
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

			blockComponent = <BlockBookmark key={key} ref={childRef} {...props} />;
			break;
		};
			
		case I.BlockType.Cover: {
			canSelect = false;
			canDrop = false;

			blockComponent = <BlockCover key={key} ref={childRef} {...props} />;
			break;
		};

		case I.BlockType.Relation: {
			blockComponent = <BlockRelation key={key} ref={childRef} {...props} />;
			break;
		};

		case I.BlockType.Featured: {
			canDrop = false;

			blockComponent = <BlockFeatured key={key} ref={childRef} {...props} />;
			break;
		};

		case I.BlockType.Embed: {
			blockComponent = <BlockEmbed key={key} ref={childRef} {...props} />;
			break;
		};

		case I.BlockType.Table: {
			blockComponent = <BlockTable key={key} ref={childRef} {...props} />;
			break;
		};

		case I.BlockType.TableOfContents: {
			blockComponent = <BlockTableOfContents key={key} ref={childRef} {...props} />;
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
				{...props} 
				rootId={rootId} 
				id={id} 
				style={style} 
				type={type} 
				dropType={I.DropType.Block} 
				canDropMiddle={canDropMiddle} 
				onContextMenu={onContextMenu}
			>
				{blockComponent}
			</DropTarget>
		);

		targetBot = <DropTarget {...props} isTargetBottom={true} rootId={rootId} id={id} style={style} type={type} dropType={I.DropType.Block} canDropMiddle={canDropMiddle} />;
	} else {
		object = <div className="dropTarget" onContextMenu={onContextMenu}>{blockComponent}</div>;
		targetBot = <div className="dropTarget targetBot" />;
	};

	if (block.isLayoutRow()) {
		if (canDrop) {
			targetTop = <DropTarget {...props} isTargetTop={true} rootId={rootId} id={id} style={style} type={type} dropType={I.DropType.Block} canDropMiddle={canDropMiddle} />;
		} else {
			targetTop = <div className="dropTarget targetTop" />;
		};
	};

	if (block.isLayoutColumn() && canDrop) {
		targetColumn = (
			<DropTarget 
				{...props} 
				isTargetColumn={true} 
				rootId={rootId} 
				id={block.id} 
				style={style} 
				type={type} 
				dropType={I.DropType.Block} 
				canDropMiddle={canDropMiddle} 
				onClick={onEmptyColumn} 
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

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
		getChildNode: () => childRef.current,
	}));

	return (
		<div 
			ref={nodeRef}
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
					onDragStart={onDragStart} 
					onMouseDown={onMenuDown} 
					onClick={onMenuClick} 
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
						{...props} 
						onMouseMove={onMouseMoveHandler} 
						onMouseLeave={onMouseLeaveHandler} 
						onResizeStart={onResizeStart} 
					/>
				) : ''}

				{targetBot}
				{targetColumn}
			</div>
		</div>
	);
	
}));

export default Block;