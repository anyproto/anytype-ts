import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon, Loader, Deleted, DropTarget } from 'Component';
import { commonStore, blockStore, detailStore, menuStore, popupStore } from 'Store';
import { I, C, Key, Util, DataUtil, Mark, focus, keyboard, crumbs, Storage, Mapper, Action, translate, analytics, Renderer } from 'Lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

import Controls from 'Component/page/head/controls';
import PageHeadEdit from 'Component/page/head/edit';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
	isPopup: boolean;
	onOpen?(): void;
};

const Constant = require('json/constant.json');
const Errors = require('json/error.json');
const $ = require('jquery');
const raf = require('raf');

const THROTTLE = 40;
const BUTTON_OFFSET = 10;

const EditorPage = observer(class EditorPage extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	id: string = '';
	timeoutMove: number = 0;
	timeoutScreen: number = 0;
	hoverId: string =  '';
	hoverPosition: I.BlockPosition = I.BlockPosition.None;
	scrollTop: number = 0;
	uiHidden: boolean = false;
	loading: boolean = false;
	isDeleted: boolean = false;
	width: number = 0;
	refHeader: any = null;
	dir: number = 0;
	frame: number = 0;

	constructor (props: any) {
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
		this.getWrapper = this.getWrapper.bind(this);
		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.resize = this.resize.bind(this);
		this.focusTitle = this.focusTitle.bind(this);
		this.blockRemove = this.blockRemove.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (this.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		if (!root) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId, (it: any) => { return !it.isLayoutHeader(); });
		const length = childrenIds.length;
		const width = root.fields?.width;
		const readonly = this.isReadonly();

		return (
			<div id="editorWrapper">
				<Controls 
					key="editorControls" 
					{...this.props} 
					resize={this.resize} 
					onLayoutSelect={(layout: I.ObjectLayout) => { this.focusTitle(); }} 
				/>
				
				<div id={'editor-' + rootId} className="editor">
					<div className="blocks">
						<Icon id="button-block-add" className="buttonAdd" onClick={this.onAdd} />

						<PageHeadEdit 
							{...this.props} 
							ref={(ref: any) => { this.refHeader = ref; }}
							onKeyDown={this.onKeyDownBlock}
							onKeyUp={this.onKeyUpBlock}  
							onMenuAdd={this.onMenuAdd}
							onPaste={this.onPaste}
							onResize={(v: number) => { this.onResize(v); }}
							readonly={readonly}
							getWrapper={this.getWrapper}
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
								getWrapper={this.getWrapper}
								getWrapperWidth={this.getWrapperWidth}
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
		const { dataset, isPopup } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		const namespace = isPopup ? '-popup' : '';

		this._isMounted = true;

		this.resize();
		this.unbind();
		this.open();

		keyboard.disableClose(false);

		win.on('mousemove.editor' + namespace, throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('keydown.editor' + namespace, (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor' + namespace, (e: any) => {
			if (!keyboard.isFocused) {
				this.onPaste(e, {});
			};
		});
		win.on('focus.editor' + namespace, (e: any) => {
			let ids: string[] = [];
			if (selection) {
				ids = selection.get(I.SelectType.Block, true);
			};
			if (!ids.length && !menuStore.isOpen()) {
				focus.restore();
				focus.apply(); 
			};
			Util.getScrollContainer(isPopup).scrollTop(this.scrollTop);
		});

		this.resize();
		win.on('resize.editor' + namespace, (e: any) => { this.resize(); });

		Util.getScrollContainer(isPopup).on('scroll.editor' + namespace, throttle((e: any) => { this.onScroll(e); }, THROTTLE));

		Storage.set('askSurvey', 1);

		Renderer.remove('commandEditor');
		Renderer.on('commandEditor', (e: any, cmd: string, arg: any) => { this.onCommand(cmd, arg); });
	};

	componentDidUpdate () {
		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const resizable = node.find('.resizable');
		
		this.open();
		
		focus.apply();
		Util.getScrollContainer(isPopup).scrollTop(this.scrollTop);

		if (resizable.length) {
			resizable.trigger('resizeInit');
		};

		this.resize();
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

	getWrapper () {
		return $(ReactDOM.findDOMNode(this));
	};

	getWrapperWidth (): number {
		return this.width;
	};

	open () {
		const { rootId, onOpen, isPopup } = this.props;

		if (this.id == rootId) {
			return;
		};

		this.loading = true;
		this.isDeleted = false;
		this.forceUpdate();
		
		this.id = rootId;

		C.ObjectOpen(this.id, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
					Util.onErrorUpdate(() => { Util.route('/main/index'); });
				} else 
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.isDeleted = true;
					this.forceUpdate();
				} else {
					Util.route('/main/index');
				};
				return;
			};

			crumbs.addRecent(rootId);
			
			this.loading = false;
			this.focusTitle();
			this.forceUpdate();
			
			Util.getScrollContainer(isPopup).scrollTop(Storage.getScroll('editor' + (isPopup ? 'Popup' : ''), rootId));

			if (onOpen) {
				onOpen();
			};

			window.clearTimeout(this.timeoutMove);
			window.setTimeout(() => { this.uiShow(); }, 10);
			this.resize();
		});
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
	
	unbind () {
		const { isPopup } = this.props;
		const namespace = isPopup ? '-popup' : '';
		const events = 'keydown.editor mousemove.editor scroll.editor paste.editor resize.editor focus.editor';
		const a = events.split(' ').map(it => it + namespace);

		$(window).off(a.join(' '));
	};
	
	uiHide () {
		if (this.uiHidden) {
			return;
		};

		const obj = this.getContainer();

		obj.find('#footer').css({ opacity: 0 });
		
		this.uiHidden = true;
		
		window.clearTimeout(this.timeoutMove);
		this.timeoutMove = window.setTimeout(() => {
			$(window).off('mousemove.ui').on('mousemove.ui', (e: any) => { this.uiShow(); });
		}, 100);
	};

	uiShow () {
		if (!this.uiHidden) {
			return;
		};

		const obj = this.getContainer();
		
		obj.find('#footer').css({ opacity: 1 });
		
		this.uiHidden = false;
		$(window).off('mousemove.ui');
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const checkType = blockStore.checkBlockTypeExists(rootId);
		const readonly = this.isReadonly();

		if (
			!root || 
			readonly || 
			checkType || 
			(root && root.isLocked()) || 
			keyboard.isResizing || 
			menuStore.isOpen() || 
			this.loading
		) {
			return;
		};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const container = node.find('.editor');
		
		if (!container.length) {
			return;
		};

		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const featured = node.find(`#block-${Constant.blockId.featured}`);
		const st = win.scrollTop();
		const button = node.find('#button-block-add');
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

			let el = obj.get(0);
			let rect = el.getBoundingClientRect() as DOMRect;

			rect.y += st;

			if ((pageX >= rect.x) && (pageX <= rect.x + rect.width) && (pageY >= rect.y) && (pageY <= rect.y + rect.height)) {
				this.hoverId = block.id;
				hovered = el as Element;
				hoveredRect = rect;
			};
		};

		if (hovered) {
			hovered = $(hovered);
		};
		
		const { x, y, height } = hoveredRect;
		const out = () => {
			button.removeClass('show');
			node.find('.block.showMenu').removeClass('showMenu');
			node.find('.block.isAdding').removeClass('isAdding top bottom');
		};
		
		if (this.frame) {
			raf.cancel(this.frame);
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

		this.frame = raf(() => {
			if (this.hoverPosition == I.BlockPosition.None) {
				out();
				return;
			};

			let buttonX = hoveredRect.x - (rectContainer.x - Constant.size.blockMenu) + 2;
			let buttonY = pageY - rectContainer.y - BUTTON_OFFSET - st;
			
			button.addClass('show').css({ transform: `translate3d(${buttonX}px,${buttonY}px,0px)` });
			node.find('.block').addClass('showMenu').removeClass('isAdding top bottom');
			
			if (pageX <= x + 20) {
				hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
			};
		});
	};
	
	onKeyDownEditor (e: any) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const menuOpen = menuStore.isOpen();
		const popupOpen = popupStore.isOpenList([ 'search' ]);
		const root = blockStore.getLeaf(rootId, rootId);

		if (keyboard.isFocused || !selection || !root) {
			return;
		};

		Util.previewHide(true);
		
		const ids = selection.get(I.SelectType.Block);
		const cmd = keyboard.ctrlKey();
		const readonly = this.isReadonly();

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
		keyboard.shortcut(`${cmd}+z`, e, (pressed: string) => {
			if (!readonly) {
				e.preventDefault();
				keyboard.onUndo(rootId, (message: any) => { focus.clear(true); });
			};
		});

		// Redo
		keyboard.shortcut(`${cmd}+shift+z`, e, (pressed: string) => {
			if (readonly) {
				e.preventDefault();
				keyboard.onRedo(rootId, (message: any) => { focus.clear(true); });
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
					selection.clear(false);
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
			keyboard.shortcut(`${cmd}+d`, e, (pressed: string) => {
				if (readonly) {
					return;
				};

				e.preventDefault();
				Action.duplicate(rootId, rootId, ids[ids.length - 1], ids, I.BlockPosition.Bottom, () => { focus.clear(true); });
			});

			// Open action menu
			keyboard.shortcut(`${cmd}+/, ctrl+shift+/`, e, (pressed: string) => {
				menuStore.closeAll([ 'blockContext', 'blockAdd' ], () => {
					menuStore.open('blockAction', { 
						element: '#block-' + ids[0],
						offsetX: Constant.size.blockMenu,
						data: {
							blockId: ids[0],
							blockIds: ids,
							rootId: rootId,
							dataset: dataset,
						},
						onClose: () => {
							selection.clear(true);
							focus.apply();
						}
					});
				});
			});
		};

		// Remove blocks
		keyboard.shortcut('backspace, delete', e, (pressed: string) => {
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

			selection.clear(false);
			focus.restore();
			focus.apply();
		});

		// Enter
		keyboard.shortcut('enter', e, (pressed: string) => {
			if (menuOpen || popupOpen || readonly) {
				return;
			};

			selection.clear(false);
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

		const platform = Util.getPlatform();
		const cmd = keyboard.ctrlKey();

		// Last line break doesn't expand range.to
		let length = String(text || '').length;
		if (length && (text[length - 1] == '\n')) {
			length--;
		};

		Util.previewHide(true);
		this.uiHide();
		
		if (platform == I.Platform.Mac) {
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
			keyboard.shortcut(`${cmd}+z`, e, (pressed: string) => {
				e.preventDefault();
				keyboard.onUndo(rootId, (message: any) => { focus.clear(true); });
			});

			// Redo
			keyboard.shortcut(`${cmd}+shift+z`, e, (pressed: string) => {
				e.preventDefault();
				keyboard.onRedo(rootId, (message: any) => { focus.clear(true); });
			});

		};

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, (pressed: string) => {
			e.preventDefault();
			this.onHistory(e);
		});

		// Duplicate
		keyboard.shortcut(`${cmd}+d`, e, (pressed: string) => {
			e.preventDefault();
			Action.duplicate(rootId, rootId, block.id, [ block.id ], I.BlockPosition.Bottom);
		});

		// Open action menu
		keyboard.shortcut(`${cmd}+/, ctrl+shift+/`, e, (pressed: string) => {
			menuStore.close('blockContext', () => {
				menuStore.open('blockAction', { 
					element: `#block-${block.id}`,
					offsetX: Constant.size.blockMenu,
					data: {
						blockId: block.id,
						blockIds: DataUtil.selectionGet(block.id, true, this.props),
						rootId: rootId,
						dataset: dataset,
					},
					onClose: () => {
						selection.clear(true);
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
				this.onBackspaceBlock(e, range, pressed, props);
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
					this.onArrowHorizontal(e, isShift ? Key.left : Key.right, { from: length, to: length }, length, props);
				} else {
					this.onTabBlock(e, isShift);
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

	getMarkParam () {
		const cmd = keyboard.ctrlKey();
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
	onCtrlShiftArrowBlock (e: any, pressed: string) {
		e.preventDefault();

		const { rootId } = this.props;
		const { focused } = focus.state;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const dir = pressed.match(Key.up) ? -1 : 1;
		const next = blockStore.getNextBlock(rootId, block.id, dir, (it: any) => {
			return !it.isIcon() && !it.isTextTitle() && !it.isSystem();
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

		let isFirst = block.id == parentElement.childrenIds[0];
		let isLast = block.id == parentElement.childrenIds[parentElement.childrenIds.length - 1];
		let position = dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom;

		if ((dir > 0) && next.canHaveChildren() && nextElement.childrenIds.length) {
			position = isLast ? I.BlockPosition.Top : I.BlockPosition.InnerFirst;
		};

		if ((dir < 0) && nextParent.canHaveChildren() && nextParentElement.childrenIds.length && (element.parentId != nextParent.id)) {
			position = isFirst ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		};

		Action.move(rootId, rootId, next.id, [ block.id ], position, () => { focus.apply(); });
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
			const next = blockStore.getNextBlock(rootId, idsWithChildren[idx], dir, (it: any) => { return !it.isSystem(); });

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

		let sRect = Util.selectionRect();
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
		const el = $(`#block-${block.id}`);
		const win = $(window);

		if (type == I.MarkType.Link) {
			menuStore.close('blockContext', () => {
				menuStore.open('blockLink', {
					element: el,
					recalcRect: () => {
						const rect = Util.selectionRect();
						return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
					},
					horizontal: I.MenuDirection.Center,
					offsetY: 4,
					data: {
						filter: mark ? mark.param : '',
						type: mark ? mark.type : null,
						onChange: (newType: I.MarkType, param: string) => {
							marks = Mark.toggleLink({ type: newType, param: param, range: range }, marks);
							DataUtil.blockSetText(rootId, block.id, text, marks, true, () => { focus.apply(); });
						}
					}
				});
			});
		} else {
			marks = Mark.toggle(marks, { type: type, param: mark ? '' : param, range: range });
			DataUtil.blockSetText(rootId, block.id, text, marks, true, () => { focus.apply(); });
		};
	};

	// Backspace / Delete
	onBackspaceBlock (e: any, range: I.TextRange, pressed: string, props: any) {
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
		const length = block.getLength();

		if (block.isText()) {
			if (!isDelete && !range.to) {
				if (block.isTextList() || block.isTextQuote() || block.isTextCallout()) {
					C.BlockListTurnInto(rootId, [ block.id ], I.TextStyle.Paragraph);
				} else {
					ids.length ? this.blockRemove(block) : this.blockMerge(block, -1);
				};
			};

			if (isDelete && (range.to == length)) {
				ids.length ? this.blockRemove(block) : this.blockMerge(block, 1);
			};
		};
		if (!block.isText() && !keyboard.isFocused) {
			this.blockRemove(block);
		};
	};

	// Indentation
	onTabBlock (e: any, isShift: boolean) {
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
			window.setTimeout(() => { focus.apply(); });

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

		if (blockStore.checkBlockTypeExists(rootId)) {
			const object = detailStore.get(rootId, rootId, []);
			analytics.event('CreateObject', { 
				route: 'Editor',
				objectType: object.type, 
				layout: object.layout,
			});
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
		const dir = pressed.match(Key.left) ? -1 : 1;

		if (!block) {
			return;
		};

		if (block.isTextToggle()) {
			if ((dir < 0) && (range.to == 0)) {
				blockStore.toggle(rootId, block.id, false);
			};
			if ((dir > 0) && (range.to == length)) {
				blockStore.toggle(rootId, block.id, true);
			};
		} else 
		if (isInsideTable && ((dir < 0) && (range.to == 0) || (dir > 0) && (range.to == length))) {
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

			if (rowElement.childrenIds.length - 1 < idx) {
				fill(element.parentId, cb);
			} else {
				cb();
			};
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
			element: $('#block-' + blockId),
			recalcRect: () => {
				const rect = Util.selectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			offsetX: () => {
				const rect = Util.selectionRect();
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
				blockCreate: this.blockCreate,
			},
		});
	};
	
	onScroll (e: any) {
		const { rootId, isPopup } = this.props;
		const top = Util.getScrollContainer(isPopup).scrollTop();

		this.scrollTop = top;
		Storage.setScroll('editor' + (isPopup ? 'Popup' : ''), rootId, top);
		Util.previewHide(false);
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

		const range = Util.objectCopy(focus.state.range);
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

		blocks = Util.arrayUniqueObjects(blocks, 'id');
		blocks = blocks.map((it: I.Block) => {
			const element = blockStore.getMapElement(rootId, it.id);

			if (it.type == I.BlockType.Text) {
				text.push(String(it.content.text || ''));
			};

			it.childrenIds = element.childrenIds;
			return it;
		});
		
		C[cmd](rootId, blocks, range, (message: any) => {
			Util.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range: range,
					blocks: (message.anySlot || []).map(Mapper.From.Block),
				},
			});

			if (cut) {
				menuStore.close('blockContext');

				focus.set(focused, { from: range.from, to: range.from });
				focus.apply();
			};
		});

		analytics.event(cut ? 'CutBlock' : 'CopyBlock');
	};
	
	onPaste (e: any, props: any, force?: boolean, data?: any) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused, range } = focus.state;
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const items = cb.items;
		const files: any[] = [];

		menuStore.closeAll([ 'blockAdd' ]);

		if (this.isReadonly()) {
			return;
		};

		if (!data) {
			data = this.getClipboardData(e);
		};

		if (items && items.length) {
			for (let item of items) {
				if (item.kind != 'file') {
					continue;
				};

				const file = item.getAsFile();
				if (file) {
					files.push({ name: file.name, path: file.path });
				};
			};
		};

		e.preventDefault();

		const block = blockStore.getLeaf(rootId, focused);
		const match = Util.matchUrl(data.text);
		const url = match && match[0];
		
		if (block && url && !force && !block.isTextTitle() && !block.isTextDescription()) {
			this.onPasteUrl(url, props);
			return;
		};
		
		let id = '';
		let from = 0;
		let to = 0;

		C.BlockPaste(rootId, focused, range, selection.get(I.SelectType.Block, true), data.anytype.range.to > 0, { ...data, anytype: data.anytype.blocks, files }, (message: any) => {
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
			isEmpty && !isInsideTable ? { id: 'object', name: 'Create bookmark object' } : null,
			!isInsideTable ? { id: 'block', name: 'Create bookmark' } : null,
			{ id: 'cancel', name: 'Paste as text' },
			//{ id: 'embed', name: 'Paste as embed' },
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
					let to = range.from + url.length;
					let marks = Util.objectCopy(block.content.marks || []);

					switch (item.id) {
						case 'link':
							value = Util.stringInsert(value, url + ' ', range.from, range.from);
							marks.push({
								type: I.MarkType.Link,
								range: { from: range.from, to: to },
								param: url,
							});

							DataUtil.blockSetText(rootId, block.id, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
							break;

						case 'object':
							C.ObjectToBookmark(rootId, url, (message: any) => {
								if (message.error.code) {
									return;
								};

								DataUtil.objectOpenRoute({ id: message.objectId, layout: I.ObjectLayout.Bookmark });

								analytics.event('CreateObject', {
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
							value = Util.stringInsert(block.content.text, url + ' ', range.from, range.from);

							DataUtil.blockSetText(rootId, block.id, value, marks, true, () => {
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

		DataUtil.objectOpenEvent(e, { layout: I.ObjectLayout.History, id: rootId });
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
			this.focus(message.blockId, 0, 0, false);

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
	
	blockMerge (focused: I.Block, dir: number) {
		const { rootId } = this.props;
		const next = blockStore.getNextBlock(rootId, focused.id, dir, it => it.isFocusable());

		if (!next) {
			return;
		};

		let blockId = '';
		let targetId = '';
		let to = 0;
		let length = focused.getLength();

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
				this.focus(blockId, to, to, false);
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

				const next = blockStore.getNextBlock(rootId, focused.id, -1, it => it.isFocusable());
				if (next) {
					const nl = dir < 0 ? next.getLength() : 0;
					this.focus(next.id, nl, nl, false);
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

		const next = blockStore.getNextBlock(rootId, blockIds[0], -1, it => it.isFocusable());

		blockIds = blockIds.filter((it: string) => {  
			let block = blockStore.getLeaf(rootId, it);
			return block && block.isDeletable();
		});

		if (blockIds.length) {
			focus.clear(true);
			C.BlockListDelete(rootId, blockIds, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				if (next) {
					let length = next.getLength();
					this.focus(next.id, length, length, false);
				};
			});
		};
	};
	
	onLastClick (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const readonly = this.isReadonly();

		if (!root || readonly) {
			return;
		};

		let last = blockStore.getFirstBlock(rootId, -1, (item: any) => { return item.canCreateBlock(); });
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
			this.focus(last.id, length, length, false);
		};
	};
	
	resize () {
		if (this.loading || !this._isMounted) {
			return;
		};

		const { rootId, isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const note = node.find('#note');
		const blocks = node.find('.blocks');
		const last = node.find('#blockLast');
		const size = node.find('#editorSize');
		const cover = node.find('.block.blockCover');
		const obj = this.getContainer();
		const header = obj.find('#header');
		const root = blockStore.getLeaf(rootId, rootId);
		const container = Util.getScrollContainer(isPopup);
		const hh = isPopup ? header.height() : Util.sizeHeader();

		if (blocks.length && last.length) {
			last.css({ height: '' });

			const ct = isPopup ? container.offset().top : 0;
			const h = container.height();
			const height = blocks.outerHeight() + blocks.offset().top - ct;

			last.css({ height: Math.max(Constant.size.lastBlock, h - height) });
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

		this.onResize(root?.fields?.width);
	};

	getContainer () {
		return Util.getPageContainer(this.props.isPopup);
	};
	
	focus (id: string, from: number, to: number, scroll: boolean) {
		const { isPopup } = this.props;

		focus.set(id, { from: from, to: to });
		focus.apply();

		if (scroll) {
			focus.scroll(isPopup, id);
		};

		this.resize();
	};

	focusNextBlock (next: I.Block, dir: number) {
		if (!next) {
			return;
		};

		const l = next.getLength();
		const from = dir > 0 ? 0 : l;

		this.focus(next.id, from, from, true);
	};

	onResize (v: number) {
		v = Number(v) || 0;

		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const width = this.getWidth(v);
		const elements = node.find('#elements');
		const blocks = blockStore.getBlocks(rootId, it => it.isTable());

		node.css({ width: width });
		elements.css({ width: width, marginLeft: -width / 2 });

		/*
		blocks.forEach((block: I.Block) => {
			const el = node.find(`#block-${block.id} #wrap`);
			if (el.length) {
				el.trigger('resize');
			};
		});
		*/

		if (this.refHeader && this.refHeader.refDrag) {
			this.refHeader.refDrag.setValue(v);
			this.refHeader.setPercent(v);
		};
	};

	getWidth (w: number) {
		const { isPopup, rootId } = this.props;
		const container = Util.getPageContainer(isPopup);
		const root = blockStore.getLeaf(rootId, rootId);
		const size = Constant.size.editor;

		let mw = container.width();

		if (root && root.isObjectSet()) {
			this.width = mw - 192;
		} else {
			mw -= 120;

			w = Number(w) || 0;
			w = (mw - size) * w;

			this.width = Math.max(size, Math.min(mw, size + w));
		};

		return this.width;
	};

	isReadonly () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
		return root?.isLocked() || !allowed;
	};

});

export default EditorPage;