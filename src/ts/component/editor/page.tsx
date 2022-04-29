import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon, Loader, Deleted } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore, popupStore } from 'ts/store';
import { I, C, Key, Util, DataUtil, Mark, focus, keyboard, crumbs, Storage, Mapper, Action, translate, analytics } from 'ts/lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

import Controls from './controls';
import EditorHeaderPage from './header/page';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
	isPopup: boolean;
	onOpen?(): void;
};

const { app } = window.require('@electron/remote');
const Constant = require('json/constant.json');
const Errors = require('json/error.json');
const $ = require('jquery');
const fs = window.require('fs');
const path = window.require('path');
const userPath = app.getPath('userData');

const THROTTLE = 20;
const BUTTON_OFFSET = 10;

const EditorPage = observer(class EditorPage extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	id: string = '';
	timeoutHover: number = 0;
	timeoutMove: number = 0;
	timeoutScreen: number = 0;
	hoverId: string =  '';
	hoverPosition: number = 0;
	scrollTop: number = 0;
	uiHidden: boolean = false;
	loading: boolean = false;
	isDeleted: boolean = false;
	width: number = 0;
	refHeader: any = null;

	constructor (props: any) {
		super(props);
		
		this.onKeyDownBlock = this.onKeyDownBlock.bind(this);
		this.onKeyUpBlock = this.onKeyUpBlock.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMenuAdd = this.onMenuAdd.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onLastClick = this.onLastClick.bind(this);
		this.blockCreate = this.blockCreate.bind(this);
		this.getWrapper = this.getWrapper.bind(this);
		this.getWrapperWidth = this.getWrapperWidth.bind(this);
		this.resize = this.resize.bind(this);
	};

	render () {
		if (this.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

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
				<Controls key="editorControls" {...this.props} resize={this.resize} />
				
				<div id={'editor-' + rootId} className="editor">
					<div className="blocks">
						<Icon id="button-block-add" className="buttonAdd" onClick={this.onAdd} />

						<EditorHeaderPage 
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
								onPaste={this.onPaste}
								readonly={readonly}
								getWrapper={this.getWrapper}
								getWrapperWidth={this.getWrapperWidth}
							/>
						))}
					</div>
					
					<div className="blockLast" onClick={this.onLastClick} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { dataset, isPopup } = this.props;
		const { selection } = dataset || {};

		this._isMounted = true;
		this.unbind();
		this.open();

		keyboard.disableClose(false);

		const win = $(window);
		const namespace = isPopup ? '.popup' : '';
		const renderer = Util.getRenderer();

		let ids: string[] = [];
		if (selection) {
			ids = selection.get(I.SelectType.Block, true);
		};
		
		win.on('mousemove.editor' + namespace, throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('keydown.editor' + namespace, (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor' + namespace, (e: any) => {
			if (!keyboard.isFocused) {
				this.onPaste(e); 
			};
		});
		win.on('focus.editor' + namespace, (e: any) => {
			if (!ids.length && !menuStore.isOpen()) {
				focus.restore();
				focus.apply(); 
			};
			Util.getScrollContainer(isPopup).scrollTop(this.scrollTop);
		});

		this.resize();
		win.on('resize.editor' + namespace, (e: any) => { this.resize(); });

		Util.getScrollContainer(isPopup).on('scroll.editor' + namespace, (e: any) => { this.onScroll(e); });

		Storage.set('askSurvey', 1);

		renderer.removeAllListeners('commandEditor');
		renderer.on('commandEditor', (e: any, cmd: string, arg: any) => { this.onCommand(cmd, arg); });
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
		const renderer = Util.getRenderer();

		this._isMounted = false;
		this.uiHidden = false;
		this.unbind();
		this.close();

		focus.clear(false);
		window.clearInterval(this.timeoutScreen);
		renderer.removeAllListeners('commandEditor');
	};

	getWrapper () {
		return $(ReactDOM.findDOMNode(this));
	};

	getWrapperWidth (): number {
		return this.width;
	};

	open () {
		const { rootId, onOpen, history, isPopup } = this.props;

		if (this.id == rootId) {
			return;
		};

		this.loading = true;
		this.isDeleted = false;
		this.forceUpdate();
		
		this.id = rootId;

		C.BlockOpen(this.id, '', (message: any) => {
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

			crumbs.addPage(rootId);
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

		let length = 0;
		if (focused) {
			const block = blockStore.getLeaf(rootId, focused);
			if (block) {
				length = block.getLength();
			};
		};

		switch (cmd) {
			case 'selectAll':
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
		const object = detailStore.get(rootId, rootId, []);

		let block = null;
		if (object.layout == I.ObjectLayout.Note) {
			block = blockStore.getFirstBlock(rootId, 1, (it: any) => { return it.isText(); });
		} else {
			block = blockStore.getLeaf(rootId, Constant.blockId.title);
		};
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
		const namespace = isPopup ? '.popup' : '';
		const events = 'keydown.editor mousemove.editor scroll.editor paste.editor resize.editor focus.editor';
		const a = events.split(' ').map((it: string) => { return it + namespace; });

		$(window).unbind(a.join(' '));
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
			$(window).unbind('mousemove.ui').on('mousemove.ui', (e: any) => { this.uiShow(); });
		}, 100);
	};

	uiShow () {
		if (!this.uiHidden) {
			return;
		};

		const obj = this.getContainer();
		
		obj.find('#footer').css({ opacity: 1 });
		
		this.uiHidden = false;
		$(window).unbind('mousemove.ui');
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const checkType = blockStore.checkBlockType(rootId);
		const readonly = this.isReadonly();

		if (!root || readonly || checkType || (root && root.isLocked())) {
			return;
		};

		const container = $('.editor');
		if (!container.length) {
			return;
		};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.block');
		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const featured = node.find(`#block-${Constant.blockId.featured}`);
		const st = win.scrollTop();
		const add = node.find('#button-block-add');
		const { pageX, pageY } = e;

		let offset = 140;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, height: 0 };

		if (featured.length) {
			offset = featured.offset().top + featured.outerHeight() - BUTTON_OFFSET;
		};

		// Find hovered block by mouse coords
		items.each((i: number, item: any) => {
			let obj = $(item);
			if (obj.hasClass('noPlus')) {
				return;
			};

			let rect = item.getBoundingClientRect() as DOMRect;
			rect.y += st;

			if ((pageX >= rect.x) && (pageX <= rect.x + rect.width) && (pageY >= rect.y) && (pageY <= rect.y + rect.height)) {
				hovered = item as Element;
				hoveredRect = rect;
			};
		});
		
		if (hovered) {
			hovered = $(hovered);
			this.hoverId = hovered.data('id');
		};
		
		if (keyboard.isResizing || menuStore.isOpen()) {
			hovered = null;
		};
		
		const { x, y, height } = hoveredRect;
		const out = () => {
			add.removeClass('show');
			items.removeClass('showMenu isAdding top bottom');
		};
		
		window.clearTimeout(this.timeoutHover);

		if (keyboard.isDragging) {
			out();
			
			if (hovered) {
				hovered.addClass('showMenu');
			};
			return;
		};
		
		if (hovered && (pageX >= x) && (pageX <= x + Constant.size.blockMenu) && (pageY >= offset + BUTTON_OFFSET) && (pageY <= st + rectContainer.height + offset + BUTTON_OFFSET)) {
			this.hoverPosition = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			
			let ax = hoveredRect.x - (rectContainer.x - Constant.size.blockMenu) + 2;
			let ay = pageY - rectContainer.y - BUTTON_OFFSET - st;
			
			add.addClass('show').css({ transform: `translate3d(${ax}px,${ay}px,0px)` });
			items.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (pageX <= x + 20) {
				const block = blockStore.getLeaf(rootId, this.hoverId);
				if (block && block.canCreateBlock()) {
					hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
				};
			};
		} else {
			this.timeoutHover = window.setTimeout(out, 10);
		};
	};
	
	onKeyDownEditor (e: any) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused } = focus.state;
		const menuOpen = menuStore.isOpen();
		const popupOpen = popupStore.isOpenList([ 'search' ]);
		const root = blockStore.getLeaf(rootId, rootId);

		if (keyboard.isFocused || !selection || !root) {
			return;
		};
		
		const block = blockStore.getLeaf(rootId, focused);
		const ids = selection.get(I.SelectType.Block);
		const cmd = keyboard.ctrlKey();
		const readonly = this.isReadonly();

		// Select all
		keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
			if (popupOpen) {
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
			if (readonly) {
				return;
			};

			e.preventDefault();
			keyboard.onUndo(rootId, (message: any) => { focus.clear(true); });
		});

		// Redo
		keyboard.shortcut(`${cmd}+shift+z`, e, (pressed: string) => {
			if (readonly) {
				return;
			};
			
			e.preventDefault();
			keyboard.onRedo(rootId, (message: any) => { focus.clear(true); });
		});

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, (pressed: string) => {
			e.preventDefault();
			this.onHistory(e);
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
								C.BlockListSetTextMark(rootId, ids, { type: newType, param: param, range: { from: 0, to: 0 } }, (message: any) => {
									analytics.event('ChangeTextStyle', { type: newType, count: ids.length });
								});
							}
						}
					});
				} else {
					C.BlockListSetTextMark(rootId, ids, { type: type, param: param, range: { from: 0, to: 0 } }, (message: any) => {
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
				Action.duplicate(rootId, ids[ids.length - 1], ids, () => { focus.clear(true); });
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
			if (readonly) {
				return;
			};

			e.preventDefault();
			this.blockRemove(block);
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

	onKeyDownBlock (e: any, text: string, marks: I.Mark[], range: any) {
		range = range || {};

		const { dataset, rootId } = this.props;
		const { focused } = focus.state;
		const { selection } = dataset || {};
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};
		
		const platform = Util.getPlatform();
		const menuOpen = menuStore.isOpen();
		const cmd = keyboard.ctrlKey();

		// Last line break doesn't expand range.to
		let length = String(text || '').length;
		if (length && (text[length - 1] == '\n')) {
			length--;
		};

		this.uiHide();
		
		if (platform == I.Platform.Mac) {
			// Print or prev string
			keyboard.shortcut('ctrl+p', e, (pressed: string) => {
				this.onArrow(e, Key.up, length);
			});

			// Next string
			keyboard.shortcut('ctrl+n', e, (pressed: string) => {
				this.onArrow(e, Key.down, length);
			});
		};

		// Select all
		if (block.isText()) {
			keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
				if ((range.from == 0) && (range.to == length)) {
					e.preventDefault();
					this.onSelectAll();
				} else {
					focus.set(block.id, { from: 0, to: length });
					focus.apply();
				};
			});
		};

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

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, (pressed: string) => {
			e.preventDefault();
			this.onHistory(e);
		});

		// Duplicate
		keyboard.shortcut(`${cmd}+d`, e, (pressed: string) => {
			e.preventDefault();
			Action.duplicate(rootId, block.id, [ block.id ]);
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

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			this.onArrow(e, pressed, length);
		});

		keyboard.shortcut('arrowleft', e, (pressed: string) => {
			if (block.isTextToggle() && (range.to == 0)) {
				blockStore.toggle(rootId, block.id, false);
			};
		});

		keyboard.shortcut('arrowright', e, (pressed: string) => {
			if (block.isTextToggle() && (range.to == length)) {
				blockStore.toggle(rootId, block.id, true);
			};
		});

		keyboard.shortcut('alt+arrowdown, alt+arrowup', e, (pressed: string) => {
			if (block.isTextToggle()) {
				e.preventDefault();
				blockStore.toggle(rootId, block.id, pressed.match('arrowdown') ? true : false);
			};
		});

		// Expand selection
		keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
			this.onShiftArrowBlock(e, range, pressed);
		});

		// Backspace
		keyboard.shortcut('backspace, delete', e, (pressed: string) => {
			this.onBackspaceBlock(e, range, pressed);
		});

		// Enter
		keyboard.shortcut('enter, shift+enter', e, (pressed: string) => {
			this.onEnterBlock(e, range, pressed);
		});

		if (!menuOpen) {
			// Tab, indent block
			keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
				this.onTabBlock(e, pressed);
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
			{ key: `${cmd}+shift+s`, type: I.MarkType.Strike,	 param: '' },
			{ key: `${cmd}+k`,		 type: I.MarkType.Link,		 param: '' },
			{ key: `${cmd}+l`,		 type: I.MarkType.Code,		 param: '' },
			{ key: `${cmd}+shift+h`, type: I.MarkType.BgColor,	 param: Storage.get('bgColor') },
			{ key: `${cmd}+shift+c`, type: I.MarkType.Color,	 param: Storage.get('color') },
		];
	};
	
	onKeyUpBlock (e: any, text: string, marks: I.Mark[], range: I.TextRange) {
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
			C.BlockListMove(rootId, rootId, ids, obj.id, (shift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), () => {
				if (next && next.isTextToggle()) {
					blockStore.toggle(rootId, next.id, true);
				};

				analytics.event('ReorderBlock', { count: ids.length });
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

		C.BlockListMove(rootId, rootId, [ block.id ], next.id, position, (message: any) => {
			focus.apply();

			analytics.event('ReorderBlock', { count: 1 });
		});
	};

	// Move focus to first/last block
	onCtrlArrowBlock (e: any, pressed: string) {
		e.preventDefault();

		const { rootId } = this.props;
		const dir = pressed.match(Key.up) ? -1 : 1;
		const next = blockStore.getFirstBlock(rootId, -dir, (item: any) => { return item.isFocusable(); });
		if (!next) {
			return;
		};

		const l = next.getLength();
		focus.set(next.id, (dir < 0 ? { from: 0, to: 0 } : { from: l, to: l }));
		focus.apply();
	};

	// Expand selection up/down
	onShiftArrowBlock (e: any, range: I.TextRange, pressed: string) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused } = focus.state;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block || selection.get(I.SelectType.Block, true).length) {
			return;
		};

		const win = $(window);
		const st = win.scrollTop();
		const element = $(`#block-${block.id}`);
		const value = element.find('#value');
		const length = block.getLength();

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

		const dir = pressed.match(Key.up) ? -1 : 1;
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
		const rect = Util.selectionRect();

		if (type == I.MarkType.Link) {
			menuStore.close('blockContext', () => {
				menuStore.open('blockLink', {
					element: el,
					rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
					horizontal: I.MenuDirection.Center,
					data: {
						filter: mark ? mark.param : '',
						type: mark ? mark.type : null,
						onChange: (newType: I.MarkType, param: string) => {
							marks = Mark.toggleLink({ type: newType, param: param, range: range }, marks);
							DataUtil.blockSetText(rootId, block, text, marks, true, () => { focus.apply(); });
						}
					}
				});
			});
		} else {
			marks = Mark.toggle(marks, { type: type, param: mark ? '' : param, range: range });
			DataUtil.blockSetText(rootId, block, text, marks, true, () => { focus.apply(); });
		};
	};

	// Backspace / Delete
	onBackspaceBlock (e: any, range: I.TextRange, pressed: string) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused } = focus.state;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const isDelete = pressed == 'delete';
		const ids = selection.get(I.SelectType.Block, true);
		const length = block.getLength();

		if (block.isText()) {
			if (!isDelete && !range.to) {
				if (block.isTextList()) {
					C.BlockListSetTextStyle(rootId, [ block.id ], I.TextStyle.Paragraph);
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
	onTabBlock (e: any, pressed: string) {
		e.preventDefault();
			
		const { rootId } = this.props;
		const { focused } = focus.state;
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};

		const isShift = pressed.match('shift');
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

		C.BlockListMove(rootId, rootId, [ block.id ], obj.id, (isShift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), (message: any) => {
			window.setTimeout(() => { focus.apply(); });

			if (next && next.isTextToggle()) {
				blockStore.toggle(rootId, next.id, true);
			};

			analytics.event('ReorderBlock', { count: 1 });
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

		if (block.isTextCode() && (pressed == 'enter')) {
			return;
		};
		if (!block.isText() && keyboard.isFocused) {
			return;
		};
		if (block.isText() && !block.isTextCode() && pressed.match('shift')) {
			return;
		};

		const menus = menuStore.list;
		const exclude = [ 'blockContext', 'onboarding' ];
		const menuCheck = (menus.length > 1) || ((menus.length == 1) && (!exclude.includes(menus[0].id)));
		
		if (menuCheck) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();

		let length = block.getLength();
		let replace = !range.to && block.isTextList() && !length;

		if (replace) {
			C.BlockListSetTextStyle(rootId, [ block.id ], I.TextStyle.Paragraph);
		} else 
		if (!block.isText()) {  
			this.blockCreate(block.id, I.BlockPosition.Bottom, {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
			});
		} else {
			this.blockSplit(block, range);
		};

		if (blockStore.checkBlockType(rootId)) {
			const object = detailStore.get(rootId, rootId, []);
			analytics.event('CreateObject', { 
				route: 'Editor',
				objectType: object.type, 
				layout: object.layout,
			});
		};
	};

	onArrow (e: any, pressed: string, length: number) {
		if (menuStore.isOpen()) {
			return;
		};

		const { focused, range } = focus.state;
		const { rootId, isPopup } = this.props;
		const block = blockStore.getLeaf(rootId, focused);
		const dir = pressed.match(Key.up) ? -1 : 1;

		if ((dir < 0) && range.to) {
			return;
		};

		if ((dir > 0) && (range.to != length)) {
			return;
		};

		let next: I.Block = null;

		// If block is closed toggle - find next block on the same level
		if (block && block.isTextToggle() && !Storage.checkToggle(rootId, block.id)) {
			next = blockStore.getNextBlock(rootId, focused, dir, (it: I.Block) => { return it.parentId != block.id && it.isFocusable(); });
		} else {
			next = blockStore.getNextBlock(rootId, focused, dir, (it: I.Block) => { return it.isFocusable(); });
		};

		if (!next) {
			return;
		};

		e.preventDefault();

		const parent = blockStore.getHighestParent(rootId, next.id);
		const l = next.getLength();

		// If highest parent is closed toggle, next is parent
		if (parent && parent.isTextToggle() && !Storage.checkToggle(rootId, parent.id)) {
			next = parent;
		};

		window.setTimeout(() => {
			focus.set(next.id, (dir > 0 ? { from: 0, to: 0 } : { from: l, to: l }));
			focus.apply();
			focus.scroll(isPopup);
		});
	};

	onSelectAll () {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const ids = blockStore.getBlocks(rootId, (it: any) => { return it.isSelectable(); }).map((it: any) => { return it.id; }); 
		
		selection.set(I.SelectType.Block, ids);
		menuStore.close('blockContext');
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

		if (!block) {
			return;
		};

		const win = $(window);
		const rect = Util.selectionRect();

		commonStore.filterSet(range.from, '');
		menuStore.open('blockAdd', { 
			element: $('#block-' + blockId),
			rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			offsetX: rect ? 0 : Constant.size.blockMenu,
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

		/*
		if (Math.abs(top - this.scrollTop) >= 10) {
			this.uiHide();
		};
		*/

		this.scrollTop = top;
		Storage.setScroll('editor' + (isPopup ? 'Popup' : ''), rootId, top);
		Util.previewHide(false);
	};
	
	onCopy (e: any, cut: boolean) {
		e.preventDefault();

		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const readonly = this.isReadonly();

		if (readonly && cut) {
			return;
		};

		let { focused, range } = focus.state;
		let ids = selection.get(I.SelectType.Block, true);
		if (!ids.length) {
			ids = [ focused ];
		};
		ids = ids.concat(this.getLayoutIds(ids));

		const cmd = cut ? 'BlockCut' : 'BlockCopy';
		const focusBlock = blockStore.getLeaf(rootId, focused);
		const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
		
		let text: string[] = [];
		let blocks = blockStore.unwrapTree(tree).filter((it: I.Block) => {
			return ids.indexOf(it.id) >= 0;
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
		
		range = Util.objectCopy(range);
		if (focusBlock) {
			range = Util.rangeFixOut(focusBlock.content.text, range);
		};

		const data = { 
			text: text.join('\n'), 
			html: null, 
			anytype: { 
				range: range,
				blocks: blocks, 
			},
		};

		const cb = (message: any) => {
			const blocks = (message.anySlot || []).map(Mapper.From.Block);

			Util.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range: range,
					blocks: blocks,
				},
			});

			if (cut) {
				menuStore.close('blockContext');
				focus.set(focused, { from: range.from, to: range.from });
				focus.apply();
			};
		};
		
		Util.clipboardCopy(data, () => { 
			C[cmd](rootId, blocks, range, cb);

			analytics.event('CopyBlock');
		});
	};
	
	onPaste (e: any, force?: boolean, data?: any) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused, range } = focus.state;
		const filePath = path.join(userPath, 'tmp');
		const currentFrom = range.from;
		const currentTo = range.to;

		if (!data) {
			const cb = e.clipboardData || e.originalEvent.clipboardData;
			const items = cb.items;

			data = {
				text: String(cb.getData('text/plain') || ''),
				html: String(cb.getData('text/html') || ''),
				anytype: JSON.parse(String(cb.getData('application/json') || '{}')),
				files: [],
			};
			data.anytype.range = data.anytype.range || { from: 0, to: 0 };

			// Read files
			if (items && items.length) {
				let files = [];
				for (let item of items) {
					if (item.kind != 'file') {
						continue;
					};

					const file = item.getAsFile();
					if (file) {
						files.push(file);
					};
				};

				if (files.length) {
					commonStore.progressSet({ status: translate('commonProgress'), current: 0, total: files.length });

					for (let file of files) {
						const fn = path.join(filePath, file.name);
						const reader = new FileReader();

						reader.readAsBinaryString(file); 
						reader.onloadend = () => {
							fs.writeFile(fn, reader.result, 'binary', (err: any) => {
								if (err) {
									console.error(err);
									commonStore.progressSet({ status: translate('commonProgress'), current: 0, total: 0 });
									return;
								};

								data.files.push({ name: file.name, path: fn });

								commonStore.progressSet({ status: translate('commonProgress'), current: data.files.length, total: files.length });

								if (data.files.length == files.length) {
									this.onPaste(e, true, data);
								};
							});
						};
					};

					return;
				};
			};
		};

		e.preventDefault();

		const block = blockStore.getLeaf(rootId, focused);
		const length = block ? block.getLength() : 0;
		const reg = new RegExp(/^((?:https?:(?:\/\/)?)|\/\/)([^\s\/\?#]+)([^\s\?#]+)(?:\?([^#\s]*))?(?:#([^\s]*))?$/gi);
		const match = data.text.match(reg);
		const url = match && match[0];
		
		if (block && url && !force && !block.isTextTitle() && !block.isTextDescription()) {
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
					options: [
						{ id: 'bookmark', name: 'Create bookmark' },
						{ id: 'cancel', name: 'Dismiss' },
						//{ id: 'embed', name: 'Create embed' },
					],
					onSelect: (event: any, item: any) => {
						if (item.id == 'cancel') {
							const to = range.from + url.length;
							const value = Util.stringInsert(block.content.text, url + ' ', range.from, range.from);
							const marks = Util.objectCopy(block.content.marks || []);

							marks.push({
								type: I.MarkType.Link,
								range: { from: range.from, to: to },
								param: url,
							});

							DataUtil.blockSetText(rootId, block, value, marks, true, () => {
								focus.set(block.id, { from: to + 1, to: to + 1 });
								focus.apply();
							});
						};

						if (item.id == 'bookmark') {
							C.BlockBookmarkCreateAndFetch(rootId, focused, length ? I.BlockPosition.Bottom : I.BlockPosition.Replace, url, (message: any) => {
								analytics.event('CreateBlock', { 
									middleTime: message.middleTime, 
									type: I.BlockType.Bookmark, 
								});
							});
						};
					},
				}
			});
			return;
		};
		
		let id = '';
		let from = 0;
		let to = 0;

		C.BlockPaste(rootId, focused, range, selection.get(I.SelectType.Block, true), data.anytype.range.to > 0, { text: data.text, html: data.html, anytype: data.anytype.blocks, files: data.files }, (message: any) => {
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
		const next = blockStore.getNextBlock(rootId, focused.id, dir, (it: any) => {
			return it.isFocusable();
		});

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
			C.BlockUnlink(rootId, [ focused.id ], cb);
		} else {
			C.BlockUnlink(rootId, [ next.id ], (message: any) => {
				if (message.error.code) {
					return;
				};

				const next = blockStore.getNextBlock(rootId, focused.id, -1, (it: any) => {
					return it.isFocusable();
				});
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

		range = Util.rangeFixOut(content.text, range);
		
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

		let next: any = null;
		let ids = selection.get(I.SelectType.Block);
		let blockIds = [];

		if (ids.length) {
			next = blockStore.getNextBlock(rootId, ids[0], -1, (it: any) => { return it.isFocusable(); });
			blockIds = ids;
		} else 
		if (focused) {
			next = blockStore.getNextBlock(rootId, focused.id, -1, (it: any) => { return it.isFocusable(); });
			blockIds = [ focused.id ];
		};

		blockIds = blockIds.filter((it: string) => {  
			let block = blockStore.getLeaf(rootId, it);
			return block && !block.isTextTitle();
		});

		focus.clear(true);
		C.BlockUnlink(rootId, blockIds, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (next && next.isFocusable()) {
				let length = next.getLength();
				this.focus(next.id, length, length, false);
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

		const last = blockStore.getFirstBlock(rootId, -1, (item: any) => { return item.canCreateBlock(); });

		let create = false;
		let length = 0;
		
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
		const last = node.find('.blockLast');
		const size = node.find('#editorSize');
		const cover = node.find('.block.blockCover');
		const obj = this.getContainer();
		const header = obj.find('#header');
		const root = blockStore.getLeaf(rootId, rootId);
		const container = Util.getScrollContainer(isPopup);
		const hh = isPopup ? header.height() : Util.sizeHeader();

		if (blocks.length && last.length) {
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
		return $(this.props.isPopup ? '#popupPage #innerWrap' : '#page.isFull');
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

	onResize (v: number) {
		v = Number(v) || 0;

		const node = $(ReactDOM.findDOMNode(this));
		const width = this.getWidth(v);
		const elements = node.find('#elements');

		node.css({ width: width });
		elements.css({ width: width, marginLeft: -width / 2 });

		if (this.refHeader && this.refHeader.refDrag) {
			this.refHeader.refDrag.setValue(v);
			this.refHeader.setPercent(v);
		};
	};

	getWidth (w: number) {
		const { isPopup, rootId } = this.props;
		const { sidebar } = commonStore;
		const { fixed } = sidebar;
		const container = $(isPopup ? '#popupPage #innerWrap' : '#page.isFull');
		const mw = container.width() - 120;
		const root = blockStore.getLeaf(rootId, rootId);
		const sb = $('#sidebar');
		
		if (root && root.isObjectSet()) {
			return container.width() - 192;
		};

		w = Number(w) || 0;
		w = (mw - Constant.size.editor) * w;

		this.width = w = Math.max(Constant.size.editor, Math.min(mw, Constant.size.editor + w));
		return w;
	};

	isReadonly () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
		return root?.fields.isLocked || !allowed;
	};

});

export default EditorPage;