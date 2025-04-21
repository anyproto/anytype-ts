import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { Icon, Loader, Deleted, DropTarget, EditorControls } from 'Component';
import { I, C, S, U, J, Key, Preview, Mark, focus, keyboard, Storage, Action, translate, analytics, Renderer, sidebar } from 'Lib';
import PageHeadEditor from 'Component/page/elements/head/editor';
import Children from 'Component/page/elements/children';

interface Props extends I.PageComponent {
	onOpen?(): void;
};

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const THROTTLE = 50;
const BUTTON_OFFSET = 10;

const EditorPage = observer(class EditorPage extends React.Component<Props, State> {
	
	_isMounted = false;
	node: any = null;
	id = '';
	hoverId = '';
	hoverPosition: I.BlockPosition = I.BlockPosition.None;
	winScrollTop = 0;
	containerScrollTop = 0;
	uiHidden = false;
	width = 0;
	refHeader: any = null;
	refControls: any = null;
	buttonAdd = null;
	blockFeatured = null;
	container = null;
	containerRect = null;
	dir = 0;

	state = {
		isLoading: false,
		isDeleted: false,
	};

	timeoutMove = 0;
	timeoutScreen = 0;
	timeoutLoading = 0;
	timeoutScroll = 0;

	frameMove = 0;
	frameResize = 0;

	constructor (props: Props) {
		super(props);
		
		this.onKeyDownBlock = this.onKeyDownBlock.bind(this);
		this.onKeyUpBlock = this.onKeyUpBlock.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMenuAdd = this.onMenuAdd.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onPasteEvent = this.onPasteEvent.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onLastClick = this.onLastClick.bind(this);
		this.blockCreate = this.blockCreate.bind(this);
		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.resizePage = this.resizePage.bind(this);
		this.focusInit = this.focusInit.bind(this);
		this.blockRemove = this.blockRemove.bind(this);
		this.setLayoutWidth = this.setLayoutWidth.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { isLoading, isDeleted } = this.state;
		const root = S.Block.getLeaf(rootId, rootId);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (isLoading) {
			return <Loader id="loader" />;
		};

		if (!root) {
			return null;
		};
		
		const width = U.Data.getLayoutWidth(rootId);
		const readonly = this.isReadonly();

		return (
			<div 
				ref={node => this.node = node} 
				id="editorWrapper"
				className="editorWrapper"
			>
				<EditorControls 
					ref={ref => this.refControls = ref} 
					key="editorControls" 
					{...this.props} 
					resize={this.resizePage} 
					readonly={readonly}
					onLayoutSelect={this.focusInit} 
				/>
				
				<div id={`editor-${rootId}`} className="editor">
					<div className="blocks">
						<Icon id="button-block-add" className="buttonAdd" onClick={this.onAdd} />

						<PageHeadEditor 
							{...this.props} 
							ref={ref => this.refHeader = ref}
							onKeyDown={this.onKeyDownBlock}
							onKeyUp={this.onKeyUpBlock}  
							onMenuAdd={this.onMenuAdd}
							onPaste={this.onPasteEvent}
							setLayoutWidth={this.setLayoutWidth}
							readonly={readonly}
							getWrapperWidth={this.getWrapperWidth}
						/>

						<Children 
							{...this.props}
							onKeyDown={this.onKeyDownBlock}
							onKeyUp={this.onKeyUpBlock}  
							onMenuAdd={this.onMenuAdd}
							onCopy={this.onCopy}
							onPaste={this.onPasteEvent}
							readonly={readonly}
							blockRemove={this.blockRemove}
							getWrapperWidth={this.getWrapperWidth}
						/>
					</div>
					
					<DropTarget rootId={rootId} id="blockLast" dropType={I.DropType.Block} canDropMiddle={false}>
						<div id="blockLast" className="blockLast" onClick={this.onLastClick} />
					</DropTarget>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		this.resizePage();
		this.rebind();
		this.open();
		this.initNodes();
	};

	componentDidUpdate () {
		const { rootId, isPopup } = this.props;
		const node = $(this.node);
		const resizable = node.find('.resizable');
		
		this.open();
		this.resizePage();
		this.checkDeleted();
		this.initNodes();
		this.rebind();

		focus.apply();
		S.Block.updateNumbers(rootId);
		sidebar.resizePage(null, null, false);

		if (resizable.length) {
			resizable.trigger('resizeInit');
		};

		U.Common.getScrollContainer(isPopup).scrollTop(this.containerScrollTop);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.uiHidden = false;
		this.unbind();
		this.close();

		focus.clear(false);

		window.clearInterval(this.timeoutScreen);
		window.clearTimeout(this.timeoutLoading);
		window.clearTimeout(this.timeoutMove);
	};

	initNodes () {
		const node = $(this.node);

		this.container = node.find('.editor');
		this.buttonAdd = node.find('#button-block-add');
		this.blockFeatured = node.find(`#block-${J.Constant.blockId.featured}`);
	};

	getWrapperWidth (): number {
		return this.getWidth(U.Data.getLayoutWidth(this.props.rootId));
	};

	checkDeleted () {
		const { rootId } = this.props;
		const { isDeleted } = this.state;

		if (isDeleted) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, []);

		if (object.isDeleted) {
			this.setState({ isDeleted: true });
		};
	};

	open () {
		const { rootId, onOpen, isPopup } = this.props;

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isDeleted: false });

		window.clearTimeout(this.timeoutLoading);
		this.timeoutLoading = window.setTimeout(() => this.setLoading(true), 50);

		S.Block.clear(this.props.rootId);

		C.ObjectOpen(this.id, '', U.Router.getRouteSpaceId(), (message: any) => {
			window.clearTimeout(this.timeoutLoading);
			this.setLoading(false);

			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true });
				return;
			};

			this.focusInit();

			if (onOpen) {
				onOpen();
			};

			if (this.refControls) {
				this.refControls.forceUpdate();
			};

			this.resizePage(() => {
				this.containerScrollTop = Storage.getScroll('editor', rootId, isPopup);
				if (this.containerScrollTop) {
					U.Common.getScrollContainer(isPopup).scrollTop(this.containerScrollTop);
				};
			});
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup } = this.props;
		const match = keyboard.getMatch(isPopup);

		let close = true;
		if (isPopup && (match?.params?.id == this.id)) {
			close = false;
		};

		if (close) {
			Action.pageClose(this.id, true);
		};

		Storage.setFocus(this.id, focus.state);
	};

	onCommand (cmd: string, arg: any) {
		const { rootId, isPopup } = this.props;
		const { focused, range } = focus.state;
		const popupOpen = S.Popup.isOpen('', [ 'page' ]);
		const menuOpen = this.menuCheck();

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
					this.onSelectAll();
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
						this.onPaste({ text });
					};
				})();
				break;
			};
		};
	};
	
	focusInit () {
		if (this.isReadonly()) {
			return;
		};

		const { rootId, isPopup } = this.props;
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
	
	unbind () {
		const { isPopup } = this.props;
		const ns = `editor${U.Common.getEventNamespace(isPopup)}`;
		const container = U.Common.getScrollContainer(isPopup);
		const events = [ 'keydown', 'mousemove', 'paste', 'resize', 'focus' ];

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		container.off(`scroll.${ns}`);
		Renderer.remove(`commandEditor`);
	};

	rebind () {
		const { isPopup } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const ns = `editor${U.Common.getEventNamespace(isPopup)}`;
		const container = U.Common.getScrollContainer(isPopup);
		const isReadonly = this.isReadonly();

		this.unbind();

		if (!isReadonly) {
			win.on(`mousemove.${ns}`, throttle(e => this.onMouseMove(e), THROTTLE));
		};

		win.on(`keydown.${ns}`, e => this.onKeyDownEditor(e));
		win.on(`paste.${ns}`, (e: any) => {
			if (!keyboard.isFocused) {
				this.onPasteEvent(e, this.props);
			};
		});

		win.on(`focus.${ns}`, () => {
			const popupOpen = S.Popup.isOpen('', [ 'page' ]);
			const menuOpen = this.menuCheck();
			const ids = selection?.get(I.SelectType.Block, true) || [];
			
			if (!ids.length && !menuOpen && !popupOpen) {
				focus.restore();
				raf(() => focus.apply());
			};

			container.scrollTop(this.containerScrollTop);
		});

		win.on(`resize.${ns}`, () => this.resizePage());
		container.on(`scroll.${ns}`, e => this.onScroll());

		Renderer.on(`commandEditor`, (e: any, cmd: string, arg: any) => this.onCommand(cmd, arg));
	};
	
	onMouseMove (e: any) {
		if (
			!this._isMounted || 
			!this.buttonAdd.length || 
			!this.container.length
		) {
			return;
		};
		
		const { isLoading } = this.state;
		const { rootId } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const readonly = this.isReadonly();
		const node = $(this.node);
		const menuOpen = this.menuCheck();
		const popupOpen = S.Popup.isOpen('', [ 'page' ]);

		const clear = () => {
			node.find('.block.showMenu').removeClass('showMenu');
			node.find('.block.isAdding').removeClass('isAdding top bottom');
		};

		const out = () => {
			window.clearTimeout(this.timeoutMove);
			this.timeoutMove = window.setTimeout(() => {
				this.buttonAdd.removeClass('show');
				clear();
			}, 30);
		};

		if (
			readonly || 
			keyboard.isResizing || 
			keyboard.isDragging || 
			selection?.isSelecting() || 
			menuOpen || 
			popupOpen ||
			isLoading
		) {
			out();
			return;
		};

		const { pageX, pageY } = e;
		const blocks = S.Block.getBlocks(rootId, it => it.canCreateBlock());

		let offset = 140;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, height: 0 };

		if (this.blockFeatured.length) {
			offset = this.blockFeatured.offset().top + this.blockFeatured.outerHeight() - BUTTON_OFFSET;
		};

		for (const block of blocks) {
			const obj = $(`#block-${block.id}`);
			if (!obj.length || obj.hasClass('noPlus')) {
				continue;
			};

			const rect = obj.get(0).getBoundingClientRect() as DOMRect;

			rect.y += this.winScrollTop;

			if (block.isDataview()) {
				rect.height = 88;
			};

			if ((pageX >= rect.x) && (pageX <= rect.x + rect.width) && (pageY >= rect.y) && (pageY <= rect.y + rect.height)) {
				this.hoverId = block.id;
				hovered = obj;
				hoveredRect = rect;
			};
		};

		const { x, y, height } = hoveredRect;
		
		if (this.frameMove) {
			raf.cancel(this.frameMove);
		};

		if (keyboard.isDragging) {
			out();
			
			if (hovered) {
				hovered.addClass('showMenu');
			};
			return;
		};

		this.hoverPosition = I.BlockPosition.None;

		let rectContainer = null;
		if (hovered) {
			rectContainer = (this.container.get(0) as Element).getBoundingClientRect() as DOMRect;

			if (
				(pageX >= x) && 
				(pageX <= x + J.Size.blockMenu) && 
				(pageY >= offset + BUTTON_OFFSET) && 
				(pageY <= this.winScrollTop + rectContainer.height + offset + BUTTON_OFFSET)
			) {
				this.hoverPosition = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			};
		};

		this.frameMove = raf(() => {
			if (this.hoverPosition == I.BlockPosition.None) {
				out();
				return;
			};

			const buttonX = hoveredRect.x - (rectContainer.x - J.Size.blockMenu) + 2;
			const buttonY = pageY - rectContainer.y - BUTTON_OFFSET - this.winScrollTop;
			
			clear();
			this.buttonAdd.addClass('show').css({ transform: `translate3d(${buttonX}px,${buttonY}px,0px)` });
			hovered.addClass('showMenu');

			if (pageX <= x + 20) {
				hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
			};
		});
	};
	
	onKeyDownEditor (e: any) {
		const { rootId, isPopup } = this.props;

		if (isPopup !== keyboard.isPopup()) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const menuOpen = this.menuCheck();
		const popupOpen = S.Popup.isOpenKeyboard();
		const root = S.Block.getLeaf(rootId, rootId);

		if (keyboard.isFocused || !selection || !root) {
			return;
		};

		Preview.previewHide(true);
		
		const ids = selection.get(I.SelectType.Block);
		const idsWithChildren = selection.get(I.SelectType.Block, true);
		const cmd = keyboard.cmdKey();
		const readonly = this.isReadonly();
		const styleParam = this.getStyleParam();

		let ret = false;

		// Select all
		keyboard.shortcut('selectAll', e, () => {
			if (popupOpen || menuOpen) {
				return;
			};

			e.preventDefault();
			this.onSelectAll();

			ret = true;
		});

		// Copy/Cut
		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
			this.onCopy(e, pressed.match('x') ? true : false);

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
			this.onHistory(e);

			ret = true;
		});

		// Expand selection
		keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
			this.onShiftArrowEditor(e, pressed);

			ret = true;
		});

		if (idsWithChildren.length) {
			// Mark-up

			let type = null;
			let param = '';

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, () => {
					type = item.type;
					param = item.param;

					ret = true;
				});
			};

			if (!readonly && (type !== null)) {
				e.preventDefault();

				if (type == I.MarkType.Link) {
					S.Menu.open('blockLink', {
						element: `#block-${ids[0]}`,
						horizontal: I.MenuDirection.Center,
						data: {
							filter: '',
							onChange: (newType: I.MarkType, param: string) => {
								C.BlockTextListSetMark(rootId, idsWithChildren, { type: newType, param, range: { from: 0, to: 0 } }, () => {
									analytics.event('ChangeTextStyle', { type: newType, count: idsWithChildren.length });
								});
							},
						},
					});
				} else {
					C.BlockTextListSetMark(rootId, idsWithChildren, { type, param, range: { from: 0, to: 0 } }, () => {
						analytics.event('ChangeTextStyle', { type, count: idsWithChildren.length });
					});
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
						offsetX: J.Size.blockMenu,
						data: {
							blockId: ids[0],
							blockIds: ids,
							rootId,
							onCopy: this.onCopy,
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
				this.onCtrlShiftArrowEditor(e, pressed);

				ret = true;
			});
		};

		// Remove blocks
		keyboard.shortcut('backspace, delete', e, () => {
			if (!readonly) {
				e.preventDefault();
				this.blockRemove();
			};

			ret = true;
		});

		// Indent block
		keyboard.shortcut('indent, outdent', e, (pressed: string) => {
			this.onTabEditor(e, ids, pressed);

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
			this.blockCreate(focused , I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});

			ret = true;
		});

		if (!ret && ids.length && !keyboard.isSpecial(e)) {
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

	onKeyDownBlock (e: any, text: string, marks: I.Mark[], range: any, props: any) {
		range = range || {};

		const { rootId } = this.props;
		const { isInsideTable } = props;
		const { focused } = focus.state;
		const selection = S.Common.getRef('selectionProvider');
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const readonly = this.isReadonly();
		const styleParam = this.getStyleParam();
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
				this.onArrowVertical(e, Key.up, range, length, props);
			});

			// Next string
			keyboard.shortcut('ctrl+n', e, (pressed: string) => {
				this.onArrowVertical(e, Key.down, range, length, props);
			});
		};

		if (block.isText()) {

			// Select all
			keyboard.shortcut('selectAll', e, (pressed: string) => {
				if ((range.from == 0) && (range.to == length)) {
					e.preventDefault();
					this.onSelectAll();
				} else {
					focus.set(block.id, { from: 0, to: length });
					focus.apply();
				};
			});

			// Copy/Cut
			keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
				this.onCopy(e, pressed.match('x') ? true : false);
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
				keyboard.onSearchMenu(text.substring(range.from, range.to), 'editor');
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
			this.onHistory(e);
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
					offsetX: J.Size.blockMenu,
					data: {
						blockId: block.id,
						blockIds: selection.getForClick(block.id, true, true),
						rootId,
						onCopy: this.onCopy,
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
			let param = '';

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, (pressed: string) => {
					type = item.type;
					param = item.param;
				});
			};

			if (type !== null) {
				this.onMarkBlock(e, type, text, marks, param, range);
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

		if (!this.menuCheck()) {
			// Expand selection
			keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
				this.onShiftArrowBlock(e, range, length, pressed);
			});

			keyboard.shortcut('alt+arrowdown, alt+arrowup', e, (pressed: string) => {
				if (block.isTextToggle()) {
					e.preventDefault();
					S.Block.toggle(rootId, block.id, pressed.match('arrowdown') ? true : false);
				};
			});

			// Backspace
			keyboard.shortcut('backspace, delete', e, (pressed: string) => {
				if (!readonly) {
					this.onBackspaceBlock(e, range, pressed, length, props);
				};
			});

			keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
				this.onArrowVertical(e, pressed, range, length, props);
			});

			keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
				this.onArrowHorizontal(e, text, pressed, range, length, props);
			});

			// Enter
			keyboard.shortcut('enter, shift+enter', e, (pressed: string) => {
				if (isInsideTable && (pressed == 'enter')) {
					this.onArrowVertical(e, Key.down, { from: length, to: length }, length, props);
				} else {
					this.onEnterBlock(e, range, pressed);
				};
			});

			// Tab, indent block
			keyboard.shortcut('indent, outdent', e, (pressed: string) => {
				const isShift = pressed.match('shift') ? true : false;

				if (isInsideTable) {
					this.onArrowHorizontal(e, text, pressed, { from: length, to: length }, length, props);
				} else {
					this.onTabBlock(e, range, isShift);
				};
			});

			// Last/first block
			keyboard.shortcut(`${cmd}+arrowup, ${cmd}+arrowdown`, e, (pressed: string) => {
				this.onCtrlArrowBlock(e, pressed);
			});

			// Move blocks with arrows
			keyboard.shortcut('moveSelectionUp, moveSelectionDown', e, (pressed: string) => {
				this.onCtrlShiftArrowBlock(e, pressed);
			});
		};
	};

	getStyleParam () {
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

	onKeyUpBlock (e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any) {
	};

	// Indentation
	onTabEditor (e: any, ids: string[], pressed: string) {
		e.preventDefault();
			
		const { rootId } = this.props;
		const readonly = this.isReadonly();

		if (!ids.length || readonly) {
			return;
		};

		const shift = pressed.match('shift');
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
	onCtrlShiftArrowEditor (e: any, pressed: string) {
		e.preventDefault();

		const { rootId, isPopup } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const dir = pressed.match(Key.up) ? -1 : 1;
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
	onCtrlShiftArrowBlock (e: any, pressed: string) {
		e.preventDefault();

		const { rootId, isPopup } = this.props;
		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const dir = pressed.match(Key.up) ? -1 : 1;

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
	onCtrlArrowBlock (e: any, pressed: string) {
		e.preventDefault();

		const { rootId } = this.props;
		const dir = pressed.match(Key.up) ? -1 : 1;
		const next = S.Block.getFirstBlock(rootId, -dir, it => it.isFocusable());
		
		this.focusNextBlock(next, dir);
	};

	// Expand selection up/down
	onShiftArrowEditor (e: any, pressed: string) {
		const { rootId } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const dir = pressed.match(Key.up) ? -1 : 1;
		const ids = selection?.get(I.SelectType.Block, false) || [];
		const idsWithChildren = selection?.get(I.SelectType.Block, true) || [];

		if (ids.length == 1) {
			this.dir = dir;
		};

		let method = '';
		if (this.dir && (dir != this.dir)) {
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
	onShiftArrowBlock (e: any, range: I.TextRange, length: number, pressed: string) {
		const { rootId } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const { focused } = focus.state;
		const dir = pressed.match(Key.up) ? -1 : 1;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block || this.menuCheck()) {
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
	onMarkBlock (e: any, type: I.MarkType, text: string, marks: I.Mark[], param: string, range: I.TextRange) {
		e.preventDefault();

		const { rootId } = this.props;
		const { focused } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);
		const rect = U.Common.getSelectionRect();

		if (!block) {
			return;
		};

		const mark = Mark.getInRange(marks, type, range);
		const win = $(window);
		const cb = () => {
			U.Data.blockSetText(rootId, block.id, text, marks, true, () => {
				focus.set(block.id, range);
				focus.apply(); 
			});
		};

		if (type == I.MarkType.Link) {
			S.Menu.close('blockContext', () => {
				S.Menu.open('blockLink', {
					rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
					horizontal: I.MenuDirection.Center,
					offsetY: 4,
					data: {
						filter: mark ? mark.param : '',
						type: mark ? mark.type : null,
						onChange: (newType: I.MarkType, param: string) => {
							marks = Mark.toggleLink({ type: newType, param, range }, marks);
							cb();
						}
					}
				});
			});
		} else {
			marks = Mark.toggle(marks, { type, param: mark ? '' : param, range });
			cb();
		};
	};

	// Backspace / Delete
	onBackspaceBlock (e: any, range: I.TextRange, pressed: string, length: number, props: any) {
		const { rootId } = this.props;
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
					ids.length ? this.blockRemove(block) : this.blockMerge(block, -1, length);
				};
			};

			if (isDelete && (range.from == range.to) && (range.to == length)) {
				ids.length ? this.blockRemove(block) : this.blockMerge(block, 1, length);
			};
		};
		if (!block.isText() && !keyboard.isFocused) {
			this.blockRemove(block);
		};
	};

	// Indentation
	onTabBlock (e: any, range: I.TextRange, isShift: boolean) {
		e.preventDefault();
			
		const { rootId } = this.props;
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
			window.setTimeout(() => this.focus(block.id, range.from, range.to, false), 50);

			if (next && next.isTextToggle()) {
				S.Block.toggle(rootId, next.id, true);
			};
		});
	};

	// Split
	onEnterBlock (e: any, range: I.TextRange, pressed: string) {
		const { rootId } = this.props;
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

		if (this.menuCheck()) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();

		if (replace) {
			if (parent?.isTextList()) {
				this.onTabBlock(e, range, true);
			} else {
				C.BlockListTurnInto(rootId, [ block.id ], I.TextStyle.Paragraph, () => {
					C.BlockTextListClearStyle(rootId, [ block.id ]);
				});
			};
		} else 
		if (!block.isText()) {  
			this.blockCreate(block.id, I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});
		} else {
			this.blockSplit(block, range, isShift);
		};
	};

	menuCheck () {
		return S.Menu.isOpen('', '', [ 'blockContext', 'searchText', 'onboarding', 'publish' ]);
	};

	onArrowVertical (e: any, pressed: string, range: I.TextRange, length: number, props: any) {
		if (this.menuCheck()) {
			return;
		};

		const { focused } = focus.state;
		const { rootId } = this.props;
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

			this.focusNextBlock(next, dir);
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

	onArrowHorizontal (e: any, text: string, pressed: string, range: I.TextRange, length: number, props: any) {
		const { focused } = focus.state;
		const { rootId } = this.props;
		const { isInsideTable } = props;
		const block = S.Block.getLeaf(rootId, focused);
		const withTab = pressed.match(Key.tab);
		const isRtl = U.Common.checkRtl(text);
		const dir = (pressed.match([ Key.left, Key.shift ].join('|')) ? -1 : 1) * (isRtl ? -1 : 1);

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
			this.onArrowVertical(e, (dir < 0 ? 'arrowup' : 'arrowdown'), range, length, props);
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
							this.focusNextBlock(S.Block.getLeaf(rootId, nextCellId), dir);
						});
					} else {
						onVertical();
					};
				};

				this.focusNextBlock(S.Block.getLeaf(rootId, nextCellId), dir);
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

	onSelectAll () {
		const { rootId } = this.props;
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
	
	onAdd (e: any) {
		if (!this.hoverId || (this.hoverPosition == I.BlockPosition.None)) {
			return;
		};
		
		const { rootId } = this.props;
		const block = S.Block.getLeaf(rootId, this.hoverId);
		
		if (!block || (block.isTextTitle() && (this.hoverPosition != I.BlockPosition.Bottom)) || block.isLayoutColumn() || block.isIcon()) {
			return;
		};
		
		S.Common.filterSet(0, '');
		focus.clear(true);

		this.blockCreate(block.id, this.hoverPosition, { type: I.BlockType.Text }, (blockId: string) => {
			$(`.placeholder.c${blockId}`).text(translate('placeholderFilter'));
			this.onMenuAdd(blockId, '', { from: 0, to: 0 }, []);
		});
	};
	
	onMenuAdd (blockId: string, text: string, range: I.TextRange, marks: I.Mark[]) {
		const { rootId } = this.props;
		const block = S.Block.getLeaf(rootId, blockId);
		const win = $(window);

		if (!block) {
			return;
		};

		S.Common.filterSet(range.from, '');

		S.Menu.open('blockAdd', { 
			element: $(`#block-${blockId}`),
			subIds: J.Menu.add,
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
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
				blockCreate: this.blockCreate
			},
		});
	};
	
	onScroll () {
		const { rootId, isPopup } = this.props;
		const win = $(window);
		const top = U.Common.getScrollContainer(isPopup).scrollTop();

		this.containerScrollTop = top;
		this.winScrollTop = win.scrollTop();

		window.clearTimeout(this.timeoutScroll);
		this.timeoutScroll = window.setTimeout(() => {
			Storage.setScroll('editor', rootId, top, isPopup);
		}, 50);

		Preview.previewHide(false);
	};
	
	onCopy (e: any, isCut: boolean) {
		const { rootId } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const readonly = this.isReadonly();
		const root = S.Block.getLeaf(rootId, rootId);
		const { focused } = focus.state;

		if (!root || (readonly && isCut)) {
			return;
		};

		let ids = selection?.get(I.SelectType.Block, true) || [];

		if (root.isLocked() && !ids.length) {
			return;
		};

		e.preventDefault();

		if (!ids.length) {
			ids = [ focused ];
		} else {
			ids = ids.concat(S.Block.getLayoutIds(rootId, ids));
		};

		Action.copyBlocks(rootId, ids, isCut);
	};

	onPasteEvent (e: any, props: any, data?: any) {
		const { isPopup } = props;

		if (isPopup !== keyboard.isPopup()) {
			return;
		};

		if (keyboard.isPasteDisabled || this.isReadonly()) {
			return;
		};

		const files = U.Common.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items);

		S.Menu.closeAll([ 'blockAdd' ]);

		if (!data) {
			data = this.getClipboardData(e);
		};

		// Priorize HTML content
		const hasHtml = data && data.html;
		
		if (hasHtml) {
        	e.preventDefault();
        	this.onPaste(data);
	    } else {
	        const clipboardItems = (e.clipboardData || e.originalEvent.clipboardData).items;
	        const files = U.Common.getDataTransferFiles(clipboardItems);
	        
	        if (files.length && !data.files.length) {
	            U.Common.saveClipboardFiles(files, data, data => this.onPasteEvent(e, props, data));
	        } else {
	            e.preventDefault();
	            this.onPaste(data);
	        };
	    };
	};

	onPaste (data: any) {
		data.anytype = data.anytype || {};
		data.anytype.range = data.anytype.range || { from: 0, to: 0 };

		const { rootId } = this.props;
		const { focused, range } = focus.state;
		const block = S.Block.getLeaf(rootId, focused);
		const selection = S.Common.getRef('selectionProvider');

		if (!data.html) {
			let url = U.Common.matchUrl(data.text);
			let isLocal = false;

			if (!url) {
				url = U.Common.matchLocalPath(data.text);
				isLocal = true;
			};

			if (block && url && !block.isTextTitle() && !block.isTextDescription()) {
				this.onPasteUrl(url, isLocal);
				return;
			};
		};

		let id = '';
		let from = 0;
		let to = 0;

		C.BlockPaste(rootId, focused, range, selection?.get(I.SelectType.Block, true) || [], data.anytype.range.to > 0, { ...data, anytype: data.anytype.blocks }, '', (message: any) => {
			if (message.error.code) {
				return;
			};

			let count = 0;

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

			this.focus(id, from, to, true);
			analytics.event('PasteBlock', { count });
		});
	};

	onPasteUrl (url: string, isLocal: boolean) {
		const { rootId } = this.props;
		const { focused, range } = focus.state;
		const currentFrom = range.from;
		const currentTo = range.to;
		const block = S.Block.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const isInsideTable = S.Block.checkIsInsideTable(rootId, block.id);
		const win = $(window);
		const first = S.Block.getFirstBlock(rootId, 1, (it) => it.isText() && !it.isTextTitle() && !it.isTextDescription());
		const object = S.Detail.get(rootId, rootId, [ 'internalFlags' ]);
		const isEmpty = first && (focused == first.id) && !first.getLength() && (object.internalFlags || []).includes(I.ObjectFlag.DeleteEmpty);
		const length = block.getLength();
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace;
		const processor = U.Embed.getProcessorByUrl(url);
		const canObject = isEmpty && !isInsideTable && !isLocal;
		const canBlock = !isInsideTable && !isLocal;

		const options: any[] = [
			{ id: 'link', name: translate('editorPagePasteLink') },
			canObject ? { id: 'object', name: translate('editorPageCreateBookmarkObject') } : null,
			canBlock ? { id: 'block', name: translate('editorPageCreateBookmark') } : null,
			{ id: 'cancel', name: translate('editorPagePasteText') },
		].filter(it => it);

		if (processor !== null) {
			options.unshift({ id: 'embed', name: translate('editorPagePasteEmbed') });
		};

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
							const param = isLocal ? `file://${url}` : url;

							if (currentFrom == currentTo) {
								value = U.Common.stringInsert(value, url + ' ', currentFrom, currentFrom);
								to = currentFrom + url.length;
							} else {
								to = currentTo;
							};

							marks = Mark.adjust(marks, currentFrom - 1, url.length + 1);
							marks.push({ type: I.MarkType.Link, range: { from: currentFrom, to }, param});

							U.Data.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;
						};

						case 'object': {
							C.ObjectToBookmark(rootId, url, (message: any) => {
								if (!message.error.code) {
									U.Object.openRoute({ id: message.objectId, layout: I.ObjectLayout.Bookmark });
									analytics.createObject(J.Constant.typeKey.bookmark, I.ObjectLayout.Bookmark, analytics.route.bookmark, message.middleTime);
								};
							});
							break;
						};

						case 'block': {
							const bookmark = S.Record.getBookmarkType();

							C.BlockBookmarkCreateAndFetch(rootId, focused, position, url, bookmark?.defaultTemplateId, (message: any) => {
								if (!message.error.code) {
									analytics.event('CreateBlock', { middleTime: message.middleTime, type: I.BlockType.Bookmark });
								};
							});
							break;
						};

						case 'cancel': {
							value = U.Common.stringInsert(block.content.text, url + ' ', currentFrom, currentFrom);
							to = currentFrom + url.length;

							U.Data.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;
						};

						case 'embed': {
							if (processor !== null) {
								this.blockCreate(block.id, position, { type: I.BlockType.Embed, content: { processor, text: url } }, (blockId: string) => {
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

	getClipboardData (e: any) {
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const data: any = {
			text: U.Common.normalizeLineEndings(String(cb.getData('text/plain') || '')),
			html: String(cb.getData('text/html') || ''),
			anytype: JSON.parse(String(cb.getData('application/json') || '{}')),
			files: [],
		};
		data.anytype.range = data.anytype.range || { from: 0, to: 0 };
		return data;
	};

	onHistory (e: any) {
		U.Object.openAuto({ layout: I.ObjectLayout.History, id: this.props.rootId });
	};

	blockCreate (blockId: string, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;

		C.BlockCreate(rootId, blockId, position, param, (message: any) => {
			if (param.type == I.BlockType.Text) {
				window.setTimeout(() => this.focus(message.blockId, 0, 0, false), 15);
			};

			if (callBack) {
				callBack(message.blockId);
			};

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
	
	blockMerge (focused: I.Block, dir: number, length: number) {
		const { rootId } = this.props;
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
				this.focus(blockId, to, to, true);
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
						this.focus(next.id, nl, nl, false);
					};
				};
			});
		};
	};
	
	blockSplit (focused: I.Block, range: I.TextRange, isShift: boolean) {
		const { rootId } = this.props;
		const { content } = focused;
		const isTitle = focused.isTextTitle();
		const isToggle = focused.isTextToggle();
		const isCallout = focused.isTextCallout();
		const isQuote = focused.isTextQuote();
		const isList = focused.isTextList();
		const isCode = focused.isTextCode();
		const isOpen = Storage.checkToggle(rootId, focused.id);
		const childrenIds = S.Block.getChildrenIds(rootId, focused.id);
		const length = focused.getLength();

		let style = I.TextStyle.Paragraph;
		let mode = I.BlockSplitMode.Bottom;

		if ((length && isList) || (!isTitle && ((range.from != length) || (range.to != length)))) {
			style = content.style;
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
			this.focus(focusId, 0, 0, true);

			if (isToggle && isOpen) {
				S.Block.toggle(rootId, message.blockId, true);
			};

			if (keyboard.isRtl) {
				U.Data.setRtl(rootId, message.blockId);
			};

			analytics.event('CreateBlock', { middleTime: message.middleTime, type: I.BlockType.Text, style });
		});
	};
	
	blockRemove (focused?: I.Block) {
		const { rootId } = this.props;
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
			this.focus(next.id, length, length, true);

			selection.clear();
		});
	};
	
	onLastClick (e: any) {
		const { rootId } = this.props;
		const readonly = this.isReadonly();

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
			this.blockCreate('', I.BlockPosition.Bottom, { type: I.BlockType.Text });
		} else {
			this.focus(last.id, length, length, true);
		};
	};
	
	resizePage (callBack?: () => void) {
		const { isLoading } = this.state;

		if (isLoading || !this._isMounted) {
			return;
		};

		if (this.frameResize) {
			raf.cancel(this.frameResize);
		};

		this.frameResize = raf(() => {
			const { rootId, isPopup } = this.props;
			const node = $(this.node);
			const note = node.find('#note');
			const blocks = node.find('.blocks');
			const last = node.find('#blockLast');
			const size = node.find('#editorSize');
			const cover = node.find('.block.blockCover');
			const pageContainer = U.Common.getPageContainer(isPopup);
			const header = pageContainer.find('#header');
			const scrollContainer = U.Common.getScrollContainer(isPopup);
			const hh = isPopup ? header.height() : J.Size.header;

			this.setLayoutWidth(U.Data.getLayoutWidth(rootId));

			if (blocks.length && last.length && scrollContainer.length) {
				const ct = isPopup ? scrollContainer.offset().top : 0;
				const ch = scrollContainer.height();
				const height = Math.max(ch / 2, ch - blocks.outerHeight() - blocks.offset().top - ct - 2);

				last.css({ height: Math.max(J.Size.lastBlock, height) });
			};

			if (note.length) {
				note.css({ top: hh });
			};
			if (size.length) {
				size.css({ top: hh + 8 });
			};
			if (cover.length) {
				cover.css({ top: hh });
			};

			if (callBack) {
				callBack();
			};
		});
	};

	focus (id: string, from: number, to: number, scroll: boolean) {
		const { isPopup } = this.props;

		window.setTimeout(() => {
			focus.set(id, { from, to });
			focus.apply();

			if (scroll) {
				focus.scroll(isPopup, id);
			};
		}, 15);
	};

	focusNextBlock (next: I.Block, dir: number) {
		if (!next) {
			return;
		};

		const l = next.getLength();
		const from = dir > 0 ? 0 : l;

		this.focus(next.id, from, from, true);
	};

	setLayoutWidth (v: number) {
		v = Number(v) || 0;

		const { isPopup } = this.props;
		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const node = $(this.node);
		const width = this.getWidth(v);
		const elements = node.find('#elements');
		const percent = width / cw * 100;

		this.width = width;

		node.css({ width: `${percent}%` });
		elements.css({ width: `${percent}%`, marginLeft: `-${percent / 2}%` });

		if (this.refHeader && this.refHeader.refDrag) {
			this.refHeader.refDrag.setValue(v);
			this.refHeader.setPercent(v);
		};

		$('.resizable').trigger('resizeInit');
	};

	getWidth (w: number) {
		w = Number(w) || 0;

		const { isPopup, rootId } = this.props;
		const container = U.Common.getPageContainer(isPopup);
		const root = S.Block.getLeaf(rootId, rootId);

		let mw = container.width();
		let width = 0;

		if (U.Object.isInSetLayouts(root?.layout)) {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			w = (mw - size) * w;
			width = Math.max(size, Math.min(mw, size + w));
		};

		return Math.max(300, width);
	};

	isReadonly () {
		const { isDeleted } = this.state;
		if (isDeleted) {
			return true;
		};

		const { rootId } = this.props;
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

	setLoading (v: boolean): void {
		this.setState({ isLoading: v });
	};

});

export default EditorPage;
