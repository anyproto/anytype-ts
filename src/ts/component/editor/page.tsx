import React, { forwardRef, useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { Icon, Deleted, DropTarget, EditorControls } from 'Component';
import { I, C, S, U, J, Key, Preview, Mark, keyboard, Storage, Action, translate, analytics, Renderer, focus } from 'Lib';
import PageHeadEditor from 'Component/page/elements/head/editor';
import Children from 'Component/page/elements/children';
import TableOfContents from 'Component/page/elements/tableOfContents';

interface Props extends I.PageComponent {
	onOpen?(): void;
};

const THROTTLE = 50;
const BUTTON_OFFSET = 10;

const EditorPage = observer(forwardRef<I.BlockRef, Props>((props, ref) => {
	
	const { rootId, isPopup, onOpen } = props;
	const root = S.Block.getLeaf(rootId, rootId);
	const nodeRef = useRef(null);
	const tocRef = useRef(null);
	const headerRef = useRef(null);
	const controlsRef = useRef(null);
	const idRef = useRef('');
	const [ isDeleted, setIsDeleted ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const moveDir = useRef(0);
	const timeoutMove = useRef(0);
	const timeoutScroll = useRef(0);
	const frameMove = useRef(0);
	const frameScroll = useRef(0);
	const frameResize = useRef(0);
	const hoverId = useRef('');
	const hoverPosition = useRef(I.BlockPosition.None);
	const buttonAdd = useRef<any>(null);
	const blockFeatured = useRef<any>(null);
	const container = useRef<any>(null);

	useEffect(() => {
		open();

		return () => {
			unbind();
			close();

			focus.clear(false);

			raf.cancel(frameMove.current);
			raf.cancel(frameScroll.current);
			raf.cancel(frameResize.current);

			window.clearTimeout(timeoutMove.current);
			window.clearTimeout(timeoutScroll.current);
		};
	}, []);

	useEffect(() => {
		if (idRef.current != rootId) {
			close();
			open();
		};
	}, [ rootId ]);

	useEffect(() => {
		if (!root) {
			return;
		};

		const node = $(nodeRef.current);
		const resizable = node.find('.resizable');
		const top = Storage.getScroll('editor', rootId, isPopup);

		checkDeleted();
		initNodes();
		rebind();
		resizePage();
		onScroll();

		if (top) {
			window.setTimeout(() => U.Common.getScrollContainer(isPopup).scrollTop(top), 40);
		};

		focus.apply();
		S.Block.updateNumbers(rootId);

		if (resizable.length) {
			resizable.trigger('resizeInit');
		};
	});

	const initNodes = () => {
		const node = $(nodeRef.current);

		container.current = node.find('.editor');
		buttonAdd.current = node.find('#button-block-add');
		blockFeatured.current = node.find(`#block-${J.Constant.blockId.featured}`);
	};

	const getWrapperWidth = (): number => {
		return getWidth(U.Data.getLayoutWidth(rootId));
	};

	const checkDeleted = () => {
		if (isDeleted) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, []);

		if (object.isDeleted) {
			setIsDeleted(true);
		};
	};

	const open = () => {
		setIsDeleted(false);
		idRef.current = rootId;

		C.ObjectOpen(rootId, '', S.Common.space, (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code)) {
				return;
			};

			S.Common.setRightSidebarState(isPopup, { rootId });

			onOpen?.();
			focusInit();
			controlsRef.current?.forceUpdate();
			tocRef.current?.forceUpdate();
			setDummy(dummy + 1);
		});
	};

	const close = () => {
		Action.pageClose(isPopup, idRef.current, true);
		Storage.setFocus(idRef.current, focus.state);
		idRef.current = '';
	};

	const onCommand = (cmd: string, arg: any) => {
		const { focused, range } = focus.state;
		const popupOpen = S.Popup.isOpen('', [ 'page' ]);
		const menuOpen = menuCheck();

		if ((isPopup !== keyboard.isPopup()) || keyboard.isShortcutEditing) {
			return;
		};

		switch (cmd) {
			case 'selectAll': {
				if (popupOpen || menuOpen || keyboard.isFocused) {
					break;
				};

				let length = 0;
				if (focused) {
					const block = S.Block.getLeaf(rootId, focused);
					if (block) {
						length = block.getLength();
					};
				};

				if ((range.from == 0) && (range.to == length)) {
					onSelectAll();
				} else {
					focus.set(focused, { from: 0, to: length });
					focus.apply();
				};
				break;
			};

			case 'pastePlain': {
				(async () => {
					const text = await navigator.clipboard.readText();
					if (text) {
						onPaste({ text });
					};
				})();
				break;
			};
		};
	};
	
	const focusInit = () => {
		if (isReadonly()) {
			return;
		};

		const storage = Storage.getFocus(rootId);
		const root = S.Block.getLeaf(rootId, rootId);

		let block = null;
		let from = 0;
		let to = 0;

		if (storage) {
			block = S.Block.getLeaf(rootId, storage.focused);
			from = storage.range.from;
			to = storage.range.to;
		};

		if (!block || !block.isText()) {
			if (U.Object.isNoteLayout(root.layout)) {
				block = S.Block.getFirstBlock(rootId, -1, it => it.isFocusable());
			} else {
				block = S.Block.getLeaf(rootId, J.Constant.blockId.title);
			};

			if (block && block.getLength()) {
				block = null;
			};
		};

		if (!block) {
			return;
		};

		focus.set(block.id, { from, to });
		focus.apply();
		focus.scroll(isPopup, block.id);
	};
	
	const unbind = () => {
		const ns = `editor${U.Common.getEventNamespace(isPopup)}`;
		const container = U.Common.getScrollContainer(isPopup);
		const events = [ 'keydown', 'mousemove', 'paste', 'resize', 'focus' ];
		const selection = S.Common.getRef('selectionProvider');

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		container.off(`scroll.${ns}`);
		Renderer.remove(`commandEditor`);
		selection?.setContextMenuHandler(null);
	};

	const rebind = () => {
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const ns = `editor${U.Common.getEventNamespace(isPopup)}`;
		const container = U.Common.getScrollContainer(isPopup);
		const readonly = isReadonly();

		unbind();

		if (!readonly) {
			win.on(`mousemove.${ns}`, throttle(e => onMouseMove(e), THROTTLE));
		};

		win.on(`keydown.${ns}`, e => onKeyDownEditor(e));
		win.on(`paste.${ns}`, (e: any) => {
			if (!keyboard.isFocused) {
				onPasteEvent(e, props);
			};
		});

		win.on(`focus.${ns}`, () => {
			const popupOpen = S.Popup.isOpen('', [ 'page' ]);
			const menuOpen = menuCheck();
			const ids = selection?.get(I.SelectType.Block, true) || [];
			const top = Storage.getScroll('editor', rootId, isPopup);

			if (!ids.length && !menuOpen && !popupOpen) {
				focus.restore();
				raf(() => focus.apply());
			};

			if (top) {
				window.setTimeout(() => container.scrollTop(top), 10);
			};
		});

		win.on(`resize.${ns} sidebarResize.${ns}`, () => resizePage());
		container.on(`scroll.${ns}`, () => onScroll());

		Renderer.on(`commandEditor`, (e: any, cmd: string, arg: any) => onCommand(cmd, arg));

		// Register context menu handler for block selection
		selection?.setContextMenuHandler((e, blockIds) => {
			const root = S.Block.getLeaf(rootId, rootId);

			if (!root || root.isLocked() || isReadonly()) {
				return;
			};

			S.Menu.closeAll([], () => {
				S.Menu.open('blockAction', {
					rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
					classNameWrap: 'fromBlock',
					noFlipX: true,
					subIds: J.Menu.action,
					onClose: () => {
						selection?.clear();
						focus.apply();
					},
					data: {
						blockId: blockIds[0],
						blockIds,
						rootId,
						blockRemove,
					}
				});
			});
		});
	};
	
	const onMouseMove = (e: any) => {
		if (
			!buttonAdd.current.length || 
			!container.current.length
		) {
			return;
		};
		
		const selection = S.Common.getRef('selectionProvider');
		const readonly = isReadonly();
		const node = $(nodeRef.current);
		const menuOpen = menuCheck();
		const popupOpen = S.Popup.isOpen('', [ 'page' ]);
		const st = $(window).scrollTop();

		const clear = () => {
			node.find('.block.showMenu').removeClass('showMenu');
			node.find('.block.isAdding').removeClass('isAdding top bottom');
		};

		const out = () => {
			window.clearTimeout(timeoutMove.current);
			timeoutMove.current = window.setTimeout(() => {
				buttonAdd.current.removeClass('show');
				clear();
			}, 30);
		};

		if (
			readonly || 
			keyboard.isResizing || 
			keyboard.isDragging || 
			selection?.isSelecting() || 
			menuOpen || 
			popupOpen
		) {
			out();
			return;
		};

		const { pageX, pageY } = e;
		const blocks = S.Block.getBlocks(rootId, it => it.canCreateBlock()).sort((c1, c2) => {
			const l1 = c1.isLayout();
			const l2 = c2.isLayout();

			if (l1 && !l2) return -1;
			if (!l1 && l2) return 1;

			return 0;
		});

		let offset = 140;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, height: 0 };

		if (blockFeatured.current.length) {
			offset = blockFeatured.current.offset().top + blockFeatured.current.outerHeight() - BUTTON_OFFSET;
		};

		for (const block of blocks) {
			const obj = $(`#block-${block.id}`);
			if (!obj.length || obj.hasClass('noPlus')) {
				continue;
			};

			const rect = obj.get(0).getBoundingClientRect() as DOMRect;

			rect.y += st;

			if (block.isDataview()) {
				rect.height = 88;
			};

			if ((pageX >= rect.x) && (pageX <= rect.x + rect.width) && (pageY >= rect.y) && (pageY <= rect.y + rect.height)) {
				hoverId.current = block.id;
				hovered = obj;
				hoveredRect = rect;

				if (block.isLayout() && (pageX < rect.x) || (pageX > rect.x + J.Size.blockMenu)) {
					continue;
				};
			};
		};

		const { x, y, height } = hoveredRect;
		
		if (frameMove.current) {
			raf.cancel(frameMove.current);
		};

		if (keyboard.isDragging) {
			out();
			
			if (hovered) {
				hovered.addClass('showMenu');
			};
			return;
		};

		hoverPosition.current = I.BlockPosition.None;

		let rectContainer = null;
		if (hovered) {
			rectContainer = (container.current.get(0) as Element).getBoundingClientRect() as DOMRect;

			if (
				(pageX >= x) && 
				(pageX <= x + J.Size.blockMenu) && 
				(pageY >= offset + BUTTON_OFFSET) && 
				(pageY <= st + rectContainer.height + offset + BUTTON_OFFSET)
			) {
				hoverPosition.current = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			};
		};

		frameMove.current = raf(() => {
			if (hoverPosition.current == I.BlockPosition.None) {
				out();
				return;
			};

			const buttonX = hoveredRect.x - (rectContainer.x - J.Size.blockMenu) + 2;
			const buttonY = pageY - rectContainer.y - BUTTON_OFFSET - st;
			
			clear();
			buttonAdd.current.addClass('show').css({ transform: `translate3d(${buttonX}px,${buttonY}px,0px)` });
			hovered.addClass('showMenu');

			if (pageX <= x + 20) {
				hovered.addClass(`isAdding ${hoverPosition.current == I.BlockPosition.Top ? 'top' : 'bottom'}`);
			};
		});
	};
	
	const onKeyDownEditor = (e: any) => {
		if (S.Popup.isOpen('', [ 'page' ])) {
			return;
		};

		if (isPopup !== keyboard.isPopup()) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const menuOpen = menuCheck();
		const popupOpen = S.Popup.isOpenKeyboard();
		const root = S.Block.getLeaf(rootId, rootId);

		if (keyboard.isFocused || !selection || !root) {
			return;
		};

		Preview.previewHide(true);
		
		const ids = selection.get(I.SelectType.Block);
		const idsWithChildren = selection.get(I.SelectType.Block, true);
		const cmd = keyboard.cmdKey();
		const readonly = isReadonly();
		const styleParam = getStyleParam();

		let ret = false;

		// Select all
		keyboard.shortcut('selectAll', e, () => {
			if (popupOpen || menuOpen) {
				return;
			};

			e.preventDefault();
			onSelectAll();

			ret = true;
		});

		// Copy/Cut
		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
			onCopy(e, pressed.match('x') ? I.ClipboardMode.Cut : I.ClipboardMode.Copy);

			ret = true;
		});

		// Paste
		keyboard.shortcut(`${cmd}+v`, e, (pressed: string) => {
			ret = true;
		});

		// Undo
		keyboard.shortcut('undo', e, () => {
			if (!readonly) {
				e.preventDefault();
				keyboard.onUndo(rootId, 'editor');
			};

			ret = true;
		});

		// Redo
		keyboard.shortcut('redo', e, () => {
			if (readonly) {
				e.preventDefault();
				keyboard.onRedo(rootId, 'editor');
			};

			ret = true;
		});

		// History
		keyboard.shortcut('history', e, () => {
			e.preventDefault();
			onHistory(e);

			ret = true;
		});

		// Expand selection
		keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
			onShiftArrowEditor(e, pressed);

			ret = true;
		});

		if (idsWithChildren.length) {
			// Mark-up

			let type = null;

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, () => {
					type = item.type;
					ret = true;
				});
			};

			if (!readonly && (type !== null)) {
				e.preventDefault();

				const cb = (type: I.MarkType, param: string) => {
					C.BlockTextListSetMark(rootId, idsWithChildren, { type, param, range: { from: 0, to: 0 } }, () => {
						analytics.event('ChangeTextStyle', { type, count: idsWithChildren.length });
					});
				};

				if (type == I.MarkType.Link) {
					window.setTimeout(() => {
						S.Menu.open('blockLink', {
							element: `#block-${ids[0]}`,
							classNameWrap: 'fromBlock',
							horizontal: I.MenuDirection.Center,
							data: {
								filter: '',
								onChange: cb,
							},
						});
					}, J.Constant.delay.menu);
				} else 
				if ([ I.MarkType.Color, I.MarkType.BgColor ].includes(type)) {
					let menuId = '';
					switch (type) {
						case I.MarkType.Color: {
							menuId = 'blockColor';
							break;
						};

						case I.MarkType.BgColor: {
							menuId = 'blockBackground';
							break;
						};
					};

					S.Menu.open(menuId, {
						element: `#block-${ids[0]}`,
						horizontal: I.MenuDirection.Center,
						classNameWrap: 'fromBlock',
						data: {
							blockId: ids[0],
							blockIds: ids,
							rootId,
							value: '',
							onChange: (param: string) => {
								cb(type, param);
							},
						}
					});
				} else {
					cb(type, '');
				};
			};
		};

		if (ids.length) {
			keyboard.shortcut('escape', e, () => {
				if (!menuOpen) {
					selection.clear();
				};

				ret = true;
			});

			// Duplicate
			keyboard.shortcut('duplicate', e, () => {
				if (readonly) {
					return;
				};

				e.preventDefault();
				Action.duplicate(rootId, rootId, ids[ids.length - 1], ids, I.BlockPosition.Bottom, () => focus.clear(true));

				ret = true;
			});

			for (const item of styleParam) {
				let style = null;

				keyboard.shortcut(item.key, e, () => {
					style = item.style;

					ret = true;
				});

				if (style !== null) {
					C.BlockListTurnInto(rootId, ids, style);
				};
			};

			// Open action menu
			keyboard.shortcut('menuAction', e, () => {
				S.Menu.closeAll([ 'blockContext', 'blockAdd' ], () => {
					S.Menu.open('blockAction', { 
						element: `#block-${ids[0]}`,
						classNameWrap: 'fromBlock',
						offsetX: J.Size.blockMenu,
						data: {
							blockId: ids[0],
							blockIds: ids,
							rootId,
						},
						onClose: () => {
							selection.clear();
							focus.apply();
						}
					});
				});

				ret = true;
			});

			// Move blocks with arrows
			keyboard.shortcut(`moveSelectionUp, moveSelectionDown`, e, (pressed: string) => {
				onCtrlShiftArrowEditor(e, pressed);

				ret = true;
			});
		};

		// Remove blocks
		keyboard.shortcut('backspace, delete', e, () => {
			if (!readonly) {
				e.preventDefault();
				blockRemove();
			};

			ret = true;
		});

		// Indent block
		keyboard.shortcut('indent, outdent', e, (pressed: string) => {
			onTabEditor(e, ids, pressed);

			ret = true;
		});

		// Restore focus
		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			if (menuOpen || popupOpen) {
				return;
			};

			selection.clear();
			focus.restore();
			focus.apply();

			ret = true;
		});

		// Enter
		keyboard.shortcut('enter', e, () => {
			if (menuOpen || popupOpen || readonly) {
				return;
			};

			selection.clear();
			focus.restore();

			const focused = focus.state.focused || J.Constant.blockId.title;
			blockCreate(focused , I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});

			ret = true;
		});

		if (!ret && ids.length && !keyboard.isSpecial(e) && !readonly) {
			const param = {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			};

			C.BlockCreate(rootId, ids[ids.length - 1], I.BlockPosition.Bottom, param, (message: any) => {
				const key = e.key;
				const blockId = message.blockId;

				C.BlockListDelete(rootId, ids);
				U.Data.blockSetText(rootId, blockId, key, [], true, () => {
					const length = key.length;

					focus.set(blockId, { from: length, to: length });
					focus.apply();
					focus.scroll(isPopup, blockId);
				});
			});
		};
	};

	const onKeyDownBlock = (e: any, text: string, marks: I.Mark[], range: any, props: any) => {
		range = range || {};

		const { isInsideTable } = props;
		const { focused } = focus.state;
		const selection = S.Common.getRef('selectionProvider');
		const block = S.Block.getLeaf(rootId, focused);

		if (!block || !keyboard.isFocused) {
			return;
		};

		const readonly = isReadonly();
		const styleParam = getStyleParam();
		const cmd = keyboard.cmdKey();

		// Last line break doesn't expand range.to
		let length = String(text || '').length;
		if (length && (text[length - 1] == '\n')) {
			length--;
		};

		Preview.previewHide(true);
		
		if (U.Common.isPlatformMac()) {
			// Print or prev string
			keyboard.shortcut('ctrl+p', e, (pressed: string) => {
				onArrowVertical(e, Key.up, range, length, props);
			});

			// Next string
			keyboard.shortcut('ctrl+n', e, (pressed: string) => {
				onArrowVertical(e, Key.down, range, length, props);
			});
		};

		// Jump to previous/next block (Alt+Arrow on Mac, Ctrl+Arrow on Windows)
		keyboard.shortcut('prevBlock, nextBlock', e, (pressed: string) => {
			e.preventDefault();
			const dir = pressed == 'prevBlock' ? -1 : 1;
			const next = S.Block.getNextBlock(rootId, block.id, dir, it => it.isFocusable());

			if (next) {
				focusNextBlock(next, dir);
			};
		});

		if (block.isText()) {

			// Select all
			keyboard.shortcut('selectAll', e, (pressed: string) => {
				if ((range.from == 0) && (range.to == length)) {
					e.preventDefault();
					onSelectAll();
				} else {
					focus.set(block.id, { from: 0, to: length });
					focus.apply();
				};
			});

			// Copy/Cut
			keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
				onCopy(e, pressed.match('x') ? I.ClipboardMode.Cut : I.ClipboardMode.Copy);
			});

			// Undo
			keyboard.shortcut('undo', e, () => {
				e.preventDefault();
				keyboard.onUndo(rootId, 'editor');
			});

			// Redo
			keyboard.shortcut('redo', e, () => {
				e.preventDefault();
				keyboard.onRedo(rootId, 'editor');
			});

			// Search
			keyboard.shortcut('searchText', e, () => {
				keyboard.onSearchText(text.substring(range.from, range.to), 'editor');
			});

			if (block.isTextToggle()) {
				keyboard.shortcut(`${cmd}+shift+t`, e, () => {
					S.Block.toggle(rootId, block.id, !Storage.checkToggle(rootId, block.id));
				});
			};

			if (block.isTextCheckbox()) {
				keyboard.shortcut(`${cmd}+enter`, e, () => {
					U.Data.blockSetText(rootId, block.id, text, marks, true, () => {
						C.BlockTextSetChecked(rootId, block.id, !block.content.checked);
					});
				});
			};
		};

		// History
		keyboard.shortcut('history', e, () => {
			e.preventDefault();
			onHistory(e);
		});

		// Duplicate
		keyboard.shortcut('duplicate', e, () => {
			e.preventDefault();
			Action.duplicate(rootId, rootId, block.id, [ block.id ], I.BlockPosition.Bottom);
		});

		// Open action menu
		keyboard.shortcut('menuAction', e, () => {
			S.Menu.close('blockContext', () => {
				S.Menu.open('blockAction', { 
					element: `#block-${block.id}`,
					classNameWrap: 'fromBlock',
					offsetX: J.Size.blockMenu,
					data: {
						blockId: block.id,
						blockIds: selection.getForClick(block.id, true, true),
						rootId,
					},
					onClose: () => {
						selection.clear();
						focus.set(block.id, range);
						focus.apply();
					}
				});
			});
		});

		// Mark-up
		if (block.canHaveMarks() && range.to && (range.from != range.to)) {
			let type = null;

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, (pressed: string) => {
					type = item.type;
				});
			};

			if (type !== null) {
				onMarkBlock(e, type, text, marks, '', range);
			};
		};

		if (range.from == range.to) {
			keyboard.shortcut('search', e, () => keyboard.onSearchPopup(analytics.route.shortcut));
		};

		if (!isInsideTable && block.isText()) {
			for (const item of styleParam) {
				let style = null;

				keyboard.shortcut(item.key, e, (pressed: string) => {
					style = item.style;
				});

				if (style !== null) {
					C.BlockListTurnInto(rootId, [ block.id ], style);
				};
			};
		};

		if (!menuCheck()) {
			// Expand selection
			if (!isInsideTable) {
				keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
					onShiftArrowBlock(e, range, length, pressed);
				});
			};

			keyboard.shortcut('alt+arrowdown, alt+arrowup', e, (pressed: string) => {
				if (block.isTextToggle()) {
					e.preventDefault();
					S.Block.toggle(rootId, block.id, pressed.match('arrowdown') ? true : false);
				};
			});

			// Backspace
			keyboard.shortcut(`backspace, delete`, e, (pressed: string) => {
				if (!readonly) {
					onBackspaceBlock(e, range, pressed, length, props);
				};
			});

			keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
				onArrowVertical(e, pressed, range, length, props);
			});

			keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
				onArrowHorizontal(e, text, pressed, range, length, props);
			});

			// Enter
			keyboard.shortcut('enter, shift+enter', e, (pressed: string) => {
				if (isInsideTable && (pressed == 'enter')) {
					onArrowVertical(e, Key.down, { from: length, to: length }, length, props);
				} else {
					onEnterBlock(e, range, pressed);
				};
			});

			// Tab, indent block
			keyboard.shortcut('indent, outdent', e, (pressed: string) => {
				if (isInsideTable) {
					onArrowHorizontal(e, text, pressed, { from: length, to: length }, length, props);
				} else {
					onTabBlock(e, range, pressed == 'outdent');
				};
			});

			// Last/first block
			keyboard.shortcut(`${cmd}+arrowup, ${cmd}+arrowdown`, e, (pressed: string) => {
				onCtrlArrowBlock(e, pressed);
			});

			// Page navigation
			keyboard.shortcut('pageup, pagedown', e, (pressed: string) => {
				onPageUpDown(e, pressed);
			});

			// Document start/end
			keyboard.shortcut(`${cmd}+home, ${cmd}+end, ctrl+home, ctrl+end`, e, (pressed: string) => {
				onCtrlHomeEnd(e, pressed);
			});

			// Move blocks with arrows
			keyboard.shortcut('moveSelectionUp, moveSelectionDown', e, (pressed: string) => {
				onCtrlShiftArrowBlock(e, pressed);
			});
		};
	};

	const getStyleParam = () => {
		return [
			{ key: 'turnBlock0', style: I.TextStyle.Paragraph },
			{ key: 'turnBlock1', style: I.TextStyle.Header1 },
			{ key: 'turnBlock2', style: I.TextStyle.Header2 },
			{ key: 'turnBlock3', style: I.TextStyle.Header3 },
			{ key: 'turnBlock4', style: I.TextStyle.Quote },
			{ key: 'turnBlock5', style: I.TextStyle.Callout },
			{ key: 'turnBlock6', style: I.TextStyle.Checkbox },
			{ key: 'turnBlock7', style: I.TextStyle.Bulleted },
			{ key: 'turnBlock8', style: I.TextStyle.Numbered },
			{ key: 'turnBlock9', style: I.TextStyle.Toggle },
		];
	};

	const onKeyUpBlock = (e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any) => {
	};

	// Indentation
	const onTabEditor = (e: any, ids: string[], pressed: string) => {
		e.preventDefault();
			
		const readonly = isReadonly();

		if (!ids.length || readonly) {
			return;
		};

		const shift = pressed == 'outdent';
		const first = S.Block.getLeaf(rootId, ids[0]);
		if (!first) {
			return;
		};

		const parent = S.Block.getParentLeaf(rootId, first.id);
		if (!parent) {
			return;
		};

		const parentElement = S.Block.getParentMapElement(rootId, first.id);
		if (!parentElement) {
			return;
		};

		const idx = parentElement.childrenIds.indexOf(first.id);
		const nextId = parentElement.childrenIds[idx - 1];
		const next = nextId ? S.Block.getLeaf(rootId, nextId) : S.Block.getNextBlock(rootId, first.id, -1);
		const obj = shift ? parent : next;
		const canTab = obj && !first.isTextTitle() && !first.isTextDescription() && obj.canHaveChildren() && first.isIndentable();
		
		if (canTab) {
			Action.move(rootId, rootId, obj.id, ids, (shift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), () => {
				if (next && next.isTextToggle()) {
					S.Block.toggle(rootId, next.id, true);
				};
			});
		};
	};

	// Move blocks with arrows
	const onCtrlShiftArrowEditor = (e: any, pressed: string) => {
		e.preventDefault();

		const selection = S.Common.getRef('selectionProvider');
		const dir = pressed == 'moveSelectionUp' ? -1 : 1;
		const ids = selection?.get(I.SelectType.Block, false) || [];

		if (!ids.length) {
			return;
		};

		const block = S.Block.getLeaf(rootId, dir > 0 ? ids[ids.length - 1] : ids[0]);
		if (!block) {
			return;
		};

		const next = S.Block.getNextBlock(rootId, block.id, dir, (it: any) => {
			return !it.isIcon() && !it.isTextTitle() && !it.isTextDescription() && !it.isFeatured() && !it.isSystem();
		});

		if (!next) {
			return;
		};

		const element = S.Block.getMapElement(rootId, block.id);
		const parentElement = S.Block.getParentMapElement(rootId, block.id);
		const nextElement = S.Block.getMapElement(rootId, next.id);
		const nextParent = S.Block.getParentLeaf(rootId, next.id);
		const nextParentElement = S.Block.getParentMapElement(rootId, next.id);

		if (!element || !parentElement || !nextElement || !nextParent || !nextParentElement) {
			return;
		};

		if (!parentElement.childrenIds.length) {
			return;
		};

		const first = parentElement.childrenIds[0];
		const last = parentElement.childrenIds[parentElement.childrenIds.length - 1];

		let position = dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		if ((dir > 0) && next.canHaveChildren() && nextElement.childrenIds.length) {
			position = (block.id == last) ? I.BlockPosition.Top : I.BlockPosition.InnerFirst;
		};
		if ((dir < 0) && nextParent.canHaveChildren() && nextParentElement.childrenIds.length && (element.parentId != nextParent.id)) {
			position = (block.id == first) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		};

		Action.move(rootId, rootId, next.id, ids, position, () => { 
			if (nextParent && nextParent.isTextToggle()) {
				S.Block.toggle(rootId, nextParent.id, true);
			};

			if (next && next.isTextToggle()) {
				S.Block.toggle(rootId, next.id, true);
			};

			selection.renderSelection(); 
			focus.scroll(isPopup, ids[0]);
		});
	};

	// Move blocks with arrows
	const onCtrlShiftArrowBlock = (e: any, pressed: string) => {
		e.preventDefault();

		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const dir = pressed == 'moveSelectionUp' ? -1 : 1;

		let next = S.Block.getNextBlock(rootId, block.id, dir, it => (
			!it.isIcon() && 
			!it.isTextTitle() && 
			!it.isTextDescription() && 
			!it.isFeatured() && 
			!it.isSystem() && 
			!it.isTable() &&
			!it.isTableColumn() &&
			!it.isTableRow() &&
			!S.Block.checkIsChild(rootId, block.id, it.id)
		));

		if (next && S.Block.checkIsInsideTable(rootId, next.id)) {
			next = S.Block.getNextBlock(rootId, block.id, dir, it => (
				it.isTable() && 
				!S.Block.checkIsChild(rootId, block.id, it.id)
			));
		};

		if (!next) {
			return;
		};

		const element = S.Block.getMapElement(rootId, block.id);
		const parentElement = S.Block.getParentMapElement(rootId, block.id);
		const nextElement = S.Block.getMapElement(rootId, next.id);
		const nextParent = S.Block.getParentLeaf(rootId, next.id);
		const nextParentElement = S.Block.getParentMapElement(rootId, next.id);

		if (!element || !parentElement || !nextElement || !nextParent || !nextParentElement) {
			return;
		};

		if (!parentElement.childrenIds.length) {
			return;
		};

		const first = parentElement.childrenIds[0];
		const last = parentElement.childrenIds[parentElement.childrenIds.length - 1];

		let position = dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		if ((dir > 0) && next.canHaveChildren() && nextElement.childrenIds.length) {
			position = (block.id == last) ? I.BlockPosition.Top : I.BlockPosition.InnerFirst;
		};
		if ((dir < 0) && nextParent.canHaveChildren() && nextParentElement.childrenIds.length && (element.parentId != nextParent.id)) {
			position = (block.id == first) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		};

		Action.move(rootId, rootId, next.id, [ block.id ], position, () => {
			if (nextParent && nextParent.isTextToggle()) {
				S.Block.toggle(rootId, nextParent.id, true);
			};

			if (next && next.isTextToggle()) {
				S.Block.toggle(rootId, next.id, true);
			};

			focus.apply(); 
			focus.scroll(isPopup, block.id);
		});
	};

	// Move focus to first/last block
	const onCtrlArrowBlock = (e: any, pressed: string) => {
		e.preventDefault();

		const dir = pressed.match(Key.up) ? -1 : 1;
		const next = S.Block.getFirstBlock(rootId, -dir, it => it.isFocusable());

		focusNextBlock(next, dir);
	};

	// Page up/down navigation
	const onPageUpDown = (e: any, pressed: string) => {
		e.preventDefault();

		const container = U.Common.getScrollContainer(isPopup);
		const containerHeight = container.height();
		const scrollTop = container.scrollTop();
		const dir = pressed.match(/up/i) ? -1 : 1;
		const scrollAmount = containerHeight * 0.9;
		const newScrollTop = Math.max(0, scrollTop + (dir * scrollAmount));

		container.scrollTop(newScrollTop);

		window.setTimeout(() => {
			const containerOffset = container.offset()?.top || 0;
			const targetY = dir < 0 ? (containerOffset + 100) : (containerOffset + containerHeight - 100);
			const blocks = S.Block.getBlocks(rootId, it => it.isFocusable());

			let closestBlock = null;
			let closestDistance = Infinity;

			for (const block of blocks) {
				const node = $(`.focusable.c${block.id}`);
				if (!node.length) {
					continue;
				};

				const rect = node.get(0).getBoundingClientRect();
				const blockY = rect.top + rect.height / 2;
				const distance = Math.abs(blockY - targetY);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestBlock = block;
				};
			};

			if (closestBlock) {
				focusNextBlock(closestBlock, dir);
			};
		}, 50);
	};

	// Ctrl+Home/End navigation to document start/end
	const onCtrlHomeEnd = (e: any, pressed: string) => {
		e.preventDefault();

		const dir = pressed.match(/home/i) ? -1 : 1;
		const next = S.Block.getFirstBlock(rootId, -dir, it => it.isFocusable());

		focusNextBlock(next, dir);
	};

	// Expand selection up/down
	const onShiftArrowEditor = (e: any, pressed: string) => {
		const selection = S.Common.getRef('selectionProvider');
		const dir = pressed.match(Key.up) ? -1 : 1;
		const ids = selection?.get(I.SelectType.Block, false) || [];
		const idsWithChildren = selection?.get(I.SelectType.Block, true) || [];

		if (ids.length == 1) {
			moveDir.current = dir;
		};

		let method = '';
		if (moveDir.current && (dir != moveDir.current)) {
			method = dir < 0 ? 'pop' : 'shift';
			ids[method]();
		} else {
			const idx = (dir < 0) ? 0 : idsWithChildren.length - 1;
			const next = S.Block.getNextBlock(rootId, idsWithChildren[idx], dir, it => !it.isSystem());

			method = dir < 0 ? 'unshift' : 'push';
			if (next) {
				ids[method](next.id);
				selection.scrollToElement(next.id, dir);
			};
		};

		selection.set(I.SelectType.Block, ids);
	};

	// Expand selection up/down
	const onShiftArrowBlock = (e: any, range: I.TextRange, length: number, pressed: string) => {
		const selection = S.Common.getRef('selectionProvider');
		const { focused } = focus.state;
		const dir = pressed.match(Key.up) ? -1 : 1;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block || menuCheck()) {
			return;
		};

		const win = $(window);
		const st = win.scrollTop();
		const element = $(`#block-${block.id}`);
		const value = element.find('#value');

		let sRect = U.Common.getSelectionRect();
		let vRect: any = {};
		if (value && value.length) {
			vRect = value.get(0).getBoundingClientRect();
		} else 
		if (element && element.length) {
			vRect = element.get(0).getBoundingClientRect();
		};

		if (!sRect) {
			sRect = vRect;
		};

		const lh = parseInt(value.css('line-height'));
		const sy = sRect.y + st;
		const vy = vRect.y + st;

		const cb = () => {
			e.preventDefault();

			focus.clear(true);
			selection.set(I.SelectType.Block, [ block.id ]);
			S.Menu.closeAll([ 'blockContext', 'blockAction' ]);
		};

		if ((dir < 0) && (sy - 4 <= vy) && (range.from == 0)) {
			cb();
		};

		if ((dir > 0) && (sy + sRect.height + lh >= vy + vRect.height) && (range.to == length)) {
			cb();
		};
	};

	// Markup
	const onMarkBlock = (e: any, type: I.MarkType, text: string, marks: I.Mark[], param: string, range: I.TextRange) => {
		e.preventDefault();

		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const rect = U.Common.getSelectionRect();
		const mark = Mark.getInRange(marks, type, range);
		const win = $(window);
		const menuParam: any = {
			classNameWrap: 'fromBlock',
			rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
			data: {
				rootId,
				blockId: block.id,
				blockIds: [ block.id ],
			},
		};
		const cb = () => {
			U.Data.blockSetText(rootId, block.id, text, marks, true, () => {
				focus.set(block.id, range);
				focus.apply(); 
			});
		};

		let menuId = '';
		let filter = '';
		let newType = null;

		if (mark) {
			filter = mark.param;
			newType = mark.type;
		} else {
			filter = block.getText().substring(range.from, range.to);
		};

		switch (type) {
			case I.MarkType.Link: {
				menuId = 'blockLink';
				menuParam.data = Object.assign(menuParam.data, {
					filter,
					type: newType,
					onChange: (newType: I.MarkType, param: string) => {
						marks = Mark.toggleLink({ type: newType, param, range }, marks);
						cb();
					}
				});
				break;
			};

			case I.MarkType.Color: {
				menuId = 'blockColor';
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						marks = Mark.toggle(marks, { type, param, range });
						cb();
					},
				});
				break;
			};

			case I.MarkType.BgColor: {
				menuId = 'blockBackground';
				menuParam.data = Object.assign(menuParam.data, {
					value: (mark ? mark.param : ''),
					onChange: (param: string) => {
						marks = Mark.toggle(marks, { type, param, range });
						cb();
					},
				});
				break;
			};
		};

		if (menuId) {
			S.Menu.close('blockContext', () => {
				window.setTimeout(() => S.Menu.open(menuId, menuParam), J.Constant.delay.menu);
			});
		} else {
			marks = Mark.toggle(marks, { type, param: mark ? '' : param, range });
			cb();
		};
	};

	// Backspace / Delete
	const onBackspaceBlock = (e: any, range: I.TextRange, pressed: string, length: number, props: any) => {
		const { isInsideTable } = props;
		const selection = S.Common.getRef('selectionProvider');
		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block || isInsideTable) {
			return;
		};

		const isDelete = pressed == 'delete';
		const ids = selection?.get(I.SelectType.Block, true) || [];

		if (block.isText()) {
			if (!isDelete && !range.to) {
				if (block.isTextList() || block.isTextQuote() || block.isTextCallout()) {
					C.BlockListTurnInto(rootId, [ block.id ], I.TextStyle.Paragraph);
				} else {
					ids.length ? blockRemove(block) : blockMerge(block, -1, length);
				};
			};

			if (isDelete && (range.from == range.to) && (range.to == length)) {
				ids.length ? blockRemove(block) : blockMerge(block, 1, length);
			};
		} else 
		if (!keyboard.isFocused) {
			blockRemove(block);
		};
	};

	// Indentation
	const onTabBlock = (e: any, range: I.TextRange, isShift: boolean) => {
		e.preventDefault();
			
		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const parent = S.Block.getParentLeaf(rootId, block.id);
		const parentElement = S.Block.getParentMapElement(rootId, block.id);

		if (!parent || !parentElement) {
			return;
		};

		const idx = parentElement.childrenIds.indexOf(block.id);
		const nextId = parentElement.childrenIds[idx - 1];
		const next = nextId ? S.Block.getLeaf(rootId, nextId) : S.Block.getNextBlock(rootId, block.id, -1);
		const obj = isShift ? parent : next;

		let canTab = obj && !block.isTextTitle() && obj.canHaveChildren() && block.isIndentable();
		if (!isShift && parentElement.childrenIds.length && (block.id == parentElement.childrenIds[0])) {
			canTab = false;
		};

		if (!canTab) {
			return;
		};

		Action.move(rootId, rootId, obj.id, [ block.id ], (isShift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), () => {
			if (isShift) {
				Action.move(rootId, rootId, block.id, parentElement.childrenIds.slice(idx), I.BlockPosition.Inner);
			};

			focus.setWithTimeout(block.id, { from: range.from, to: range.to }, 50);

			if (next && next.isTextToggle()) {
				S.Block.toggle(rootId, next.id, true);
			};
		});
	};

	// Split
	const onEnterBlock = (e: any, range: I.TextRange, pressed: string) => {
		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const isEnter = pressed == 'enter';
		const isShift = !!pressed.match('shift');
		const length = block.getLength();
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const replace = !range.to && block.isTextList() && !length;

		if (block.isTextCode() && isEnter) {
			return;
		};
		if (!block.isText() && keyboard.isFocused) {
			return;
		};
		if (block.isText() && !(block.isTextCode() || block.isTextCallout() || block.isTextQuote()) && isShift) {
			return;
		};

		if (menuCheck()) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();

		if (replace) {
			if (parent?.isTextList()) {
				onTabBlock(e, range, true);
			} else {
				C.BlockListTurnInto(rootId, [ block.id ], I.TextStyle.Paragraph, () => {
					C.BlockTextListClearStyle(rootId, [ block.id ]);
				});
			};
		} else
		if (!block.isText()) {
			blockCreate(block.id, I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});
		} else
		if (block.isTextToggle() && !Storage.checkToggle(rootId, block.id) && S.Block.getChildrenIds(rootId, block.id).length && !range.to) {
			blockCreate(block.id, I.BlockPosition.Top, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});
		} else {
			blockSplit(block, range, isShift);
		};
	};

	const menuCheck = () => {
		if (S.Menu.isOpen('onboarding', 'withDimmer')) {
			return true;
		};
		return S.Menu.isOpen('', '', [ 'blockContext', 'searchText', 'onboarding', 'publish' ]);
	};

	const onArrowVertical = (e: any, pressed: string, range: I.TextRange, length: number, props: any) => {
		if (menuCheck()) {
			return;
		};

		const { focused } = focus.state;
		const { isInsideTable } = props;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const dir = pressed.match(Key.up) ? -1 : 1;

		if ((dir < 0) && range.to) {
			return;
		};

		if ((dir > 0) && (range.to != length)) {
			return;
		};

		let next: I.Block = null;

		const cb = () => {
			if (!next) {
				// If block is closed toggle - find next block on the same level
				if (block && block.isTextToggle() && !Storage.checkToggle(rootId, block.id)) {
					next = S.Block.getNextBlock(rootId, focused, dir, it => (it.parentId != block.id) && it.isFocusable());
				} else {
					next = S.Block.getNextBlock(rootId, focused, dir, it => it.isFocusable());
				};
			};

			if (!next) {
				return;
			};

			e.preventDefault();

			const parent = S.Block.getHighestParent(rootId, next.id);

			// If highest parent is closed toggle, next is parent
			if (parent && parent.isTextToggle() && !Storage.checkToggle(rootId, parent.id)) {
				next = parent;
			};

			focusNextBlock(next, dir);
		};

		const parentElement = S.Block.getParentMapElement(rootId, block.id);
		if (!parentElement) {
			return;
		};

		const idx = parentElement.childrenIds.indexOf(block.id);

		// Check if there is empty table to fill when moving
		if (idx >= 0) {
			const nextChildId = parentElement.childrenIds[idx + dir];
			const next = S.Block.getLeaf(rootId, nextChildId);

			if (next && next.isTable()) {
				const tableData = S.Block.getTableData(rootId, next.id);

				if (tableData) {
					const rowContainerElement = S.Block.getMapElement(rootId, tableData.rowContainer.id);

					if (rowContainerElement) {
						const nextIdx = dir > 0 ? 0 : rowContainerElement.childrenIds.length - 1;
						const rowId = rowContainerElement.childrenIds[nextIdx];

						if (rowId) {
							C.BlockTableRowListFill(rootId, [ rowId ], cb);
							return;
						};
					};
				};
			};
		};

		if (isInsideTable) {
			const row = S.Block.getParentLeaf(rootId, block.id);
			const rowElement = S.Block.getParentMapElement(rootId, block.id);
			if (!rowElement) {
				return;
			};

			const idx = rowElement.childrenIds.indexOf(block.id);
			const nextRow = S.Block.getNextTableRow(rootId, row.id, dir);

			if ((idx >= 0) && nextRow) {
				const nextRowElement = S.Block.getMapElement(rootId, nextRow.id);
				C.BlockTableRowListFill(rootId, [ nextRow.id ], () => {
					if (nextRowElement) {
						next = S.Block.getLeaf(rootId, nextRowElement.childrenIds[idx]);
					};
					cb();
				});
			} else {
				const nextIdx = dir > 0 ? rowElement.childrenIds.length - 1 : 0;

				next = S.Block.getNextBlock(rootId, rowElement.childrenIds[nextIdx], dir, it => it.isFocusable());
				cb();
			};
		} else {
			cb();
		};
	};

	const onArrowHorizontal = (e: any, text: string, pressed: string, range: I.TextRange, length: number, props: any) => {
		const { focused } = focus.state;
		const { isInsideTable } = props;
		const block = S.Block.getLeaf(rootId, focused);
		const withTab = [ 'indent', 'outdent' ].includes(pressed);
		const isRtl = U.String.checkRtl(text);
		
		let dir = (pressed == 'outdent') || (pressed == Key.left) ? -1 : 1;
		if (isRtl) {
			dir = -dir;
		};

		if (!block) {
			return;
		};

		if (!withTab) {
			if ((dir < 0) && range.to) {
				return;
			};

			if ((dir > 0) && (range.to != length)) {
				return;
			};
		};

		const onVertical = () => {
			onArrowVertical(e, (dir < 0 ? 'arrowup' : 'arrowdown'), range, length, props);
		};

		if (isInsideTable) {
			const element = S.Block.getMapElement(rootId, block.id);
			const rowElement = S.Block.getParentMapElement(rootId, block.id);

			if (!rowElement) {
				return;
			};

			const idx = rowElement.childrenIds.indexOf(block.id);

			if (idx < 0) {
				return;
			};

			const fill = (id: string, callBack: () => void) => {
				C.BlockTableRowListFill(rootId, [ id ], callBack);
			};	

			const cb = () => {
				let nextCellId = '';

				if ((idx + dir >= 0) && (idx + dir <= rowElement.childrenIds.length - 1)) {
					nextCellId = rowElement.childrenIds[idx + dir];
				};

				if (!nextCellId) {
					const row = S.Block.getParentLeaf(rootId, block.id);
					const nextRow = S.Block.getNextTableRow(rootId, row.id, dir);

					if (nextRow) {
						const nextRowElement = S.Block.getMapElement(rootId, nextRow.id);
						fill(nextRow.id, () => {
							nextCellId = nextRowElement.childrenIds[dir > 0 ? 0 : nextRowElement.childrenIds.length - 1];
							focusNextBlock(S.Block.getLeaf(rootId, nextCellId), dir);
						});
					} else {
						onVertical();
					};
				};

				focusNextBlock(S.Block.getLeaf(rootId, nextCellId), dir);
			};

			if (rowElement.childrenIds.length - 1 <= idx) {
				fill(element.parentId, cb);
			} else {
				cb();
			};
		} else {
			if (block.isTextToggle()) {
				if ((dir < 0) && (range.to == 0)) {
					S.Block.toggle(rootId, block.id, false);
				};
				if ((dir > 0) && (range.to == length)) {
					S.Block.toggle(rootId, block.id, true);
				};
			};

			onVertical();
		};
	};

	const onSelectAll = () => {
		const selection = S.Common.getRef('selectionProvider');
		const { title, description, featured } = J.Constant.blockId;

		if (!selection) {
			return;
		};

		const all = S.Block.getBlocks(rootId, it => it.isSelectable()).map(it => it.id);
		
		let ids = selection.get(I.SelectType.Block, true);
		if (ids.length < all.length - 3) {
			ids = all;
		};
		if (!ids.includes(title)) {
			ids = [ title, description, featured ].concat(ids);
		} else {
			ids = ids.filter(id => ![ title, description, featured ].includes(id));
		};

		selection.set(I.SelectType.Block, ids);
		focus.clear(true);
		S.Menu.close('blockContext');
	};
	
	const onAdd = (e: any) => {
		if (!hoverId.current || (hoverPosition.current == I.BlockPosition.None)) {
			return;
		};
		
		const block = S.Block.getLeaf(rootId, hoverId.current);
		
		if (!block || (block.isTextTitle() && (hoverPosition.current != I.BlockPosition.Bottom)) || block.isLayoutColumn() || block.isIcon()) {
			return;
		};
		
		S.Common.filterSet(0, '');
		focus.clear(true);

		blockCreate(block.id, hoverPosition.current, { type: I.BlockType.Text }, (blockId: string) => {
			$(`.placeholder.c${blockId}`).text(translate('placeholderFilter'));
			onMenuAdd(blockId, '', { from: 0, to: 0 }, []);
		});
	};
	
	const onMenuAdd = (blockId: string, text: string, range: I.TextRange, marks: I.Mark[]) => {
		const { rootId } = props;
		const block = S.Block.getLeaf(rootId, blockId);
		const win = $(window);
		const rect = U.Common.getSelectionRect();

		if (!block) {
			return;
		};

		S.Common.filterSet(range.from, '');

		S.Menu.open('blockAdd', { 
			element: `#block-${blockId}`,
			classNameWrap: 'fromBlock',
			subIds: J.Menu.add,
			rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			offsetX: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? 0 : J.Size.blockMenu;
			},
			commonFilter: true,
			onClose: () => {
				focus.apply();
				S.Common.filterSet(0, '');
				$(`.placeholder.c${blockId}`).text(translate('placeholderBlock'));
			},
			data: {
				blockId,
				rootId,
				text,
				marks,
				blockCreate: blockCreate,
			},
		});
	};
	
	const onScroll = () => {
		const { rootId, isPopup } = props;
		const container = U.Common.getScrollContainer(isPopup);
		const top = container.scrollTop();

		Storage.setScroll('editor', rootId, top, isPopup);

		raf.cancel(frameScroll.current);
		frameScroll.current = raf(() => tocRef.current?.onScroll());

		Preview.previewHide(false);
	};
	
	const onCopy = (e: any, mode: I.ClipboardMode) => {
		const { rootId } = props;
		const selection = S.Common.getRef('selectionProvider');
		const readonly = isReadonly();
		const root = S.Block.getLeaf(rootId, rootId);
		const { focused, range } = focus.state;
		const isCut = mode == I.ClipboardMode.Cut;
		if (!root || (readonly && isCut)) {
			return;
		};

		let ids = selection?.get(I.SelectType.Block, true) || [];

		if (root.isLocked() && !ids.length) {
			return;
		};

		e.preventDefault();

		if (!ids.length) {
			if (range.from != range.to) {
				ids = [ focused ];
			};
		} else {
			ids = ids.concat(S.Block.getLayoutIds(rootId, ids));
		};

		if (isCut && (ids.length == 1) && (ids[0] == focused)) {
			focusSet(focused, range.from, range.from, false);
		};

		Action.copyBlocks(rootId, ids, mode);
	};

	const onPasteEvent = (e: any, props: any, data?: any) => {
		const { isPopup } = props;

		if (isPopup !== keyboard.isPopup()) {
			return;
		};

		if (keyboard.isPasteDisabled || isReadonly()) {
			return;
		};

		S.Menu.closeAll([ 'blockAdd' ]);

		if (!data) {
			data = getClipboardData(e);
		};

		// Priorize HTML content
		const hasHtml = data && data.html;
		
		if (hasHtml) {
			e.preventDefault();
			onPaste(data);
		} else {
			const clipboardItems = (e.clipboardData || e.originalEvent.clipboardData).items;
			const files = U.Common.getDataTransferFiles(clipboardItems);

			if (files.length && !data.files.length) {
				U.Common.saveClipboardFiles(files, data, data => onPasteEvent(e, props, data));
			} else {
				e.preventDefault();
				onPaste(data);
			};
		};
	};

	const onPaste = (data: any) => {
		data.anytype = data.anytype || {};
		data.anytype.range = data.anytype.range || { from: 0, to: 0 };

		const { focused, range } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);
		const selection = S.Common.getRef('selectionProvider');
		const urls = U.String.getUrlsFromText(data.text);

		if (urls.length && (urls[0].value == data.text) && block && !block.isTextTitle() && !block.isTextDescription() && !block.isTextCode()) {
			onPasteUrl(urls[0]);
			return;
		};

		let id = '';
		let from = 0;
		let to = 0;

		keyboard.disablePaste(true);

		C.BlockPaste(rootId, focused, range, selection?.get(I.SelectType.Block, true) || [], data.anytype.range.to > 0, { ...data, anytype: data.anytype.blocks }, '', (message: any) => {
			keyboard.disablePaste(false);

			if (message.error.code) {
				return;
			};

			let count = 1;

			if (message.isSameBlockCaret) {
				id = focused;
			} else 
			if (message.blockIds && message.blockIds.length) {
				count = message.blockIds.length;

				message.blockIds.forEach((id: string) => {
					const block = S.Block.getLeaf(rootId, id);

					if (block && block.isTextToggle()) {
						S.Block.toggle(rootId, block.id, true);
					};
				});

				const lastId = message.blockIds[count - 1];
				const block = S.Block.getLeaf(rootId, lastId);
				
				if (!block) {
					return;
				};
				
				id = block.id;
				from = to = block.getLength();

				keyboard.setFocus(false);
			} else 
			if (message.caretPosition >= 0) {
				id = focused;
				from = to = message.caretPosition;
			};

			focusSet(id, from, to, true);
			analytics.event('PasteBlock', { count });
		});
	};

	const onPasteUrl = (item: any) => {
		const { isLocal } = item;
		const url = item.value;
		const { focused, range } = focus.state;
		const currentFrom = range.from;
		const currentTo = range.to;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const marks = U.Common.objectCopy(block.content.marks || []);
		const currentMark = Mark.getInRange(marks, I.MarkType.Link, range, [ I.MarkOverlap.Left, I.MarkOverlap.Right ]);

		if (currentTo && (currentFrom != currentTo) && !currentMark) {
			marks.push({ type: I.MarkType.Link, range, param: url });

			U.Data.blockSetText(rootId, block.id, block.content.text, marks, true, () => {
				focus.set(block.id, { from: currentFrom, to: currentTo });
				focus.apply();
			});
			return;
		};

		const isInsideTable = S.Block.checkIsInsideTable(rootId, block.id);
		const win = $(window);
		const length = block.getLength();
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace;
		const processor = U.Embed.getProcessorByUrl(url);
		const canBlock = !isInsideTable && !isLocal;

		const options: any[] = [
			!currentMark ? { id: 'link', name: translate('editorPagePasteLink') } : null,
			canBlock ? { id: 'block', name: translate('editorPageCreateBookmark') } : null,
			{ id: 'cancel', name: translate('editorPagePasteText') },
		].filter(it => it);

		if (processor !== null) {
			options.push({ id: 'embed', name: translate('editorPagePasteEmbed') });
		};

		S.Common.clearTimeout('blockContext');

		const menuParam = { 
			component: 'select',
			element: `#block-${focused}`,
			recalcRect: () => { 
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null; 
			},
			offsetX: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? 0 : J.Size.blockMenu;
			},
			onOpen: () => {
				if (block) {
					window.setTimeout(() => {
						focus.set(block.id, { from: currentFrom, to: currentTo });
						focus.apply();
					});
				};
			},
			data: {
				value: '',
				options,
				onSelect: (event: any, item: any) => {
					let marks = U.Common.objectCopy(block.content.marks || []);
					let value = block.content.text;
					let to = 0;

					switch (item.id) {
						case 'link': {
							if (currentFrom == currentTo) {
								value = U.String.insert(value, url + ' ', currentFrom, currentFrom);
								marks = Mark.adjust(marks, currentFrom - 1, url.length + 1);

								to = currentFrom + url.length;
							} else {
								to = currentTo;
							};
							
							marks.push({ type: I.MarkType.Link, range: { from: currentFrom, to }, param: url });

							U.Data.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;
						};

						case 'block': {
							const bookmark = S.Record.getBookmarkType();

							C.BlockBookmarkCreateAndFetch(rootId, focused, position, url, bookmark?.defaultTemplateId, (message: any) => {
								if (!message.error.code) {
									blockCreate(message.blockId, I.BlockPosition.Bottom, { type: I.BlockType.Text });

									analytics.event('CreateBlock', { middleTime: message.middleTime, type: I.BlockType.Bookmark });
								};
							});
							break;
						};

						case 'cancel': {
							value = U.String.insert(block.content.text, url + ' ', currentFrom, currentFrom);
							to = currentFrom + url.length;

							U.Data.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;
						};

						case 'embed': {
							if (processor !== null) {
								blockCreate(block.id, position, { type: I.BlockType.Embed, content: { processor, text: url } }, (blockId: string) => {
									blockCreate(blockId, I.BlockPosition.Bottom, { type: I.BlockType.Text });
									$(`#block-${blockId} .preview`).trigger('click');
								});
							};
							break;
						};

					};
				},
			}
		};

		keyboard.disableContext(true);
		S.Menu.closeAll([ 'blockContext', 'blockAdd', 'blockAction' ], () => {
			S.Menu.open('selectPasteUrl', menuParam);
			keyboard.disableContext(false);
		});
	};

	const getClipboardData = (e: any) => {
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const data: any = {
			text: U.String.normalizeLineEndings(String(cb.getData('text/plain') || '')),
			html: String(cb.getData('text/html') || ''),
			anytype: JSON.parse(String(cb.getData('application/json') || '{}')),
			files: [],
		};
		data.anytype.range = data.anytype.range || { from: 0, to: 0 };
		return data;
	};

	const onHistory = (e: any) => {
		U.Object.openAuto({ layout: I.ObjectLayout.History, id: rootId });
	};

	const blockCreate = (blockId: string, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) => {
		C.BlockCreate(rootId, blockId, position, param, (message: any) => {
			if (param.type == I.BlockType.Text) {
				focusSet(message.blockId, 0, 0, true);
			};

			callBack?.(message.blockId);

			const event: any = {
				middleTime: message.middleTime,
				type: param.type,
				style: param.content?.style,
				params: {},
			};

			if (param.type == I.BlockType.File) {
				event.params.fileType = param.content.type;
			};

			if (param.type == I.BlockType.Embed) {
				event.params.processor = param.content.processor;
			};

			if (param.type == I.BlockType.Dataview) {
				event.id = param.content.isCollection ? 'Collection' : 'Set';
			};

			analytics.event('CreateBlock', event);
		});
	};
	
	const blockMerge = (focused: I.Block, dir: number, length: number) => {
		const { rootId } = props;
		const next = S.Block.getNextBlock(rootId, focused.id, dir, it => it.isFocusable());
		if (!next) {
			return;
		};

		let blockId = '';
		let targetId = '';
		let to = 0;

		if (dir < 0) {
			blockId = next.id;
			targetId = focused.id;
			to = next.getLength();
		} else {
			blockId = focused.id;
			targetId = next.id;
			to = length;
		};

		const cb = (message: any) => {
			if (message.error.code) {
				return;
			};

			if (next) {
				focusSet(blockId, to, to, true);
			};

			analytics.event('DeleteBlock', { count: 1 });
		};

		if (next.isText()) {
			C.BlockMerge(rootId, blockId, targetId, cb);
		} else 
		if (!length) {
			focus.clear(true);
			C.BlockListDelete(rootId, [ focused.id ], cb);
		} else {
			C.BlockListDelete(rootId, [ next.id ], (message: any) => {
				if (message.error.code) {
					return;
				};

				if (dir < 0) {
					const next = S.Block.getNextBlock(rootId, focused.id, -1, it => it.isFocusable());
					if (next) {
						const nl = dir < 0 ? next.getLength() : 0;
						focusSet(next.id, nl, nl, false);
					};
				};
			});
		};
	};
	
	const blockSplit = (focused: I.Block, range: I.TextRange, isShift: boolean) => {
		const { content } = focused;
		const isTitle = focused.isTextTitle();
		const isToggle = focused.isTextToggle();
		const isCallout = focused.isTextCallout();
		const isQuote = focused.isTextQuote();
		const isList = focused.isTextList();
		const isCheckbox = focused.isTextCheckbox();
		const isCode = focused.isTextCode();
		const isOpen = Storage.checkToggle(rootId, focused.id);
		const childrenIds = S.Block.getChildrenIds(rootId, focused.id);
		const length = focused.getLength();

		let style = I.TextStyle.Paragraph;
		let mode = I.BlockSplitMode.Bottom;

		if (isList || (!isTitle && ((range.from != length) || (range.to != length)))) {
			if (isCheckbox && !range.to) {
				style = content.style;
			} else {
				style = range.to ? content.style : I.TextStyle.Paragraph;
			};
			mode = range.to ? I.BlockSplitMode.Bottom : I.BlockSplitMode.Top;
		};

		if (isCode || (isToggle && isOpen)) {
			style = I.TextStyle.Paragraph;
		};

		if (isToggle && isOpen) {
			mode = I.BlockSplitMode.Inner;
		};

		if (!isToggle && !isOpen && (childrenIds.length > 0)) {
			mode = I.BlockSplitMode.Top;
		};

		if ((isCallout || isQuote) && !isShift) {
			mode = I.BlockSplitMode.Inner;
			style = I.TextStyle.Paragraph;
		};

		C.BlockSplit(rootId, focused.id, range, style, mode, (message: any) => {
			if (message.error.code) {
				return;
			};

			const focusId = (mode == I.BlockSplitMode.Top) ? focused.id : message.blockId;
			focusSet(focusId, 0, 0, true);

			if (isToggle && isOpen) {
				S.Block.toggle(rootId, message.blockId, true);
			};

			const text = focused.getText();
			const isRtl = U.String.checkRtl(text);

			if (isRtl) {
				U.Data.setRtl(rootId, S.Block.getLeaf(rootId, message.blockId), true);
			};

			analytics.event('CreateBlock', { middleTime: message.middleTime, type: I.BlockType.Text, style });
		});
	};
	
	const blockRemove = (focused?: I.Block) => {
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		S.Menu.closeAll();
		S.Popup.closeAll([ 'preview' ]);

		let blockIds = [];
		if (ids.length) {
			blockIds = [ ...ids ];
		} else 
		if (focused) {
			blockIds = [ focused.id ];
		};

		blockIds = blockIds.filter(id => {  
			const block = S.Block.getLeaf(rootId, id);
			return block && block.isDeletable();
		});

		if (!blockIds.length) {
			return;
		};

		focus.clear(true);

		let next = S.Block.getNextBlock(rootId, blockIds[0], -1, it => it.isFocusable());

		C.BlockListDelete(rootId, blockIds, (message: any) => {
			if (message.error.code || !next) {
				return;
			};

			const parent = S.Block.getHighestParent(rootId, next.id);

			// If highest parent is closed toggle, next is parent
			if (parent && parent.isTextToggle() && !Storage.checkToggle(rootId, parent.id)) {
				next = parent;
			};

			const length = next.getLength();
			focusSet(next.id, length, length, true);

			selection.clear();
		});
	};
	
	const onLastClick = (e: any) => {
		const readonly = isReadonly();

		if (readonly) {
			return;
		};

		let last = S.Block.getFirstBlock(rootId, -1, it => it.canCreateBlock());
		let create = false;
		let length = 0;

		if (last) {
			const parent = S.Block.getParentLeaf(rootId, last.id);

			if (parent && !parent.isLayoutDiv() && !parent.isPage()) {
				last = null;
			};
		};

		if (!last) {
			create = true;
		} else {
			if (!last.isText() || last.isTextCode() || last.isTextCallout()) {
				create = true;
			} else {
				length = last.getLength();
				if (length) {
					create = true;
				};
			};
		};

		if (create) {
			blockCreate('', I.BlockPosition.Bottom, { type: I.BlockType.Text });
		} else {
			focusSet(last.id, length, length, true);
		};
	};
	
	const resizePage = (callBack?: () => void) => {
		raf.cancel(frameResize.current);
		frameResize.current = raf(() => {
			const node = $(nodeRef.current);
			const blocks = node.find('.blocks');
			const last = node.find('#blockLast');
			const scrollContainer = U.Common.getScrollContainer(isPopup);

			setLayoutWidth(U.Data.getLayoutWidth(rootId));

			if (blocks.length && last.length && scrollContainer.length) {
				last.css({ height: '' });

				const ct = scrollContainer.offset().top;
				const ch = scrollContainer.height();
				const bt = blocks.offset().top;
				const bh = blocks.outerHeight();

				let height = ch - ct - bt - bh;

				if (bh > ch) {
					height = Math.max(ch / 2, height);
				};

				height = Math.max(J.Size.lastBlock, height);
				last.css({ height });
			};

			callBack?.();
		});
	};

	const focusSet = (id: string, from: number, to: number, scroll: boolean) => {
		window.setTimeout(() => {
			focus.set(id, { from, to });
			focus.apply();

			if (scroll) {
				focus.scroll(isPopup, id);
			};
		}, 15);
	};

	const focusNextBlock = (next: I.Block, dir: number) => {
		if (!next) {
			return;
		};

		const from = dir > 0 ? 0 : next.getLength();
		focusSet(next.id, from, from, true);
	};

	const setLayoutWidth = (v: number) => {
		v = Number(v) || 0;

		const node = $(nodeRef.current);
		const width = getWidth(v);
		const elements = node.find('#elements');

		node.css({ width });
		elements.css({ width, marginLeft: width / 2 });

		if (headerRef.current && headerRef.current.refDrag) {
			headerRef.current.refDrag.setValue(v);
			headerRef.current.setPercent(v);
		};

		$('.resizable').trigger('resizeInit');
	};

	const getWidth = (weight: number) => {
		weight = Number(weight) || 0;

		const container = U.Common.getPageContainer(isPopup);
		const width = Math.min(container.width() - 96, (1 + weight) * J.Size.editor);

		return Math.max(300, width);
	};

	const isReadonly = () => {
		if (isDeleted) {
			return true;
		};

		const allowed = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
		if (!allowed) {
			return true;
		};

		const root = S.Block.getLeaf(rootId, rootId);
		if (!root || root.isLocked()) {
			return true;
		};

		const object = S.Detail.get(rootId, rootId, [ 'isArchived', 'isDeleted' ], true);
		if (object.isArchived || object.isDeleted) {
			return true;
		};

		return false;
	};

	const width = U.Data.getLayoutWidth(rootId);
	const readonly = isReadonly();

	return (
		<div 
			ref={nodeRef} 
			id="editorWrapper"
			className="editorWrapper"
		>
			<EditorControls 
				ref={controlsRef} 
				key="editorControls" 
				{...props} 
				resize={resizePage} 
				readonly={readonly}
				onLayoutSelect={focusInit} 
			/>
			
			<div id={`editor-${rootId}`} className="editor">
				<div className="blocks">
					<Icon id="button-block-add" className="buttonAdd" onClick={onAdd} />

					<PageHeadEditor 
						{...props} 
						ref={ref => headerRef.current = ref}
						onKeyDown={onKeyDownBlock}
						onKeyUp={onKeyUpBlock}  
						onMenuAdd={onMenuAdd}
						onPaste={onPasteEvent}
						setLayoutWidth={setLayoutWidth}
						readonly={readonly}
						getWrapperWidth={getWrapperWidth}
					/>

					<Children 
						{...props}
						onKeyDown={onKeyDownBlock}
						onKeyUp={onKeyUpBlock}  
						onMenuAdd={onMenuAdd}
						onCopy={onCopy}
						onPaste={onPasteEvent}
						readonly={readonly}
						blockRemove={blockRemove}
						getWrapperWidth={getWrapperWidth}
					/>
				</div>

				<TableOfContents ref={tocRef} {...props} />
				
				<DropTarget rootId={rootId} id="blockLast" dropType={I.DropType.Block} canDropMiddle={false}>
					<div id="blockLast" className="blockLast" onClick={onLastClick} />
				</DropTarget>
			</div>
		</div>
	);
	
}));

export default EditorPage;