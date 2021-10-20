import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon, Loader } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore, popupStore } from 'ts/store';
import { I, C, Key, Util, DataUtil, Mark, focus, keyboard, crumbs, Storage, Mapper, Action, translate, dispatcher } from 'ts/lib';
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

const { ipcRenderer } = window.require('electron');
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
	};

	render () {
		if (this.loading) {
			return <Loader id="loader" />;
		};
		
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId);
		const length = childrenIds.length;
		const width = root?.fields?.width;
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block, I.RestrictionObject.Details ]); 

		return (
			<div id="editorWrapper">
				<Controls key="editorControls" {...this.props} />
				
				<div id={'editor-' + rootId} className="editor">
					<div className="blocks">
						<Icon id="button-add" className="buttonAdd" onClick={this.onAdd} />

						<EditorHeaderPage 
							{...this.props} 
							ref={(ref: any) => { this.refHeader = ref; }}
							onKeyDown={this.onKeyDownBlock}
							onKeyUp={this.onKeyUpBlock}  
							onMenuAdd={this.onMenuAdd}
							onPaste={this.onPaste}
							onResize={(v: number) => { this.onResize(v); }}
							readonly={!allowed}
							getWrapper={this.getWrapper}
							getWrapperWidth={this.getWrapperWidth}
						/>
					
						{children.map((block: I.Block, i: number) => {
							if (block.isLayoutHeader()) {
								return null;
							};
							return (
								<Block 
									key={'block-' + block.id} 
									{...this.props}
									index={i}
									block={block}
									onKeyDown={this.onKeyDownBlock}
									onKeyUp={this.onKeyUpBlock}  
									onMenuAdd={this.onMenuAdd}
									onPaste={this.onPaste}
									readonly={!allowed}
									getWrapper={this.getWrapper}
									getWrapperWidth={this.getWrapperWidth}
								/>
							)
						})}
					</div>
					
					<div className="blockLast" onClick={this.onLastClick} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { isPopup } = this.props;

		this._isMounted = true;
		const win = $(window);
		const namespace = isPopup ? '.popup' : '';
		
		this.unbind();
		this.open();
		
		win.on('mousemove.editor' + namespace, throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('keydown.editor' + namespace, (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor' + namespace, (e: any) => {
			if (!keyboard.isFocused) {
				this.onPaste(e); 
			};
		});
		win.on('focus.editor' + namespace, (e: any) => { 
			focus.apply(); 
			this.getScrollContainer().scrollTop(this.scrollTop);
		});

		this.resize();
		win.on('resize.editor' + namespace, (e: any) => { this.resize(); });

		this.getScrollContainer().on('scroll.editor' + namespace, (e: any) => { this.onScroll(e); });

		Storage.set('askSurvey', 1);

		ipcRenderer.removeAllListeners('commandEditor');
		ipcRenderer.on('commandEditor', (e: any, cmd: string, arg: any) => { this.onCommand(cmd, arg); });
	};

	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		const resizable = node.find('.resizable');
		
		this.open();
		
		if (this.uiHidden) {
			this.uiHide();
		};

		focus.apply();
		this.getScrollContainer().scrollTop(this.scrollTop);

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
		ipcRenderer.removeAllListeners('commandEditor');
	};

	getScrollContainer () {
		const { isPopup } = this.props;
		return isPopup ? $('#popupPage #innerWrap') : $(window);
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
		this.forceUpdate();
		
		crumbs.addPage(rootId);
		crumbs.addRecent(rootId);

		this.id = rootId;

		C.BlockOpen(this.id, (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.ANYTYPE_NEEDS_UPGRADE) {
					Util.onErrorUpdate(() => { history.push('/main/index'); });
				} else {
					history.push('/main/index');
				};
				return;
			};
			
			this.loading = false;
			this.focusTitle();
			this.forceUpdate();
			this.getScrollContainer().scrollTop(Storage.getScroll('editor' + (isPopup ? 'Popup' : ''), rootId));

			if (onOpen) {
				onOpen();
			};

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
		const object = detailStore.get(rootId, rootId);
		
		let close = true;
		if (isPopup && (match.params.id == rootId)) {
			close = false;
		};
		if (object.type == Constant.typeId.template) {
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

		$('.footer').css({ opacity: 0 });
		$('#button-add').css({ opacity: 0 });
		
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

		const win = $(window);
		
		$('.footer').css({ opacity: 1 });
		$('#button-add').css({ opacity: '' });
		
		this.uiHidden = false;
		win.unbind('mousemove.ui');
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);
		const object = detailStore.get(rootId, rootId);
		const checkType = blockStore.checkBlockType(rootId);

		if (!root || !allowed || checkType) {
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
		const add = node.find('#button-add');
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

		if (keyboard.isFocused || !selection) {
			return;
		};
		
		const block = blockStore.getLeaf(rootId, focused);
		const ids = selection.get();
		const cmd = keyboard.ctrlKey();

		// Select all
		keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
			e.preventDefault();
			this.onSelectAll();
		});

		// Copy
		keyboard.shortcut(`${cmd}+c`, e, (pressed: string) => {
			this.onCopy(e, false);
		});

		// Cut
		keyboard.shortcut(`${cmd}+x`, e, (pressed: string) => {
			this.onCopy(e, true);
		});

		// Undo
		keyboard.shortcut(`${cmd}+z`, e, (pressed: string) => {
			e.preventDefault();
			C.BlockUndo(rootId, (message: any) => { focus.clear(true); });
		});

		// Redo
		keyboard.shortcut(`${cmd}+shift+z`, e, (pressed: string) => {
			e.preventDefault();
			C.BlockRedo(rootId, (message: any) => { focus.clear(true); });
		});

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, (pressed: string) => {
			e.preventDefault();
			this.onHistory();
		});

		keyboard.shortcut('escape', e, (pressed: string) => {
			if (ids.length && !menuStore.isOpen()) {
				selection.clear();
			};
		});

		// Mark-up
		if (ids.length) {
			let type = null;
			let param = '';

			// Bold
			keyboard.shortcut(`${cmd}+b`, e, (pressed: string) => {
				type = I.MarkType.Bold;
			});

			// Italic
			keyboard.shortcut(`${cmd}+i`, e, (pressed: string) => {
				type = I.MarkType.Italic;
			});

			// Strike
			keyboard.shortcut(`${cmd}+shift+s`, e, (pressed: string) => {
				type = I.MarkType.Strike;
			});

			// Code
			keyboard.shortcut(`${cmd}+l`, e, (pressed: string) => {
				type = I.MarkType.Code;
			});

			// Link
			keyboard.shortcut(`${cmd}+k`, e, (pressed: string) => {
				type = I.MarkType.Link;
			});

			// BgColor
			keyboard.shortcut(`${cmd}+shift+h`, e, (pressed: string) => {
				param = Storage.get('bgColor');
				type = I.MarkType.BgColor;
			});

			// Color
			keyboard.shortcut(`${cmd}+shift+c`, e, (pressed: string) => {
				param = Storage.get('color');
				type = I.MarkType.Color;
			});

			if (type !== null) {
				e.preventDefault();

				if (type == I.MarkType.Link) {
					menuStore.open('blockLink', {
						element: `#block-${ids[0]}`,
						horizontal: I.MenuDirection.Center,
						data: {
							filter: '',
							onChange: (newType: I.MarkType, param: string) => {
								C.BlockListSetTextMark(rootId, ids, { type: newType, param: param, range: { from: 0, to: 0 } });
							}
						}
					});
				} else {
					C.BlockListSetTextMark(rootId, ids, { type: type, param: param, range: { from: 0, to: 0 } });
				};
			};

			// Duplicate
			keyboard.shortcut(`${cmd}+d`, e, (pressed: string) => {
				e.preventDefault();
				focus.clear(true);
				C.BlockListDuplicate(rootId, ids, ids[ids.length - 1], I.BlockPosition.Bottom, (message: any) => {});
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
			e.preventDefault();
			this.blockRemove(block);
		});

		// Indent block
		keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
			e.preventDefault();
			
			if (!ids.length) {
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
				});
			};
		});

		// Restore focus
		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			if (menuStore.isOpen()) {
				return;
			};

			selection.clear();
			focus.restore();
			focus.apply();
		});

		// Enter
		keyboard.shortcut('enter', e, (pressed: string) => {
			if (menuStore.isOpen()) {
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

	onKeyDownBlock (e: any, text: string, marks: I.Mark[], range: any) {
		const { dataset, rootId } = this.props;
		const { focused } = focus.state;
		const { selection } = dataset || {};
		const block = blockStore.getLeaf(rootId, focused);

		if (!block) {
			return;
		};
		
		const win = $(window);
		const platform = Util.getPlatform();
		const menuOpen = menuStore.isOpen();
		const st = win.scrollTop();
		const element = $(`#block-${block.id}`);
		const value = element.find('#value');
		const cmd = keyboard.ctrlKey();
		
		let length = String(text || '').length;
		range = range || {};

		// Last line break doesn't expand range.to
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
		if (block.isText() && (range.from == 0) && (range.to == length)) {
			keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
				e.preventDefault();
				this.onSelectAll();
			});
		};

		// Copy
		keyboard.shortcut(`${cmd}+c`, e, (pressed: string) => {
			this.onCopy(e, false);
		});

		// Cut
		keyboard.shortcut(`${cmd}+x`, e, (pressed: string) => {
			this.onCopy(e, true);
		});

		// Undo
		keyboard.shortcut(`${cmd}+z`, e, (pressed: string) => {
			e.preventDefault();
			C.BlockUndo(rootId, (message: any) => { focus.clear(true); });
		});

		// Redo
		keyboard.shortcut(`${cmd}+shift+z`, e, (pressed: string) => {
			e.preventDefault();
			C.BlockRedo(rootId, (message: any) => { focus.clear(true); });
		});

		// History
		keyboard.shortcut('ctrl+h, cmd+y', e, (pressed: string) => {
			e.preventDefault();
			this.onHistory();
		});

		// Duplicate
		keyboard.shortcut(`${cmd}+d`, e, (pressed: string) => {
			e.preventDefault();
			C.BlockListDuplicate(rootId, [ block.id ], block.id, I.BlockPosition.Bottom, (message: any) => {
				if (message.blockIds.length) {
					focus.set(message.blockIds[message.blockIds.length - 1], { from: length, to: length });
					focus.apply();
				};
			});
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

			// Bold
			keyboard.shortcut(`${cmd}+b`, e, (pressed: string) => {
				type = I.MarkType.Bold;
			});

			// Italic
			keyboard.shortcut(`${cmd}+i`, e, (pressed: string) => {
				type = I.MarkType.Italic;
			});

			// Strike
			keyboard.shortcut(`${cmd}+shift+s`, e, (pressed: string) => {
				type = I.MarkType.Strike;
			});
			
			// Link
			keyboard.shortcut(`${cmd}+k`, e, (pressed: string) => {
				type = I.MarkType.Link;
			});

			// Code
			keyboard.shortcut(`${cmd}+l`, e, (pressed: string) => {
				type = I.MarkType.Code;
			});

			// BgColor
			keyboard.shortcut(`${cmd}+shift+h`, e, (pressed: string) => {
				param = Storage.get('bgColor');
				type = I.MarkType.BgColor;
			});

			// Color
			keyboard.shortcut(`${cmd}+shift+c`, e, (pressed: string) => {
				param = Storage.get('color');
				type = I.MarkType.Color;
			});

			if (type !== null) {
				e.preventDefault();

				const mark = Mark.getInRange(marks, type, range);

				if (type == I.MarkType.Link) {
					const el = $(`#block-${block.id}`);

					let rect = Util.selectionRect();
					if (!rect.x && !rect.y && !rect.width && !rect.height) {
						rect = null;
					};

					menuStore.close('blockContext', () => {
						menuStore.open('blockLink', {
							element: el,
							rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
							horizontal: I.MenuDirection.Center,
							data: {
								filter: mark ? mark.param : '',
								onChange: (newType: I.MarkType, param: string) => {
									marks = Mark.setLink({ type: newType, param: param, range: range }, marks);
									DataUtil.blockSetText(rootId, block, text, marks, true, () => { focus.apply(); });
								}
							}
						});
					});
				} else {
					marks = Mark.toggle(marks, { type: type, param: mark ? '' : param, range: range });
					DataUtil.blockSetText(rootId, block, text, marks, true, () => {
						focus.apply();
					});
				};
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

		keyboard.shortcut(`${cmd}+shift+arrowup, ${cmd}+shift+arrowdown`, e, (pressed: string) => {
			if (menuOpen) {
				return;
			};
			
			e.preventDefault();

			const dir = pressed.match(Key.up) ? -1 : 1;
			const next = blockStore.getNextBlock(rootId, block.id, dir, (item: any) => {
				return !item.isIcon() && !item.isTextTitle();
			});
			if (next) {
				C.BlockListMove(rootId, rootId, [ block.id ], next.id, (dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom));	
			};
		});

		// Last/first block
		keyboard.shortcut(`${cmd}+arrowup, ${cmd}+arrowdown`, e, (pressed: string) => {
			if (menuOpen) {
				return;
			};
			
			e.preventDefault();

			const dir = pressed.match(Key.up) ? -1 : 1;
			const next = blockStore.getFirstBlock(rootId, -dir, (item: any) => { return item.isFocusable(); });
			if (!next) {
				return;
			};

			const l = next.getLength();
			focus.set(next.id, (dir < 0 ? { from: 0, to: 0 } : { from: l, to: l }));
			focus.apply();
		});

		// Expand selection
		keyboard.shortcut('shift+arrowup, shift+arrowup, shift+arrowdown, shift+arrowdown', e, (pressed: string) => {
			if (selection.get(true).length) {
				return;
			};

			let sRect = Util.selectionRect();
			let vRect: any = {};
			if (value && value.length) {
				vRect = value.get(0).getBoundingClientRect();
			} else 
			if (element && element.length) {
				vRect = element.get(0).getBoundingClientRect()
			};

			if (!sRect.y && !sRect.x && !sRect.width && !sRect.height) {
				sRect = vRect;
			};

			const dir = pressed.match(Key.up) ? -1 : 1;
			const lh = parseInt(value.css('line-height'));
			const sy = sRect.y + st;
			const vy = vRect.y + st;

			const cb = () => {
				e.preventDefault();

				focus.clear(true);
				selection.set([ block.id ]);

				menuStore.closeAll([ 'blockContext', 'blockAction' ]);
			};

			if ((dir < 0) && (sy - 4 <= vy)) {
				cb();
			};

			if ((dir > 0) && (sy + sRect.height + lh >= vy + vRect.height)) {
				cb();
			};
		});

		// Backspace
		keyboard.shortcut('backspace, delete', e, (pressed: string) => {
			if (block.isText()) {
				const ids = selection.get(true);
				if ((pressed == 'backspace') && !range.to) {
					if (block.isTextList()) {
						C.BlockListSetTextStyle(rootId, [ block.id ], I.TextStyle.Paragraph);
					} else {
						ids.length ? this.blockRemove(block) : this.blockMerge(block, -1);
					};
				};

				if ((pressed == 'delete') && (range.to == length)) {
					ids.length ? this.blockRemove(block) : this.blockMerge(block, 1);
				};
			};
			if (!block.isText() && !keyboard.isFocused) {
				this.blockRemove(block);
			};
		});

		// Tab, indent block
		keyboard.shortcut('tab, shift+tab', e, (pressed: string) => {
			e.preventDefault();
			
			const shift = pressed.match('shift');
			const element = blockStore.getMapElement(rootId, block.id);
			const parent = blockStore.getLeaf(rootId, element.parentId);
			const parentElement = blockStore.getMapElement(rootId, parent.id);

			if (!element || !parentElement) {
				return;
			};

			const idx = parentElement.childrenIds.indexOf(block.id);
			const nextId = parentElement.childrenIds[idx - 1];
			const next = nextId ? blockStore.getLeaf(rootId, nextId) : blockStore.getNextBlock(rootId, block.id, -1);
			const obj = shift ? parent : next;
			const canTab = obj && !block.isTextTitle() && obj.canHaveChildren() && block.isIndentable();

			if (!canTab) {
				return;
			};

			C.BlockListMove(rootId, rootId, [ block.id ], obj.id, (shift ? I.BlockPosition.Bottom : I.BlockPosition.Inner), (message: any) => {
				window.setTimeout(() => {
					focus.apply();
				});

				if (next && next.isTextToggle()) {
					blockStore.toggle(rootId, next.id, true);
				};
			});
		});

		// Enter
		keyboard.shortcut('enter, shift+enter', e, (pressed: string) => {
			if (block.isTextCode() && (pressed == 'enter')) {
				return;
			};

			if (!block.isText() && keyboard.isFocused) {
				return;
			};

			const menus = menuStore.list;
			const menuCheck = (menus.length > 1) || ((menus.length == 1) && (menus[0].id != 'blockContext'));
			
			if (menuCheck) {
				return;
			};
			
			e.preventDefault();
			e.stopPropagation();

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
		});
	};
	
	onKeyUpBlock (e: any, text: string, marks: I.Mark[], range: I.TextRange) {
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
		
		selection.set(ids);
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
		
		this.blockCreate(block.id, this.hoverPosition, {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		}, (blockId: string) => {
			$('.placeholder.c' + blockId).text(translate('placeholderFilter'));
			this.onMenuAdd(blockId, '', { from: 0, to: 0 });
		});
	};
	
	onMenuAdd (blockId: string, text: string, range: I.TextRange) {
		const { rootId } = this.props;
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const win = $(window);

		let rect = Util.selectionRect();
		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

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
				blockId: blockId,
				rootId: rootId,
				text: text,
				blockCreate: this.blockCreate,
			},
		});
	};
	
	onScroll (e: any) {
		const { rootId, isPopup } = this.props;
		const top = this.getScrollContainer().scrollTop();

		if (Math.abs(top - this.scrollTop) >= 10) {
			this.uiHide();
		};

		this.scrollTop = top;
		Storage.setScroll('editor' + (isPopup ? 'Popup' : ''), rootId, top);
		Util.previewLinkHide(false);
	};
	
	onCopy (e: any, cut: boolean) {
		e.preventDefault();

		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};

		let { focused, range } = focus.state;
		let ids = selection.get(true);
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

		blocks.map((it: I.Block) => {
			if (it.type == I.BlockType.Text) {
				text.push(String(it.content.text || ''));
			};
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
			}
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
		
		if (url && !force && !block.isTextTitle() && !block.isTextDescription()) {
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
							const value = Util.stringInsert(block.content.text, url, range.from, range.from);
							const marks = Util.objectCopy(block.content.marks || []);

							marks.push({
								type: I.MarkType.Link,
								range: { from: range.from, to: to },
								param: url,
							});

							DataUtil.blockSetText(rootId, block, value, marks, true, () => {
								focus.set(block.id, { from: to, to: to });
								focus.apply();
							});
						};

						if (item.id == 'bookmark') {
							C.BlockBookmarkCreateAndFetch(rootId, focused, length ? I.BlockPosition.Bottom : I.BlockPosition.Replace, url);
						};
					},
				}
			});
			return;
		};
		
		let id = '';
		let from = 0;
		let to = 0;

		C.BlockPaste(rootId, focused, range, selection.get(true), data.anytype.range.to > 0, { text: data.text, html: data.html, anytype: data.anytype.blocks, files: data.files }, (message: any) => {
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
				
				const length = block.getLength();
				
				id = block.id;
				from = length;
				to = length;
			} else 
			if (message.caretPosition >= 0) {
				id = focused;
				from = message.caretPosition;
				to = message.caretPosition;
			};
			
			this.focus(id, from, to, true);
		});
	};

	onHistory () {
		const { rootId, history } = this.props;
		history.push('/main/history/' + rootId);
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

	phraseCheck () {
		let blockCnt = Number(Storage.get('blockCnt')) || 0;
		blockCnt++;
		if (blockCnt == 10) {
			popupStore.open('settings', { data: { page: 'phrase' } });
		};
		if (blockCnt <= 11) {
			Storage.set('blockCnt', blockCnt);
		};
	};
	
	blockCreate (blockId: string, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;

		C.BlockCreate(param, rootId, blockId, position, (message: any) => {
			this.focus(message.blockId, 0, 0, false);
			this.phraseCheck();

			if (callBack) {
				callBack(message.blockId);
			};
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

		if ((!isToggle && !isOpen && childrenIds.length > 0) || (isToggle && isOpen)) {
			mode = I.BlockSplitMode.Inner;
		};

		if (isCode || (isToggle && isOpen)) {
			style = I.TextStyle.Paragraph;
		};

		range = Util.rangeFixOut(content.text, range);
		
		C.BlockSplit(rootId, focused.id, range, style, mode, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.focus(message.blockId, 0, 0, true);
			this.phraseCheck();

			if (isToggle && isOpen) {
				blockStore.toggle(rootId, message.blockId, true);
			};
		});
	};
	
	blockRemove (focused?: I.Block) {
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};

		menuStore.closeAll();
		popupStore.closeAll([ 'preview' ]);

		let next: any = null;
		let ids = selection.get();
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
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);

		if (!root || !allowed) {
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
		const controls = node.find('.editorControls');
		const size = node.find('#editorSize');
		const cover = node.find('.block.blockCover');
		const wrapper = $('.pageMainEdit .wrapper');
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page.isFull');
		const header = obj.find('#header');
		const root = blockStore.getLeaf(rootId, rootId);
		const container = this.getScrollContainer();
		const hh = header.height();

		if (blocks.length && last.length) {
			const ct = isPopup ? container.offset().top : 0;
			const h = container.height();
			const height = blocks.outerHeight() + blocks.offset().top - ct;

			last.css({ height: Math.max(Constant.size.lastBlock, h - height) });
		};

		if (note.length) {
			note.css({ top: hh });
		};
		if (controls.length) {	
			controls.css({ top: hh });
		};
		if (size.length) {
			size.css({ top: hh + 8 });
		};
		if (cover.length) {
			cover.css({ top: hh });
		};
		if (isPopup) {
			wrapper.css({ paddingTop: hh });
		};

		this.onResize(root?.fields?.width);
	};
	
	focus (id: string, from: number, to: number, scroll: boolean) {
		const { isPopup } = this.props;

		focus.set(id, { from: from, to: to });
		focus.apply();

		if (scroll) {
			focus.scroll(isPopup);
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
		w = Number(w) || 0;

		const container = this.getScrollContainer();
		const mw = container.width() - 120;
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (root && root.isObjectSet()) {
			return container.width() - 192;
		};

		w = (mw - Constant.size.editor) * w;
		this.width = w = Math.max(Constant.size.editor, Math.min(mw, Constant.size.editor + w));
		return w;
	};

});

export default EditorPage;