import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { createRoot, Root } from 'react-dom/client';
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
import * as I from 'Interface';
import Storage from 'Lib/storage';
import { focus } from 'Lib/focus';

interface Props extends I.BlockComponent {
	css?: any;
	iconSize?: number;
};

interface Ref {
	getNode: () => any;
	getChildNode: () => any;
};

const SNAP = 0.01;

const Block = forwardRef<Ref, Props>((props, ref) => {

	const { 
		rootId, css, className, block, index, readonly, isInsideTable, isSelectionDisabled, contextParam, onMouseEnter, onMouseLeave,
		isContextMenuDisabled, blockRemove, getWrapperWidth,
	} = props;
	const nodeRef = useRef(null);
	const childRef = useRef(null);
	const idsRef = useRef<string[]>([]);
	const mouseMoveHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);
	const mouseUpHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);

	useEffect(() => {
		const { focused } = focus.state;

		if (block && (focused == block.id)) {
			focus.apply();
		};

		initToggle();
	});

	const initToggle = () => {
		if (block && block.id && block.canToggle()) {
			S.Block.toggle(rootId, block.id, Storage.checkToggle(rootId, block.id));
		};
	};

	const onToggle = (e: any) => {
		e.stopPropagation();

		const value = !Storage.checkToggle(rootId, block.id);
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block, false) || [];

		ids.push(block.id);

		const toggles = S.Block.getBlocks(rootId).filter(it => ids.includes(it.id) && it.canToggle());

		toggles.forEach(it => {
			S.Block.toggle(rootId, it.id, value);
		});

		if (ids.length == 1) {
			focus.apply();
		};
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
		const element = U.Dom.get(`button-block-menu-${block.id}`);

		if (!element) {
			return;
		};

		const rect = element.getBoundingClientRect();

		selection.set(I.SelectType.Block, idsRef.current);

		menuOpen({
			horizontal: I.MenuDirection.Right,
			offsetX: element.offsetWidth,
			rect: { x: rect.left, y: keyboard.mouse.page.y, width: U.Dom.contentWidth(element), height: 0 },
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

		// Cross-block text selection gets its own minimal context menu
		if (selection?.getTextSelection()) {
			e.preventDefault();
			e.stopPropagation();

			onContextMenuTextSelection();
			return;
		};

		// Allow native context menu (spellcheck) when clicking on links
		if ((e.target as HTMLElement)?.closest('.markupLink')) {
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

	// Minimal context menu for a cross-block text selection: copy / cut / quote in discussion
	const onContextMenuTextSelection = () => {
		const selection = S.Common.getRef('selectionProvider');
		const textSel = selection?.getTextSelection();

		if (!textSel) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, [ 'type' ], true);
		const canQuote = !U.Object.isTemplateType(object?.type);
		const cmd = keyboard.cmdSymbol();
		const options: any[] = [
			{ id: 'copy', iconParam: { name: 'menu/action/copy' }, name: translate('commonCopy'), caption: `${cmd} + C` },
			(!readonly ? { id: 'cut', iconParam: { name: 'menu/action/cut' }, name: translate('commonCut'), caption: `${cmd} + X` } : null),
			(canQuote ? { id: 'quote', iconParam: { name: 'menu/action/quote' }, name: translate('commonQuoteInComment') } : null),
		].filter(it => it);

		S.Menu.closeAll([], () => {
			S.Menu.open('select', {
				rect: { x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 },
				classNameWrap: 'fromBlock',
				data: {
					options,
					onSelect: (e: any, item: any) => {
						switch (item.id) {
							case 'copy': {
								Action.copyTextSelection(rootId, I.ClipboardMode.Copy);
								break;
							};

							case 'cut': {
								Action.copyTextSelection(rootId, I.ClipboardMode.Cut);
								break;
							};

							case 'quote': {
								quoteTextSelection(textSel);
								break;
							};
						};
					},
				},
			});
		});
	};

	// Sends the selected text (with marks) to the discussion composer as a quote
	const quoteTextSelection = (textSel: any) => {
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.getTextSelectionIds() || [];
		const parts = [];

		ids.forEach((id: string) => {
			const b = S.Block.getLeaf(rootId, id);
			if (!b || !b.isText()) {
				return;
			};

			const bt = String(b.content.text || '');
			const r = { from: 0, to: bt.length };

			if (id == textSel.from.id) {
				r.from = Math.min(textSel.from.range.from, bt.length);
			};
			if (id == textSel.to.id) {
				r.to = Math.min(textSel.to.range.to, bt.length);
			};

			parts.push({
				text: bt.slice(r.from, r.to),
				marks: Mark.cutRange(b.content.marks || [], r.from, r.to),
			});
		});

		if (!parts.length) {
			return;
		};

		let text = '';
		let marks: I.Mark[] = [];

		parts.forEach((it, i) => {
			if (i) {
				text += '\n';
			};

			marks = marks.concat(Mark.adjust(it.marks, 0, text.length));
			text += it.text;
		});

		const part: I.CommentContentPart = {
			style: I.TextStyle.Quote,
			type: I.BlockType.Text,
			text,
			marks,
			editorQuote: { blockId: textSel.from.id },
		};

		// Defer dispatch so the menu close stack unwinds before the section reacts
		window.setTimeout(() => {
			window.dispatchEvent(new CustomEvent(`commentQuote.${rootId}`, { detail: part }));
		}, 0);
	};

	const menuOpen = (param?: Partial<I.MenuParam>) => {
		const selection = S.Common.getRef('selectionProvider');
		const data = param?.data || {};

		// Hide block menus and plus button
		const pageContainer = U.Dom.getPageFlexContainer(keyboard.isPopup());
		const addBtn = U.Dom.get('button-block-add');
		if (addBtn) U.Dom.removeClass(addBtn, 'show');
		U.Dom.selectAll('.block.showMenu', pageContainer).forEach(el => U.Dom.removeClass(el, 'showMenu'));
		U.Dom.selectAll('.block.isAdding', pageContainer).forEach(el => {
			U.Dom.removeClass(el, 'isAdding');
			U.Dom.removeClass(el, 'top');
			U.Dom.removeClass(el, 'bottom');
		});

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
		const node = nodeRef.current;
		const prevBlockId = childrenIds[index - 1];
		const prevBlockEl = prevBlockId && node ? U.Dom.select(`#block-${U.Common.esc(prevBlockId)}`, node) : null;
		const offset = (prevBlockEl ? prevBlockEl.getBoundingClientRect().left : 0) + J.Size.blockMenu;

		selection?.clear();

		unbind();
		U.Dom.addClass(node, 'isResizing');
		U.Dom.addClass(document.body, 'colResize');

		keyboard.setResize(true);
		keyboard.disableSelection(true);

		if (node) {
			U.Dom.selectAll('.colResize.active', node).forEach(el => U.Dom.removeClass(el, 'active'));
			const colResize = U.Dom.select(`.colResize.c${index}`, node);
			if (colResize) U.Dom.addClass(colResize, 'active');
		};

		mouseMoveHandlerRef.current = (e: globalThis.MouseEvent) => onResize(e, index, offset);
		mouseUpHandlerRef.current = (e: globalThis.MouseEvent) => onResizeEnd(e, index, offset);
		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandlerRef.current],
			['mouseup', mouseUpHandlerRef.current],
		]);
	};

	const onResize = (e: any, index: number, offset: number) => {
		e.preventDefault();
		e.stopPropagation();

		const childrenIds = S.Block.getChildrenIds(rootId, block.id);

		if (childrenIds.length < 2) {
			return;
		};

		const node = nodeRef.current;
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];

		const prevNode = node ? U.Dom.select(`#block-${U.Common.esc(prevBlockId)}`, node) : null;
		const currentNode = node ? U.Dom.select(`#block-${U.Common.esc(currentBlockId)}`, node) : null;
		const res = calcWidth(e.pageX - offset, index);

		if (!res) {
			return;
		};

		const w1 = res.percent * res.sum;
		const w2 = (1 - res.percent) * res.sum;

		if (prevNode) U.Dom.css(prevNode, { width: w1 * 100 + '%' });
		if (currentNode) U.Dom.css(currentNode, { width: w2 * 100 + '%' });
	};

	const onResizeEnd = (e: any, index: number, offset: number) => {
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);
		const node = nodeRef.current;
		const prevBlockId = childrenIds[index - 1];
		const currentBlockId = childrenIds[index];
		const res = calcWidth(e.pageX - offset, index);

		unbind();
		U.Dom.removeClass(node, 'isResizing');
		U.Dom.removeClass(document.body, 'colResize');

		keyboard.setResize(false);
		keyboard.disableSelection(false);

		if (node) {
			U.Dom.selectAll('.colResize.active', node).forEach(el => U.Dom.removeClass(el, 'active'));
		};

		if (res) {
			C.BlockListSetFields(rootId, [
				{ blockId: prevBlockId, fields: { width: res.percent * res.sum } },
				{ blockId: currentBlockId, fields: { width: (1 - res.percent) * res.sum } },
			]);
		};
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
		const node = nodeRef.current;
		const childrenIds = S.Block.getChildrenIds(rootId, block.id);
		const length = childrenIds.length;
		const children = S.Block.getChildren(rootId, block.id);
		const rect = U.Dom.getElementRect(node);
		const { x, width } = rect;
		const p = e.pageX - x - sm;

		let c = 0;
		let num = 0;

		for (let i = 0; i < children.length; i++) {
			const child = children[i];

			c += child.fields.width || 1 / length;
			if ((p >= c * width - sm / 2) && (p <= c * width + sm / 2)) {
				num = i + 1;
				break;
			};
		};

		if (node) {
			U.Dom.selectAll('.colResize.active', node).forEach(el => U.Dom.removeClass(el, 'active'));
			if (num) {
				const colResize = U.Dom.select(`.colResize.c${num}`, node);
				if (colResize) U.Dom.addClass(colResize, 'active');
			};
		};
	};
	
	const onMouseLeaveHandler = (e: any) => {
		if (!keyboard.isResizing) {
			U.Dom.selectAll('.colResize.active', nodeRef.current).forEach(el => U.Dom.removeClass(el, 'active'));
		};
	};
	
	const unbind = () => {
		if (mouseMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
			mouseMoveHandlerRef.current = null;
		};
		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
			mouseUpHandlerRef.current = null;
		};
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
		if (!node) return;
		param = param || {};

		const { readonly } = props;
		const items = U.Dom.selectAll(Mark.getTag(I.MarkType.Link), node);
		const subId = param.subId || rootId;

		if (!items.length) {
			return;
		};

		items.forEach((item: HTMLElement) => {
			item.onclick = (e: Event) => {
				e.preventDefault();
			};

			item.onmousedown = (e: MouseEvent) => {
				if (e.button == 2) {
					return;
				};

				e.preventDefault();

				const el = e.currentTarget as HTMLElement;
				const url = String(el.getAttribute('href') || '');
				const { isInside, target, spaceId, messageId } = U.Common.getLinkParamFromUrl(url);

				const openObject = (id: string, spaceId: string) => {
					// Cross-space: delegate to PageMainObject which handles space switching before resolution
					if (spaceId && (spaceId != S.Common.space)) {
						const param: any = { page: 'main', action: 'object', id, spaceId };
						if (messageId) {
							param.messageId = messageId;
						};
						U.Router.go(U.Router.build(param), {});
						return;
					};

					// Same-space: resolve directly (preserves modifier key handling)
					const cb = (object) => {
						if (object) {
							if (messageId) {
								object = { ...object, _routeParam_: { messageId } };
							};
							U.Object.openEvent(e, object);
						};
					};

					if (spaceId) {
						U.Object.getById(id, { spaceId }, cb);
					} else {
						cb(S.Detail.get(subId, id, []));
					};
				};

				if (isInside) {
					openObject(target, spaceId);
					return;
				};

				// Handle external URLs that resolve to internal routes (e.g. object.any.coop)
				const route = U.Common.getRouteFromUrl(url);
				if (route) {
					const routeParam = U.Router.getParam(route);

					if (routeParam.id) {
						openObject(routeParam.id, routeParam.spaceId);
						return;
					};
				};

				Action.openUrl(target);
			};

			item.onmouseenter = (e: MouseEvent) => {
				const sr = U.Dom.getSelectionRange();
				if (sr && !sr.collapsed) {
					return;
				};

				const item = e.currentTarget as HTMLElement;
				const url = String(item.getAttribute('href') || '');

				if (!url) {
					return;
				};

				const range = String(item.getAttribute('data-range') || '').split('-');
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
			};
		});
	};

	const renderMentions = (rootId: string, node: any, marks: I.Mark[], getValue: () => string, param?: any) => {
		if (!node) return;
		param = param || {};

		const size = param.iconSize || U.Data.emojiParam(block.content.style);
		const items = U.Dom.selectAll(Mark.getTag(I.MarkType.Mention), node);
		const subId = param.subId || rootId;

		if (!items.length) {
			return;
		};

		items.forEach((item: HTMLElement, i: number) => {
			const smile = U.Dom.select('smile', item);
			if (!smile) {
				return;
			};

			const range = String(item.getAttribute('data-range') || '').split('-');
			const target = String(item.getAttribute('data-param') || '');
			const object = S.Detail.get(subId, target, []);
			const { id, _empty_, layout, done, isDeleted, isArchived } = object;
			const isTask = U.Object.isTaskLayout(layout);
			const name = U.Dom.select('name', item);
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

			U.Dom.removeClass(item, 'disabled');
			U.Dom.removeClass(item, 'isDone');

			if (_empty_ || isDeleted) {
				U.Dom.addClass(item, 'disabled');
			};

			if ((layout == I.ObjectLayout.Task) && done) {
				U.Dom.addClass(item, 'isDone');
			};


			const container = smile as HTMLElement & { _reactRoot?: Root };
			const root = container._reactRoot || createRoot(container);

			container._reactRoot = root;
			root.render(icon);

			U.Dom.addClass(item, `withImage`);
			U.Dom.addClass(item, `c${size}`);

			if (!target || U.Dom.hasClass(item, 'disabled')) {
				return;
			};

			if (clickable) {
				clickable.onmousedown = (e: Event) => {
					e.preventDefault();
					U.Object.openEvent(e, object);
				};

				if (param.withPreview === false) {
					return;
				};

				clickable.onmouseenter = (e: Event) => {
					const sr = U.Dom.getSelectionRange();
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
				};
			};
		});
	};

	const renderObjects = (rootId: string, node: any, marks: I.Mark[], getValue: () => string, props: any, param?: any) => {
		if (!node) return;
		param = param || {};

		const { readonly } = props;
		const items = U.Dom.selectAll(Mark.getTag(I.MarkType.Object), node);
		const subId = param.subId || rootId;

		if (!items.length) {
			return;
		};

		items.forEach((item: HTMLElement) => {
			const dataParam = item.getAttribute('data-param');
			const scheme = U.String.urlScheme(dataParam);
			const isRoute = scheme && (scheme == J.Constant.protocol);

			let id = dataParam;
			let routeParam = null;

			if (isRoute) {
				routeParam = U.Router.getParam(dataParam.replace(`${J.Constant.protocol}://`, ''));
				id = routeParam.id;
			};

			const object = S.Detail.get(subId, id, []);
			const range = String(item.getAttribute('data-range') || '').split('-');

			if (!id) {
				return;
			};

			U.Dom.removeClass(item, 'disabled');

			if (object._empty_ || object.isDeleted) {
				U.Dom.addClass(item, 'disabled');
			};

			item.onmousedown = (e: Event) => {
				e.preventDefault();

				object._routeParam_ = {};
				if (isRoute && routeParam) {
					object._routeParam_ = routeParam;
				};

				U.Object.openEvent(e, object);
			};

			item.onmouseleave = () => Preview.tooltipHide(false);

			item.onmouseenter = () => {
				const sr = U.Dom.getSelectionRange();
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
			};
		});
	};

	const renderEmoji = (node: any, param?: any) => {
		if (!node) return;
		param = param || {};

		const items = U.Dom.selectAll(Mark.getTag(I.MarkType.Emoji), node);
		if (!items.length) {
			return;
		};

		const size = param.iconSize || U.Data.emojiParam(block.content.style);

		items.forEach((item: HTMLElement) => {
			const id = item.getAttribute('data-param');
			const smile = U.Dom.select('smile', item);

			if (smile) {
				const container = smile as HTMLElement & { _reactRoot?: Root };
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
	const cn = [ 'block', U.Data.blockClass(block), `align${hAlign}` ];

	if (undefined !== index) {
		cn.push(`index${index}`);
	};

	const cd = [ 'wrapContent' ];
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
			if (!object.isDeleted && !object.isArchived && (content.state == I.FileState.Done)) {
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
			<div id={(isSelectionDisabled || !canSelect) ? undefined : `selectionTarget-${id}`} className="selectionTarget">
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
					name="block/menu"
					className="commonDnd"
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
	
});

export default Block;