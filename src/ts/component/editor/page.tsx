import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { Block, Icon, Loader, Deleted, DropTarget } from 'Component';
import { commonStore, blockStore, detailStore, menuStore, popupStore, dbStore } from 'Store';
import { I, C, Key, UtilCommon, UtilData, UtilObject, Preview, Mark, focus, keyboard, Storage, Mapper, Action, translate, analytics, Renderer, sidebar } from 'Lib';
import Controls from 'Component/page/head/controls';
import PageHeadEdit from 'Component/page/head/edit';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

interface Props extends I.PageComponent {
	onOpen?(): void;
};

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const THROTTLE = 40;
const BUTTON_OFFSET = 10;

const EditorPage = observer(class EditorPage extends React.Component<Props, State> {
	
	_isMounted = false;
	node: any = null;
	id = '';
	hoverId =  '';
	hoverPosition: I.BlockPosition = I.BlockPosition.None;
	scrollTop = 0;
	uiHidden = false;
	width = 0;
	refHeader: any = null;
	dir = 0;

	state = {
		isLoading: false,
		isDeleted: false,
	};

	timeoutMove = 0;
	timeoutScreen = 0;

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
		this.onPaste = this.onPaste.bind(this);
		this.onLastClick = this.onLastClick.bind(this);
		this.blockCreate = this.blockCreate.bind(this);
		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.resizePage = this.resizePage.bind(this);
		this.focusTitle = this.focusTitle.bind(this);
		this.blockRemove = this.blockRemove.bind(this);
		this.setLayoutWidth = this.setLayoutWidth.bind(this);
		this.setLoading = this.setLoading.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { isLoading, isDeleted } = this.state;
		const root = blockStore.getLeaf(rootId, rootId);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (isLoading) {
			return <Loader id="loader" />;
		};

		if (!root) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId, it => !it.isLayoutHeader());
		const length = childrenIds.length;
		const width = root.fields?.width;
		const readonly = this.isReadonly();
		const object = detailStore.get(rootId, rootId, [ 'isArchived', 'isDeleted' ], true);

		return (
			<div 
				ref={node => this.node = node} 
				id="editorWrapper"
			>
				<Controls 
					key="editorControls" 
					{...this.props} 
					resize={this.resizePage} 
					readonly={readonly}
					onLayoutSelect={() => { this.focusTitle(); }} 
				/>
				
				<div id={'editor-' + rootId} className="editor">
					<div className="blocks">
						<Icon id="button-block-add" className="buttonAdd" onClick={this.onAdd} />

						<PageHeadEdit 
							{...this.props} 
							ref={ref => this.refHeader = ref}
							onKeyDown={this.onKeyDownBlock}
							onKeyUp={this.onKeyUpBlock}  
							onMenuAdd={this.onMenuAdd}
							onPaste={this.onPaste}
							setLayoutWidth={this.setLayoutWidth}
							setLoading={this.setLoading}
							readonly={readonly}
							getWrapperWidth={this.getWrapperWidth}
						/>
					
						{children.map((block: I.Block, i: number) => (
							<Block 
								key={'block-' + block.id} 
								{...this.props}
								index={i}
								block={block}
								onKeyDown={this.onKeyDownBlock}
								onKeyUp={this.onKeyUpBlock}  
								onMenuAdd={this.onMenuAdd}
								onCopy={this.onCopy}
								onPaste={this.onPaste}
								readonly={readonly}
								blockRemove={this.blockRemove}
								getWrapperWidth={this.getWrapperWidth}
								setLoading={this.setLoading}
							/>
						))}
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

		keyboard.disableClose(false);
	};

	componentDidUpdate () {
		const { rootId, isPopup } = this.props;
		const node = $(this.node);
		const resizable = node.find('.resizable');
		
		this.open();
		this.resizePage();
		this.checkDeleted();

		focus.apply();
		blockStore.updateNumbers(rootId);
		sidebar.resizePage();

		if (resizable.length) {
			resizable.trigger('resizeInit');
		};

		UtilCommon.getScrollContainer(isPopup).scrollTop(this.scrollTop);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.uiHidden = false;
		this.unbind();
		this.close();

		focus.clear(false);
		window.clearInterval(this.timeoutScreen);
		Renderer.remove('commandEditor');
	};

	getWrapperWidth (): number {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		return this.getWidth(root?.fields?.width);
	};

	checkDeleted () {
		const { rootId } = this.props;
		const { isDeleted } = this.state;

		if (isDeleted) {
			return;
		};

		const object = detailStore.get(rootId, rootId, []);

		if (object.isArchived || object.isDeleted) {
			this.setState({ isDeleted: true });
		};
	};

	open () {
		const { rootId, onOpen, isPopup } = this.props;

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.setState({ isDeleted: false, isLoading: true });

		C.ObjectOpen(this.id, '', (message: any) => {
			if (!UtilCommon.checkError(message.error.code)) {
				return;
			};

			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true, isLoading: false });
				} else {
					UtilObject.openHome('route');
				};
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isArchived || object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.scrollTop = Storage.getScroll('editor' + (isPopup ? 'Popup' : ''), rootId);
			this.focusTitle();
			this.setLoading(false);
			
			UtilCommon.getScrollContainer(isPopup).scrollTop(this.scrollTop);

			if (onOpen) {
				onOpen();
			};

			window.setTimeout(() => this.resizePage(), 15);
		});
	};

	close () {
		const { isPopup, rootId, match } = this.props;

		let close = true;
		if (isPopup && (match.params.id == rootId)) {
			close = false;
		};
		if (keyboard.isCloseDisabled) {
			close = false;
		};

		if (close) {
			Action.pageClose(rootId, true);
		};
	};

	onCommand (cmd: string, arg: any) {
		if (keyboard.isFocused) {
			return;
		};

		const { rootId } = this.props;
		const { focused, range } = focus.state;
		const popupOpen = popupStore.isOpen();
		const menuOpen = menuStore.isOpen();

		let length = 0;
		if (focused) {
			const block = blockStore.getLeaf(rootId, focused);
			if (block) {
				length = block.getLength();
			};
		};

		switch (cmd) {
			case 'selectAll':
				if (popupOpen || menuOpen) {
					break;
				};

				if ((range.from == 0) && (range.to == length)) {
					this.onSelectAll();
				} else {
					focus.set(focused, { from: 0, to: length });
					focus.apply();
				};
				break;
		};
	};
	
	focusTitle () {
		const { rootId } = this.props;
		const block = blockStore.getFirstBlock(rootId, 1, it => it.isText())
		
		if (!block) {
			return;
		};

		const length = block.getLength();
		if (!length) {
			focus.set(block.id, { from: length, to: length });
			focus.apply();
		};
	};
	
	unbind () {
		const { isPopup } = this.props;
		const namespace = UtilCommon.getEventNamespace(isPopup);
		const container = UtilCommon.getScrollContainer(isPopup);
		const events = [ 'keydown', 'mousemove', 'paste', 'resize', 'focus' ];

		$(window).off(events.map(it => `${it}.editor${namespace}`).join(' '));
		container.off(`scroll.editor${namespace}`);
		Renderer.remove('commandEditor');
	};

	rebind () {
		const { dataset, isPopup } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		const namespace = UtilCommon.getEventNamespace(isPopup);
		const container = UtilCommon.getScrollContainer(isPopup);

		this.unbind();

		win.on('mousemove.editor' + namespace, throttle(e => this.onMouseMove(e), THROTTLE));
		win.on('keydown.editor' + namespace, e => this.onKeyDownEditor(e));
		win.on('paste.editor' + namespace, (e: any) => {
			if (!keyboard.isFocused) {
				this.onPaste(e, {});
			};
		});

		win.on('focus.editor' + namespace, () => {
			const isPopupOpen = popupStore.isOpen('', [ 'page' ]);
			const isMenuOpen = menuStore.isOpen();
			const isMenuContextOpen = menuStore.isOpen('blockContext');

			let ids: string[] = [];
			if (selection) {
				ids = selection.get(I.SelectType.Block, true);
			};
			if (!ids.length && (!isMenuOpen || isMenuContextOpen) && !isPopupOpen) {
				focus.restore();
				focus.apply(); 
			};
			container.scrollTop(this.scrollTop);
		});

		win.on('resize.editor' + namespace, () => this.resizePage());
		container.on('scroll.editor' + namespace, e => this.onScroll());
		Renderer.on('commandEditor', (e: any, cmd: string, arg: any) => this.onCommand(cmd, arg));
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { isLoading } = this.state;
		const { rootId, dataset, isPopup } = this.props;
		const { selection } = dataset || {};
		const root = blockStore.getLeaf(rootId, rootId);
		const readonly = this.isReadonly();
		const node = $(this.node);
		const button = node.find('#button-block-add');
		const menuOpen = menuStore.isOpen() && !menuStore.isOpen('onboarding');

		const clear = () => {
			node.find('.block.showMenu').removeClass('showMenu');
			node.find('.block.isAdding').removeClass('isAdding top bottom');
		};

		const out = () => {
			window.clearTimeout(this.timeoutMove);
			this.timeoutMove = window.setTimeout(() => {
				button.removeClass('show');
				clear();
			}, 30);
		};

		if (
			!root || 
			readonly || 
			(root && root.isLocked()) || 
			keyboard.isResizing || 
			keyboard.isDragging || 
			(selection && selection.isSelecting) || 
			menuOpen || 
			popupStore.isOpen('', [ 'page' ]) ||
			isLoading
		) {
			out();
			return;
		};

		const win = $(window);
		const container = node.find('.editor');
		
		if (!container.length) {
			return;
		};

		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const featured = node.find(`#block-${Constant.blockId.featured}`);
		const st = win.scrollTop();
		const { pageX, pageY } = e;
		const blocks = blockStore.getBlocks(rootId);

		let offset = 140;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, height: 0 };

		if (featured.length) {
			offset = featured.offset().top + featured.outerHeight() - BUTTON_OFFSET;
		};

		for (let block of blocks) {
			if (!block.canCreateBlock()) {
				continue;
			};

			let obj = $(`#block-${block.id}`);
			if (!obj.length || obj.hasClass('noPlus')) {
				continue;
			};

			let rect = obj.get(0).getBoundingClientRect() as DOMRect;

			rect.y += st;

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
		if (hovered && 
			(pageX >= x) && 
			(pageX <= x + Constant.size.blockMenu) && 
			(pageY >= offset + BUTTON_OFFSET) && 
			(pageY <= st + rectContainer.height + offset + BUTTON_OFFSET)
		) {
			this.hoverPosition = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		};

		this.frameMove = raf(() => {
			if (this.hoverPosition == I.BlockPosition.None) {
				out();
				return;
			};

			let buttonX = hoveredRect.x - (rectContainer.x - Constant.size.blockMenu) + 2;
			let buttonY = pageY - rectContainer.y - BUTTON_OFFSET - st;
			
			clear();
			button.addClass('show').css({ transform: `translate3d(${buttonX}px,${buttonY}px,0px)` });
			hovered.addClass('showMenu');

			if (pageX <= x + 20) {
				hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
			};
		});
	};
	
	onKeyDownEditor (e: any) {
		const { dataset, rootId, isPopup } = this.props;

		if (!isPopup && popupStore.isOpen('page')) {
			return;
		};

		const { selection } = dataset || {};
		const menuOpen = menuStore.isOpen();
		const popupOpen = popupStore.isOpenKeyboard();
		const root = blockStore.getLeaf(rootId, rootId);

		if (keyboard.isFocused || !selection || !root) {
			return;
		};

		Preview.previewHide(true);
		
		const ids = selection.get(I.SelectType.Block);
		const cmd = keyboard.cmdKey();
		const readonly = this.isReadonly();
		const styleParam = this.getStyleParam();

		// Select all
		keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
			if (popupOpen || menuOpen) {
				return;
			};

			e.preventDefault();
			this.onSelectAll();
		});

		// Copy/Cut
		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
			this.onCopy(e, pressed.match('x') ? true : false);
		});

		// Undo
		keyboard.shortcut(`${cmd}+z`, e, () => {
			if (!readonly) {
				e.preventDefault();
				keyboard.onUndo(rootId, 'editor', () => { focus.clear(true); });
			};
		});

		// Redo
		keyboard.shortcut(`${cmd}+shift+z, ${cmd}+y`, e, () => {
			if (readonly) {
				e.preventDefault();
				keyboard.onRedo(rootId, 'editor', () => { focus.clear(true); });
			};
		});

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, (pressed: string) => {
			e.preventDefault();
			this.onHistory(e);
		});

		// Expand selection
		keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
			this.onShiftArrowEditor(e, pressed);
		});

		if (ids.length) {

			keyboard.shortcut('escape', e, (pressed: string) => {
				if (!menuOpen) {
					selection.clear();
				};
			});

			// Mark-up

			let type = null;
			let param = '';
			let markParam = this.getMarkParam();

			for (let item of markParam) {
				keyboard.shortcut(item.key, e, (pressed: string) => {
					type = item.type;
					param = item.param;
				});
			};

			if (!readonly && (type !== null)) {
				e.preventDefault();

				if (type == I.MarkType.Link) {
					menuStore.open('blockLink', {
						element: `#block-${ids[0]}`,
						horizontal: I.MenuDirection.Center,
						data: {
							filter: '',
							onChange: (newType: I.MarkType, param: string) => {
								C.BlockTextListSetMark(rootId, ids, { type: newType, param: param, range: { from: 0, to: 0 } }, (message: any) => {
									analytics.event('ChangeTextStyle', { type: newType, count: ids.length });
								});
							}
						}
					});
				} else {
					C.BlockTextListSetMark(rootId, ids, { type: type, param: param, range: { from: 0, to: 0 } }, (message: any) => {
						analytics.event('ChangeTextStyle', { type, count: ids.length });
					});
				};
			};

			// Duplicate
			keyboard.shortcut(`${cmd}+d`, e, () => {
				if (readonly) {
					return;
				};

				e.preventDefault();
				Action.duplicate(rootId, rootId, ids[ids.length - 1], ids, I.BlockPosition.Bottom, () => { focus.clear(true); });
			});

			for (const item of styleParam) {
				let style = null;

				keyboard.shortcut(item.key, e, () => {
					style = item.style;
				});

				if (style !== null) {
					C.BlockListTurnInto(rootId, ids, style);
				};
			};

			// Open action menu
			keyboard.shortcut(`${cmd}+/, ctrl+shift+/`, e, () => {
				menuStore.closeAll([ 'blockContext', 'blockAdd' ], () => {
					menuStore.open('blockAction', { 
						element: `#block-${ids[0]}`,
						offsetX: Constant.size.blockMenu,
						data: {
							blockId: ids[0],
							blockIds: ids,
							rootId,
							dataset,
							onCopy: this.onCopy,
						},
						onClose: () => {
							selection.clear();
							focus.apply();
						}
					});
				});
			});

			// Move blocks with arrows
			keyboard.shortcut(`${cmd}+shift+arrowup, ${cmd}+shift+arrowdown`, e, (pressed: string) => {
				this.onCtrlShiftArrowEditor(e, pressed);
			});
		};

		// Remove blocks
		keyboard.shortcut('backspace, delete', e, () => {
			if (!readonly) {
				e.preventDefault();
				this.blockRemove();
			};
		});

		// Indent block
		keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
			this.onTabEditor(e, ids, pressed);
		});

		// Restore focus
		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			if (menuOpen || popupOpen) {
				return;
			};

			selection.clear();
			focus.restore();
			focus.apply();
		});

		// Enter
		keyboard.shortcut('enter', e, () => {
			if (menuOpen || popupOpen || readonly) {
				return;
			};

			selection.clear();
			focus.restore();

			const focused = focus.state.focused || Constant.blockId.title;
			this.blockCreate(focused , I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});
		});
	};

	onKeyDownBlock (e: any, text: string, marks: I.Mark[], range: any, props: any) {
		range = range || {};

		const { dataset, rootId } = this.props;
		const { isInsideTable } = props;
		const { focused } = focus.state;
		const { selection } = dataset || {};
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const styleParam = this.getStyleParam();
		const cmd = keyboard.cmdKey();

		// Last line break doesn't expand range.to
		let length = String(text || '').length;
		if (length && (text[length - 1] == '\n')) {
			length--;
		};

		Preview.previewHide(true);
		
		if (UtilCommon.isPlatformMac()) {
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
			keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
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
			keyboard.shortcut(`${cmd}+z`, e, () => {
				e.preventDefault();
				keyboard.onUndo(rootId, 'editor', () => { focus.clear(true); });
			});

			// Redo
			keyboard.shortcut(`${cmd}+shift+z, ${cmd}+y`, e, () => {
				e.preventDefault();
				keyboard.onRedo(rootId, 'editor', () => { focus.clear(true); });
			});

			// Search
			keyboard.shortcut(`${cmd}+f`, e, () => {
				keyboard.onSearchMenu(text.substring(range.from, range.to), 'editor');
			});

			if (block.isTextToggle()) {
				keyboard.shortcut(`${cmd}+shift+t`, e, () => {
					blockStore.toggle(rootId, block.id, !Storage.checkToggle(rootId, block.id));
				});
			};
		};

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, () => {
			e.preventDefault();
			this.onHistory(e);
		});

		// Duplicate
		keyboard.shortcut(`${cmd}+d`, e, () => {
			e.preventDefault();
			Action.duplicate(rootId, rootId, block.id, [ block.id ], I.BlockPosition.Bottom);
		});

		// Open action menu
		keyboard.shortcut(`${cmd}+/, ctrl+shift+/`, e, () => {
			menuStore.close('blockContext', () => {
				menuStore.open('blockAction', { 
					element: `#block-${block.id}`,
					offsetX: Constant.size.blockMenu,
					data: {
						blockId: block.id,
						blockIds: UtilData.selectionGet(block.id, true, true, this.props),
						rootId,
						dataset,
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
			let markParam = this.getMarkParam();

			for (let item of markParam) {
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
			keyboard.shortcut(`${cmd}+k`, e, () => {
				keyboard.onSearchPopup();
			});
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
					blockStore.toggle(rootId, block.id, pressed.match('arrowdown') ? true : false);
				};
			});

			// Backspace
			keyboard.shortcut('backspace, delete', e, (pressed: string) => {
				this.onBackspaceBlock(e, range, pressed, length, props);
			});

			keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
				this.onArrowVertical(e, pressed, range, length, props);
			});

			keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
				this.onArrowHorizontal(e, pressed, range, length, props);
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
			keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
				const isShift = pressed.match('shift') ? true : false;

				if (isInsideTable) {
					this.onArrowHorizontal(e, pressed, { from: length, to: length }, length, props);
				} else {
					this.onTabBlock(e, range, isShift);
				};
			});

			// Last/first block
			keyboard.shortcut(`${cmd}+arrowup, ${cmd}+arrowdown`, e, (pressed: string) => {
				this.onCtrlArrowBlock(e, pressed);
			});

			// Move blocks with arrows
			keyboard.shortcut(`${cmd}+shift+arrowup, ${cmd}+shift+arrowdown`, e, (pressed: string) => {
				this.onCtrlShiftArrowBlock(e, pressed);
			});
		};
	};

	getStyleParam () {
		const cmd = keyboard.cmdKey();
		return [
			{ key: `${cmd}+0`, style: I.TextStyle.Paragraph },
			{ key: `${cmd}+1`, style: I.TextStyle.Header1 },
			{ key: `${cmd}+2`, style: I.TextStyle.Header2 },
			{ key: `${cmd}+3`, style: I.TextStyle.Header3 },
			{ key: `${cmd}+4`, style: I.TextStyle.Quote },
			{ key: `${cmd}+5`, style: I.TextStyle.Callout },
			{ key: `${cmd}+6`, style: I.TextStyle.Checkbox },
			{ key: `${cmd}+7`, style: I.TextStyle.Bulleted },
			{ key: `${cmd}+8`, style: I.TextStyle.Numbered },
			{ key: `${cmd}+9`, style: I.TextStyle.Toggle },
		];
	};

	getMarkParam () {
		const cmd = keyboard.cmdKey();
		return [
			{ key: `${cmd}+b`,		 type: I.MarkType.Bold,		 param: '' },
			{ key: `${cmd}+i`,		 type: I.MarkType.Italic,	 param: '' },
			{ key: `${cmd}+u`,		 type: I.MarkType.Underline, param: '' },
			{ key: `${cmd}+shift+s`, type: I.MarkType.Strike,	 param: '' },
			{ key: `${cmd}+k`,		 type: I.MarkType.Link,		 param: '' },
			{ key: `${cmd}+l`,		 type: I.MarkType.Code,		 param: '' },
			{ key: `${cmd}+shift+h`, type: I.MarkType.BgColor,	 param: Storage.get('bgColor') },
			{ key: `${cmd}+shift+c`, type: I.MarkType.Color,	 param: Storage.get('color') },
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
		const first = blockStore.getLeaf(rootId, ids[0]);
		if (!first) {
			return;
		};

		const element = blockStore.getMapElement(rootId, first.id);
		const parent = blockStore.getLeaf(rootId, element.parentId);
		const parentElement = blockStore.getMapElement(rootId, parent.id);

		if (!element || !parentElement) {
			return;
		};

		const idx = parentElement.childrenIds.indexOf(first.id);
		const nextId = parentElement.childrenIds[idx - 1];
		const next = nextId ? blockStore.getLeaf(rootId, nextId) : blockStore.getNextBlock(rootId, first.id, -1);
		const obj = shift ? parent : next;
		const canTab = obj && !first.isTextTitle() && !first.isTextDescription() && obj.canHaveChildren() && first.isIndentable();
		
		if (canTab) {
			Action.move(rootId, rootId, obj.id, ids, (shift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), () => {
				if (next && next.isTextToggle()) {
					blockStore.toggle(rootId, next.id, true);
				};
			});
		};
	};

	// Move blocks with arrows
	onCtrlShiftArrowEditor (e: any, pressed: string) {
		e.preventDefault();

		const { dataset, rootId, isPopup } = this.props;
		const { selection } = dataset || {};
		const dir = pressed.match(Key.up) ? -1 : 1;
		const ids = selection.get(I.SelectType.Block, false);

		if (!ids.length) {
			return;
		};

		const block = blockStore.getLeaf(rootId, dir > 0 ? ids[ids.length - 1] : ids[0]);
		if (!block) {
			return;
		};

		const next = blockStore.getNextBlock(rootId, block.id, dir, (it: any) => {
			return !it.isIcon() && !it.isTextTitle() && !it.isTextDescription() && !it.isFeatured() && !it.isSystem();
		});

		if (!next) {
			return;
		};

		const element = blockStore.getMapElement(rootId, block.id);
		const parentElement = blockStore.getMapElement(rootId, block.parentId);
		const nextElement = blockStore.getMapElement(rootId, next.id)
		const nextParent = blockStore.getLeaf(rootId, next.parentId);
		const nextParentElement = blockStore.getMapElement(rootId, next.parentId);

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
				blockStore.toggle(rootId, nextParent.id, true);
			};

			if (next && next.isTextToggle()) {
				blockStore.toggle(rootId, next.id, true);
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
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const dir = pressed.match(Key.up) ? -1 : 1;
		const next = blockStore.getNextBlock(rootId, block.id, dir, (it: any) => {
			return (
				!it.isIcon() && 
				!it.isTextTitle() && 
				!it.isTextDescription() && 
				!it.isFeatured() && 
				!it.isSystem() && 
				!blockStore.checkIsChild(rootId, block.id, it.id)
			);
		});

		if (!next) {
			return;
		};

		const element = blockStore.getMapElement(rootId, block.id);
		const parentElement = blockStore.getMapElement(rootId, block.parentId);
		const nextElement = blockStore.getMapElement(rootId, next.id)
		const nextParent = blockStore.getLeaf(rootId, next.parentId);
		const nextParentElement = blockStore.getMapElement(rootId, next.parentId);

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
				blockStore.toggle(rootId, nextParent.id, true);
			};

			if (next && next.isTextToggle()) {
				blockStore.toggle(rootId, next.id, true);
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
		const next = blockStore.getFirstBlock(rootId, -dir, it => it.isFocusable());
		
		this.focusNextBlock(next, dir);
	};

	// Expand selection up/down
	onShiftArrowEditor (e: any, pressed: string) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const dir = pressed.match(Key.up) ? -1 : 1;
		const ids = selection.get(I.SelectType.Block, false);
		const idsWithChildren = selection.get(I.SelectType.Block, true);

		if (ids.length == 1) {
			this.dir = dir;
		};

		let method = '';
		if (this.dir && (dir != this.dir)) {
			method = dir < 0 ? 'pop' : 'shift';
			ids[method]();
		} else {
			const idx = (dir < 0) ? 0 : idsWithChildren.length - 1;
			const next = blockStore.getNextBlock(rootId, idsWithChildren[idx], dir, it => !it.isSystem());

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
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused } = focus.state;
		const dir = pressed.match(Key.up) ? -1 : 1;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block || this.menuCheck()) {
			return;
		};

		const win = $(window);
		const st = win.scrollTop();
		const element = $(`#block-${block.id}`);
		const value = element.find('#value');

		let sRect = UtilCommon.getSelectionRect();
		let vRect: any = {};
		if (value && value.length) {
			vRect = value.get(0).getBoundingClientRect();
		} else 
		if (element && element.length) {
			vRect = element.get(0).getBoundingClientRect()
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
			menuStore.closeAll([ 'blockContext', 'blockAction' ]);
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
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const mark = Mark.getInRange(marks, type, range);
		const win = $(window);
		const cb = () => {
			focus.set(block.id, range);
			focus.apply(); 
		};

		if (type == I.MarkType.Link) {
			menuStore.close('blockContext', () => {
				menuStore.open('blockLink', {
					recalcRect: () => {
						const rect = UtilCommon.getSelectionRect();
						return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
					},
					horizontal: I.MenuDirection.Center,
					offsetY: 4,
					data: {
						filter: mark ? mark.param : '',
						type: mark ? mark.type : null,
						onChange: (newType: I.MarkType, param: string) => {
							marks = Mark.toggleLink({ type: newType, param, range }, marks);
							UtilData.blockSetText(rootId, block.id, text, marks, true, cb);
						}
					}
				});
			});
		} else {
			marks = Mark.toggle(marks, { type, param: mark ? '' : param, range });
			UtilData.blockSetText(rootId, block.id, text, marks, true, cb);
		};
	};

	// Backspace / Delete
	onBackspaceBlock (e: any, range: I.TextRange, pressed: string, length: number, props: any) {
		const { dataset, rootId } = this.props;
		const { isInsideTable } = props;
		const { selection } = dataset || {};
		const { focused } = focus.state;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block || isInsideTable) {
			return;
		};

		const isDelete = pressed == 'delete';
		const ids = selection.get(I.SelectType.Block, true);

		if (block.isText()) {
			if (!isDelete && !range.to) {
				if (block.isTextList() || block.isTextQuote() || block.isTextCallout()) {
					C.BlockListTurnInto(rootId, [ block.id ], I.TextStyle.Paragraph);
				} else {
					ids.length ? this.blockRemove(block) : this.blockMerge(block, -1, length);
				};
			};

			if (isDelete && (range.to == length)) {
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
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const element = blockStore.getMapElement(rootId, block.id);
		const parent = blockStore.getLeaf(rootId, element.parentId);
		const parentElement = blockStore.getMapElement(rootId, parent.id);

		if (!element || !parentElement) {
			return;
		};

		const idx = parentElement.childrenIds.indexOf(block.id);
		const nextId = parentElement.childrenIds[idx - 1];
		const next = nextId ? blockStore.getLeaf(rootId, nextId) : blockStore.getNextBlock(rootId, block.id, -1);
		const obj = isShift ? parent : next;
		
		let canTab = obj && !block.isTextTitle() && obj.canHaveChildren() && block.isIndentable();
		if (!isShift && parentElement.childrenIds.length && (block.id == parentElement.childrenIds[0])) {
			canTab = false;
		};

		if (!canTab) {
			return;
		};

		Action.move(rootId, rootId, obj.id, [ block.id ], (isShift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), () => {
			window.setTimeout(() => { this.focus(block.id, range.from, range.to, false); }, 50);

			if (next && next.isTextToggle()) {
				blockStore.toggle(rootId, next.id, true);
			};
		});
	};

	// Split
	onEnterBlock (e: any, range: I.TextRange, pressed: string) {
		const { rootId } = this.props;
		const { focused } = focus.state;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const length = block.getLength();
		const replace = !range.to && block.isTextList() && !length;

		if (block.isTextCode() && (pressed == 'enter')) {
			return;
		};
		if (!block.isText() && keyboard.isFocused) {
			return;
		};
		if (block.isText() && !block.isTextCode() && pressed.match('shift')) {
			return;
		};

		if (this.menuCheck()) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();

		if (replace) {
			C.BlockListTurnInto(rootId, [ block.id ], I.TextStyle.Paragraph);
		} else 
		if (!block.isText()) {  
			this.blockCreate(block.id, I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});
		} else {
			this.blockSplit(block, range);
		};
	};

	menuCheck () {
		const menus = menuStore.list;
		const exclude = [ 'blockContext', 'onboarding' ];
		return (menus.length > 1) || ((menus.length == 1) && (!exclude.includes(menus[0].id)));
	};

	getNextTableRow (id: string, dir: number) {
		const { rootId } = this.props;
		const element = blockStore.getMapElement(rootId, id);

		return blockStore.getNextBlock(rootId, element.parentId, dir, it => it.isTableRow());
	};

	onArrowVertical (e: any, pressed: string, range: I.TextRange, length: number, props: any) {
		if (menuStore.isOpen()) {
			return;
		};

		const { focused } = focus.state;
		const { rootId } = this.props;
		const { isInsideTable } = props;
		const block = blockStore.getLeaf(rootId, focused);
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
					next = blockStore.getNextBlock(rootId, focused, dir, it => (it.parentId != block.id) && it.isFocusable());
				} else {
					next = blockStore.getNextBlock(rootId, focused, dir, it => it.isFocusable());
				};
			};

			if (!next) {
				return;
			};

			e.preventDefault();

			const parent = blockStore.getHighestParent(rootId, next.id);

			// If highest parent is closed toggle, next is parent
			if (parent && parent.isTextToggle() && !Storage.checkToggle(rootId, parent.id)) {
				next = parent;
			};

			this.focusNextBlock(next, dir);
		};

		if (isInsideTable) {
			const element = blockStore.getMapElement(rootId, block.id);
			const rowElement = blockStore.getMapElement(rootId, element.parentId);
			const idx = rowElement.childrenIds.indexOf(block.id);
			const nextRow = this.getNextTableRow(block.id, dir);

			if ((idx >= 0) && nextRow) {
				const nextRowElement = blockStore.getMapElement(rootId, nextRow.id);
				C.BlockTableRowListFill(rootId, [ nextRow.id ], () => {
					if (nextRowElement) {
						next = blockStore.getLeaf(rootId, nextRowElement.childrenIds[idx]);
					};
					cb();
				});
			};
		} else {
			cb();
		};
	};

	onArrowHorizontal (e: any, pressed: string, range: I.TextRange, length: number, props: any) {
		const { focused } = focus.state;
		const { rootId } = this.props;
		const { isInsideTable } = props;
		const block = blockStore.getLeaf(rootId, focused);
		const withTab = pressed.match(Key.tab);
		const dir = pressed.match([ Key.left, Key.shift ].join('|')) ? -1 : 1;

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

		if (isInsideTable) {
			const element = blockStore.getMapElement(rootId, block.id);
			const rowElement = blockStore.getMapElement(rootId, element.parentId);
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
					const nextRow = this.getNextTableRow(block.id, dir);
					if (nextRow) {
						const nextRowElement = blockStore.getMapElement(rootId, nextRow.id);
						fill(nextRow.id, () => {
							nextCellId = nextRowElement.childrenIds[dir > 0 ? 0 : nextRowElement.childrenIds.length - 1];
							this.focusNextBlock(blockStore.getLeaf(rootId, nextCellId), dir);
						});
					};
				};

				this.focusNextBlock(blockStore.getLeaf(rootId, nextCellId), dir);
			};

			if (rowElement.childrenIds.length - 1 <= idx) {
				fill(element.parentId, cb);
			} else {
				cb();
			};
		} else {
			if (block.isTextToggle()) {
				if ((dir < 0) && (range.to == 0)) {
					blockStore.toggle(rootId, block.id, false);
				};
				if ((dir > 0) && (range.to == length)) {
					blockStore.toggle(rootId, block.id, true);
				};
			};

			this.onArrowVertical(e, (dir < 0 ? 'arrowup' : 'arrowdown'), range, length, props);
		};
	};

	onSelectAll () {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const ids = blockStore.getBlocks(rootId, it => it.isSelectable()).map(it => it.id); 
		
		selection.set(I.SelectType.Block, ids);
		selection.checkSelected(I.SelectType.Block);
	};
	
	onAdd (e: any) {
		if (!this.hoverId || (this.hoverPosition == I.BlockPosition.None)) {
			return;
		};
		
		const { rootId } = this.props;
		const block = blockStore.getLeaf(rootId, this.hoverId);
		
		if (!block || (block.isTextTitle() && (this.hoverPosition != I.BlockPosition.Bottom)) || block.isLayoutColumn() || block.isIcon()) {
			return;
		};
		
		commonStore.filterSet(0, '');
		focus.clear(true);

		this.blockCreate(block.id, this.hoverPosition, { type: I.BlockType.Text }, (blockId: string) => {
			$('.placeholder.c' + blockId).text(translate('placeholderFilter'));
			this.onMenuAdd(blockId, '', { from: 0, to: 0 }, []);
		});
	};
	
	onMenuAdd (blockId: string, text: string, range: I.TextRange, marks: I.Mark[]) {
		const { rootId } = this.props;
		const block = blockStore.getLeaf(rootId, blockId);
		const win = $(window);

		if (!block) {
			return;
		};

		commonStore.filterSet(range.from, '');

		menuStore.open('blockAdd', { 
			element: $(`#block-${blockId}`),
			subIds: Constant.menuIds.add,
			recalcRect: () => {
				const rect = UtilCommon.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			offsetX: () => {
				const rect = UtilCommon.getSelectionRect();
				return rect ? 0 : Constant.size.blockMenu;
			},
			commonFilter: true,
			onClose: () => {
				focus.apply();
				commonStore.filterSet(0, '');
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
		const top = UtilCommon.getScrollContainer(isPopup).scrollTop();

		this.scrollTop = top;

		Storage.setScroll('editor' + (isPopup ? 'Popup' : ''), rootId, top);
		Preview.previewHide(false);
	};
	
	onCopy (e: any, cut: boolean) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const readonly = this.isReadonly();
		const root = blockStore.getLeaf(rootId, rootId);
		const { focused } = focus.state;

		if (!root || (readonly && cut)) {
			return;
		};

		let ids = selection.get(I.SelectType.Block, true);

		if (root.isLocked() && !ids.length) {
			return;
		};

		e.preventDefault();

		if (!ids.length) {
			ids = [ focused ];
		};
		ids = ids.concat(this.getLayoutIds(ids));

		const range = UtilCommon.objectCopy(focus.state.range);
		const cmd = cut ? 'BlockCut' : 'BlockCopy';
		const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
		const text: string[] = [];

		let blocks = blockStore.unwrapTree(tree).filter((it: I.Block) => {
			return ids.indexOf(it.id) >= 0;
		});

		ids.forEach((id: string) => {
			const block = blockStore.getLeaf(rootId, id);
			if (block && block.isTable()) {
				blocks = blocks.concat(blockStore.unwrapTree([ blockStore.wrapTree(rootId, block.id) ]));
			};
		});

		blocks = UtilCommon.arrayUniqueObjects(blocks, 'id');
		blocks = blocks.map((it: I.Block) => {
			const element = blockStore.getMapElement(rootId, it.id);

			if (it.type == I.BlockType.Text) {
				text.push(String(it.content.text || ''));
			};

			if (it.type == I.BlockType.Dataview) {
				it.content.views = dbStore.getViews(rootId, it.id);
			};

			it.childrenIds = element.childrenIds;
			return it;
		});
		
		C[cmd](rootId, blocks, range, (message: any) => {
			UtilCommon.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range: range,
					blocks: (message.anySlot || []).map(Mapper.From.Block),
				},
			});

			if (cut) {
				menuStore.closeAll([ 'blockContext', 'blockAction' ]);

				focus.set(focused, { from: range.from, to: range.from });
				focus.apply();
			};
		});

		analytics.event(cut ? 'CutBlock' : 'CopyBlock');
	};

	onPaste (e: any, props: any, force?: boolean, data?: any) {
		if (keyboard.isPasteDisabled) {
			return;
		};

		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused, range } = focus.state;
		const files = UtilCommon.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items);

		menuStore.closeAll([ 'blockAdd' ]);

		if (this.isReadonly()) {
			return;
		};

		if (!data) {
			data = this.getClipboardData(e);
		};

		if (files.length && !data.files.length) {
			UtilCommon.saveClipboardFiles(files, data, (data: any) => {
				this.onPaste(e, props, force, data);
			});
			return;
		};

		e.preventDefault();

		const block = blockStore.getLeaf(rootId, focused);
		const match = UtilCommon.matchUrl(data.text);
		const url = match && match[0];
		
		if (block && url && !force && !block.isTextTitle() && !block.isTextDescription()) {
			this.onPasteUrl(url, props);
			return;
		};
		
		let id = '';
		let from = 0;
		let to = 0;

		C.BlockPaste(rootId, focused, range, selection.get(I.SelectType.Block, true), data.anytype.range.to > 0, { ...data, anytype: data.anytype.blocks }, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (message.isSameBlockCaret) {
				id = focused;
			} else 
			if (message.blockIds && message.blockIds.length) {
				const lastId = message.blockIds[message.blockIds.length - 1];
				const block = blockStore.getLeaf(rootId, lastId);
				
				if (!block) {
					return;
				};
				
				id = block.id;
				from = to = block.getLength();
			} else 
			if (message.caretPosition >= 0) {
				id = focused;
				from = to = message.caretPosition;
			};

			this.focus(id, from, to, true);
			analytics.event('PasteBlock');
		});
	};

	onPasteUrl (url: string, props: any) {
		const { isInsideTable } = props;
		const { rootId } = this.props;
		const { focused, range } = focus.state;
		const currentFrom = range.from;
		const currentTo = range.to;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const first = blockStore.getFirstBlock(rootId, 1, (it) => it.isText() && !it.isTextTitle() && !it.isTextDescription());
		const object = detailStore.get(rootId, rootId, [ 'internalFlags' ]);
		const isEmpty = first && (focused == first.id) && !first.getLength() && (object.internalFlags || []).includes(I.ObjectFlag.DeleteEmpty);

		const options: any[] = [
			{ id: 'link', name: 'Paste as link' },
			isEmpty && !isInsideTable ? { id: 'object', name: translate('editorPageCreateBookmarkObject') } : null,
			!isInsideTable ? { id: 'block', name: translate('editorPageCreateBookmark') } : null,
			{ id: 'cancel', name: translate('editorPagePasteText') },
			//{ id: 'embed', name: translate('editorPagePasteEmbed') },
		].filter(it => it);

		menuStore.open('select', { 
			element: `#block-${focused}`,
			offsetX: Constant.size.blockMenu,
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
					let value = block.content.text;
					let to = 0;
					let marks = UtilCommon.objectCopy(block.content.marks || []);

					switch (item.id) {
						case 'link':
							if (currentFrom == currentTo) {
								value = UtilCommon.stringInsert(value, url + ' ', currentFrom, currentFrom);
								to = currentFrom + url.length;
							} else {
								to = currentTo;
							};

							marks.push({
								type: I.MarkType.Link,
								range: { from: currentFrom, to },
								param: url,
							});

							UtilData.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;

						case 'object':
							C.ObjectToBookmark(rootId, url, (message: any) => {
								if (message.error.code) {
									return;
								};

								UtilObject.openRoute({ id: message.objectId, layout: I.ObjectLayout.Bookmark });

								analytics.event('CreateObject', {
									route: 'Bookmark',
									objectType: Constant.typeId.bookmark,
									layout: I.ObjectLayout.Bookmark,
									template: '',
								});
							});
							break;

						case 'block':
							C.BlockBookmarkCreateAndFetch(rootId, focused, length ? I.BlockPosition.Bottom : I.BlockPosition.Replace, url, (message: any) => {
								if (!message.error.code) {
									analytics.event('CreateBlock', { middleTime: message.middleTime, type: I.BlockType.Bookmark });
								};
							});
							break;

						case 'cancel':
							value = UtilCommon.stringInsert(block.content.text, url + ' ', currentFrom, currentFrom);
							to = currentFrom + url.length;

							UtilData.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;
					};
				},
			}
		});
	};

	getClipboardData (e: any) {
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const data: any = {
			text: String(cb.getData('text/plain') || ''),
			html: String(cb.getData('text/html') || ''),
			anytype: JSON.parse(String(cb.getData('application/json') || '{}')),
			files: [],
		};
		data.anytype.range = data.anytype.range || { from: 0, to: 0 };
		return data;
	};

	onHistory (e: any) {
		const { rootId } = this.props;

		e.shiftKey = false;
		e.ctrlKey = false;
		e.metaKey = false;

		UtilObject.openEvent(e, { layout: I.ObjectLayout.History, id: rootId });
	};

	getLayoutIds (ids: string[]) {
		if (!ids.length) {
			return [];
		};
		
		const { rootId } = this.props;
		
		let ret: any[] = [];
		for (let id of ids) {
			let element = blockStore.getMapElement(rootId, id);
			if (!element) {
				continue;
			};

			let parent = blockStore.getLeaf(rootId, element.parentId);
			if (!parent || !parent.isLayout() || parent.isLayoutDiv() || parent.isLayoutHeader()) {
				continue;
			};
			
			ret.push(parent.id);
			
			if (parent.isLayoutColumn()) {
				ret = ret.concat(this.getLayoutIds([ parent.id ]));
			};
		};
		
		return ret;
	};

	blockCreate (blockId: string, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;

		C.BlockCreate(rootId, blockId, position, param, (message: any) => {
			if (param.type == I.BlockType.Text) {
				window.setTimeout(() => { this.focus(message.blockId, 0, 0, false); }, 15);
			};

			if (callBack) {
				callBack(message.blockId);
			};

			const event: any =  {
				middleTime: message.middleTime,
				type: param.type,
				style: param.content?.style,
				params: {},
			};

			if (param.type == I.BlockType.File) {
				event.params.fileType = param.content.type;
			};

			analytics.event('CreateBlock', event);
		});
	};
	
	blockMerge (focused: I.Block, dir: number, length: number) {
		const { rootId } = this.props;
		const next = blockStore.getNextBlock(rootId, focused.id, dir, it => it.isFocusable());

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
					const next = blockStore.getNextBlock(rootId, focused.id, -1, it => it.isFocusable());
					if (next) {
						const nl = dir < 0 ? next.getLength() : 0;
						this.focus(next.id, nl, nl, false);
					};
				};
			});
		};
	};
	
	blockSplit (focused: I.Block, range: I.TextRange) {
		const { rootId } = this.props;
		const { content } = focused;
		const isTitle = focused.isTextTitle();
		const isToggle = focused.isTextToggle();
		const isCallout = focused.isTextCallout();
		const isList = focused.isTextList();
		const isCode = focused.isTextCode();
		const isOpen = Storage.checkToggle(rootId, focused.id);
		const childrenIds = blockStore.getChildrenIds(rootId, focused.id);
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

		if (isCallout) {
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
				blockStore.toggle(rootId, message.blockId, true);
			};

			analytics.event('CreateBlock', { middleTime: message.middleTime, type: I.BlockType.Text, style });
		});
	};
	
	blockRemove (focused?: I.Block) {
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};

		menuStore.closeAll();
		popupStore.closeAll([ 'preview' ]);

		let ids = selection.get(I.SelectType.Block);
		let blockIds = [];

		if (ids.length) {
			blockIds = [ ...ids ];
		} else 
		if (focused) {
			blockIds = [ focused.id ];
		};

		blockIds = blockIds.filter((it: string) => {  
			const block = blockStore.getLeaf(rootId, it);
			return block && block.isDeletable();
		});

		if (!blockIds.length) {
			return;
		};

		focus.clear(true);
		let next = blockStore.getNextBlock(rootId, blockIds[0], -1, it => it.isFocusable());

		C.BlockListDelete(rootId, blockIds, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (next) {
				const parent = blockStore.getHighestParent(rootId, next.id);

				// If highest parent is closed toggle, next is parent
				if (parent && parent.isTextToggle() && !Storage.checkToggle(rootId, parent.id)) {
					next = parent;
				};

				const length = next.getLength();
				this.focus(next.id, length, length, true);
			};
		});
	};
	
	onLastClick (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const readonly = this.isReadonly();

		if (!root || readonly) {
			return;
		};

		let last = blockStore.getFirstBlock(rootId, -1, it => it.canCreateBlock());
		let create = false;
		let length = 0;

		if (last) {
			let element = blockStore.getMapElement(rootId, last.id)
			let parent = blockStore.getLeaf(rootId, element.parentId);

			if (!parent.isLayoutDiv() && !parent.isPage()) {
				last = null;
			};
		};
		
		if (!last) {
			create = true;
		} else {
			if (!last.isText() || last.isTextCode()) {
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
	
	resizePage () {
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
			const pageContainer = UtilCommon.getPageContainer(this.props.isPopup);
			const header = pageContainer.find('#header');
			const root = blockStore.getLeaf(rootId, rootId);
			const scrollContainer = UtilCommon.getScrollContainer(isPopup);
			const hh = isPopup ? header.height() : UtilCommon.sizeHeader();

			this.setLayoutWidth(root?.fields?.width);

			if (blocks.length && last.length && scrollContainer.length) {
				const ct = isPopup ? scrollContainer.offset().top : 0;
				const ch = scrollContainer.height();
				const height = Math.max(ch / 2, ch - blocks.outerHeight() - blocks.offset().top - ct - 2);

				last.css({ height: Math.max(Constant.size.lastBlock, height) });
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
		});
	};

	focus (id: string, from: number, to: number, scroll: boolean) {
		const { isPopup } = this.props;

		window.setTimeout(() => {
			focus.set(id, { from: from, to: to });
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

		const node = $(this.node);
		const width = this.getWidth(v);
		const elements = node.find('#elements');

		this.width = width;

		node.css({ width });
		elements.css({ width, marginLeft: -width / 2 });

		if (this.refHeader && this.refHeader.refDrag) {
			this.refHeader.refDrag.setValue(v);
			this.refHeader.setPercent(v);
		};
	};

	getWidth (w: number) {
		w = Number(w) || 0;

		const { isPopup, rootId } = this.props;
		const container = UtilCommon.getPageContainer(isPopup);
		const root = blockStore.getLeaf(rootId, rootId);

		let mw = container.width();
		let width = 0;

		if (root && root.isObjectSet()) {
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
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);

		return root?.isLocked() || !allowed;
	};

	setLoading (v: boolean): void {
		this.setState({ isLoading: v });
	};

});

export default EditorPage;