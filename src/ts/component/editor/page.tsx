import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon, Loader } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { I, C, M, Key, Util, DataUtil, Mark, focus, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

import BlockCover from 'ts/component/block/cover';
import Controls from './controls';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
};

interface State {
	loading: boolean;
};

const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');
const THROTTLE = 20;

@observer
class EditorPage extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	id: string = '';
	timeoutHover: number = 0;
	timeoutMove: number = 0;
	hoverId: string =  '';
	hoverPosition: number = 0;
	scrollTop: number = 0;
	uiHidden: boolean = false;
	state = {
		loading: false,
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDownBlock = this.onKeyDownBlock.bind(this);
		this.onKeyUpBlock = this.onKeyUpBlock.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMenuAdd = this.onMenuAdd.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onPrint = this.onPrint.bind(this);
		this.onLastClick = this.onLastClick.bind(this);
	};

	render () {
		const { loading } = this.state;
		if (loading) {
			return <Loader />;
		};
		
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (!root) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const list = blockStore.getChildren(rootId, rootId);
		const details = blockStore.getDetail(rootId, rootId);
		
		const withIcon = details.icon;
		const withCover = (details.coverType != I.CoverType.None) && details.coverId;
		
		const title = new M.Block({ id: rootId + '-title', type: I.BlockType.Title, childrenIds: [], fields: {}, content: {} });
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });
		
		let cn = [ 'editorWrapper' ];
		let icon = null;
		
		if (root.isPageProfile()) {
			cn.push('isProfile');
			icon = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconUser, childrenIds: [], fields: {}, content: {} });
		} else {
			icon = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, childrenIds: [], fields: {}, content: {} });
		};
		
		if (withIcon && withCover) {
			cn.push('withIconAndCover');
		} else
		if (withIcon) {
			cn.push('withIcon');
		} else
		if (withCover) {
			cn.push('withCover');
		};
		
		return (
			<div className={cn.join(' ')}>
				<Controls {...this.props} />
				{withCover ? <Block {...this.props} key={cover.id} block={cover} /> : ''}
				
				<div className="editor">
					<div className="blocks">
						<Icon id="button-add" className="buttonAdd" onClick={this.onAdd} />
					
						{withIcon ? <Block {...this.props} key={icon.id} block={icon} /> : ''}
						<Block 
							{...this.props} key={title.id} block={title}
							onKeyDown={this.onKeyDownBlock} 
							onKeyUp={this.onKeyUpBlock}
							onMenuAdd={this.onMenuAdd}
							onPaste={this.onPaste} 
						/>
					
						{list.map((block: I.Block, i: number) => {
							return (
								<Block 
									key={block.id} 
									{...this.props}
									index={i}
									block={block}
									onKeyDown={this.onKeyDownBlock} 
									onKeyUp={this.onKeyUpBlock}
									onMenuAdd={this.onMenuAdd}
									onPaste={this.onPaste}
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
		this._isMounted = true;
		
		const { rootId } = this.props;
		const win = $(window);
		
		keyboard.disableBack(true);
		this.unbind();
		this.open();
		
		win.on('mousemove.editor', throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('scroll.editor', throttle((e: any) => { this.onScroll(e); }, THROTTLE));
		win.on('keydown.editor', (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor', (e: any) => {
			if (!keyboard.focus) {
				this.onPaste(e); 
			};
		});
		
		this.resize();
		win.on('resize.editor', (e: any) => { this.resize(); });
		
		ipcRenderer.removeAllListeners('copyDocument');
		ipcRenderer.on('copyDocument', (e: any) => {});
	};
	
	componentDidUpdate () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));		
		const resizable = node.find('.resizable');
		
		this.open();
		
		if (this.uiHidden) {
			this.uiHide();
		};

		focus.apply();
		
		if (resizable.length) {
			resizable.trigger('resizeInit');
		};
		
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		
		const { rootId } = this.props;
		
		this.uiHidden = false;
		keyboard.disableBack(false);
		this.unbind();
		this.close(rootId);
		focus.clear(false);
	};
	
	open () {
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		
		if (this.id == rootId) {
			return;
		};
		
		this.setState({ loading: true });
		
		let children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		let bc: any[] = [];
		let lastTargetId = '';
		
		if (children.length) {
			let last = children[children.length - 1];
			if (last) {
				lastTargetId = last.content.targetBlockId;
			};
		};
		if (!lastTargetId || (lastTargetId != rootId)) {
			bc = [ breadcrumbs ];
		};
		
		this.close(this.id);
		this.id = rootId;
		C.BlockOpen(this.id, bc, (message: any) => {
			const { focused, range } = focus;
			const focusedBlock = blockStore.getLeaf(rootId, focused);
			
			if (!focusedBlock) {
				this.focusTitle();
			};

			this.resize();
			
			//window.setTimeout(() => {
				this.setState({ loading: false });
				blockStore.setNumbers(rootId);
			//}, 300);
		});
	};
	
	focusTitle () {
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const length = String(details.name || '').length;
		
		focus.set(rootId + '-title', { from: length, to: length });
		window.setTimeout(() => { focus.apply(); });
	};
	
	close (id: string) {
		if (!id) {
			return;
		};
		
		C.BlockClose(id, [], (message: any) => {
			blockStore.blocksClear(id);
		});
	};
	
	unbind () {
		$(window).unbind('keydown.editor mousemove.editor scroll.editor paste.editor resize.editor');
	};
	
	uiHide () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		$('.header').css({ opacity: 0 });
		$('.footer').css({ opacity: 0 });
		$('.icon.dnd').css({ opacity: 0 });
		$('#button-add').css({ opacity: 0 });
		
		this.uiHidden = true;
		
		window.clearTimeout(this.timeoutMove);
		this.timeoutMove = window.setTimeout(() => {
			win.unbind('mousemove.ui').on('mousemove.ui', (e: any) => { this.uiShow(); });
		}, 100);
	};

	uiShow () {
		const win = $(window);
		
		$('.header').css({ opacity: 1 });
		$('.footer').css({ opacity: 1 });
		$('.icon.dnd').css({ opacity: '' });
		$('#button-add').css({ opacity: '' });
		
		this.uiHidden = false;
		win.unbind('mousemove.ui');
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId } = this.props;
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.block');
		const container = $('.editor');
		
		if (!container.length) {
			return;
		};
		
		const root = blockStore.getLeaf(rootId, rootId);
		const details = blockStore.getDetail(rootId, rootId);
		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const st = win.scrollTop();
		const add = node.find('#button-add');
		const { pageX, pageY } = e;
		const withIcon = details.icon;
		const withCover = (details.coverType != I.CoverType.None) && details.coverId;

		let offset = 170;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, width: 0, height: 0 };
		
		if (withCover && withIcon) {
			offset = 408;
		} else
		if (withCover) {
			offset = 408;
		} else 
		if (withIcon) {
			offset = 224;
		};
		
		// Find hovered block by mouse coords
		items.each((i: number, item: any) => {
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
		
		if (keyboard.resize || commonStore.menuIsOpen()) {
			hovered = null;
		};
		
		const { x, y, width, height } = hoveredRect;
		
		window.clearTimeout(this.timeoutHover);
		
		if (hovered && (pageX >= x) && (pageX <= x + Constant.size.blockMenu) && (pageY >= offset) && (pageY <= st + rectContainer.height + offset)) {
			this.hoverPosition = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			
			let ax = hoveredRect.x - (rectContainer.x - Constant.size.blockMenu) + 2;
			let ay = pageY - rectContainer.y - 10 - st;
			
			add.css({ opacity: 1, transform: `translate3d(${ax}px,${ay}px,0px)` });
			items.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (pageX <= x + 20) {
				const block = blockStore.getLeaf(rootId, this.hoverId);
				
				if (block) {
					hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
				};
			};
		} else {
			this.timeoutHover = window.setTimeout(() => {
				add.css({ opacity: 0 });
				items.removeClass('showMenu isAdding top bottom');
			}, 10);
		};
		
		if (keyboard.drag) {
			add.css({ opacity: 0 });
			items.removeClass('showMenu isAdding top bottom');
			if (hovered) {
				hovered.addClass('showMenu');
			};
		};
	};
	
	onKeyDownEditor (e: any) {
		const { dataset, rootId } = this.props;
		const { root } = blockStore;
		const { selection } = dataset || {};
		const { focused, range } = focus;
		const k = e.which;
		
		if (keyboard.focus) {
			return;
		};
		
		const block = blockStore.getLeaf(rootId, focused);
		const node = $(ReactDOM.findDOMNode(this));
		const ids = selection.get();
		const map = blockStore.getMap(rootId);
		
		if (e.ctrlKey || e.metaKey) {
			if (k == Key.a) {
				e.preventDefault();
				this.onSelectAll();
			};
			
			if (k == Key.c) {
				e.preventDefault();
				this.onCopy(e, false);
			};
			
			if (k == Key.x) {
				e.preventDefault();
				this.onCopy(e, true);
			};
			
			if (k == Key.z) {
				e.preventDefault();
				e.shiftKey ? C.BlockRedo(rootId) : C.BlockUndo(rootId);
			};
			
			if (k == Key.y) {
				e.preventDefault();
				C.BlockRedo(rootId);
			};
			
			if (k == Key.p) {
				this.onPrint(e);
			};
			
			if (k == Key.d) {
				e.preventDefault();
				focus.clear(true);
				C.BlockListDuplicate(rootId, ids, ids[ids.length - 1], I.BlockPosition.Bottom, (message: any) => {});
			};
		};
		
		if (k == Key.backspace) {
			e.preventDefault();
			this.blockRemove(block);
		};
		
		// Indent block
		if (k == Key.tab) {
			e.preventDefault();
			
			if (!ids.length) {
				return;
			};
			
			// Indent block
			if (k == Key.tab) {
				e.preventDefault();
				
				if (!ids.length) {
					return;
				};
				
				const first = blockStore.getLeaf(rootId, ids[0]);
				const element = map[first.id];
				const parent = blockStore.getLeaf(rootId, element.parentId);
				const next = blockStore.getNextBlock(rootId, first.id, -1);
				const obj = e.shiftKey ? parent : next;
				const canTab = obj && !first.isTitle() && obj.isIndentable();
				
				if (canTab) {
					C.BlockListMove(rootId, rootId, ids, obj.id, (e.shiftKey ? I.BlockPosition.Bottom : I.BlockPosition.Inner));
				};
			};
		};
	};
	
	onKeyDownBlock (e: any, text?: string, marks?: I.Mark[]) {
		const { dataset, rootId } = this.props;
		const { focused, range } = focus;
		const { selection } = dataset || {};
		const block = blockStore.getLeaf(rootId, focused);
		
		if (!block) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const map = blockStore.getMap(rootId);
		const { type, content } = block;

		let length = String(text || '').length;
		let k = e.which;
		
		this.uiHide();
		
		if (e.ctrlKey || e.metaKey) {
			if ((k == Key.a) && (range.from == 0) && (range.to == length)) {
				e.preventDefault();
				this.onSelectAll();
			};
			
			if (k == Key.c) {
				this.onCopy(e, false);
			};
			
			if (k == Key.x) {
				this.onCopy(e, true);
			};

			if (k == Key.p) {
				this.onPrint(e);
			};

			if (k == Key.z) {
				e.preventDefault();
				const cb = (message: any) => { focus.clear(true); };
				e.shiftKey ? C.BlockRedo(rootId, cb) : C.BlockUndo(rootId, cb);
			};
			
			if (k == Key.y) {
				e.preventDefault();
				C.BlockRedo(rootId, (message: any) => { focus.clear(true); });
			};
			
			if (k == Key.d) {
				e.preventDefault();
				C.BlockListDuplicate(rootId, [ focused ], focused, I.BlockPosition.Bottom, (message: any) => {
					if (message.blockIds.length) {
						focus.set(message.blockIds[message.blockIds.length - 1], { from: length, to: length });
						focus.apply();
					};
				});
			};
			
			// Open action menu
			if (k == Key.slash) {
				commonStore.menuOpen('blockAction', { 
					element: '#block-' + focused,
					type: I.MenuType.Vertical,
					offsetX: Constant.size.blockMenu,
					offsetY: 0,
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Left,
					data: {
						blockId: focused,
						blockIds: DataUtil.selectionGet(this.props),
						rootId: rootId,
					},
					onClose: () => {
						selection.setPreventClear(false);
					}
				});
			};
			
			// Mark-up
			if (!block.isTitle() && range.to && (range.from != range.to)) {
				let call = false;
				let type = 0;
				
				// Bold
				if (k == Key.b) {
					call = true;
					type = I.MarkType.Bold;
				};
				
				// Italic
				if (k == Key.i) {
					call = true;
					type = I.MarkType.Italic;
				};
				
				// Strikethrough
				if ((k == Key.s) && e.shiftKey) {
					call = true;
					type = I.MarkType.Strike;
				};
				
				// Link
				if (k == Key.k) {
					call = true;
					type = I.MarkType.Link;
				};
				
				// Code
				if (k == Key.e) {
					call = true;
					type = I.MarkType.Code;
				};
				
				if (call) {
					e.preventDefault();
					
					if (type == I.MarkType.Link) {
						let mark = Mark.getInRange(marks, type, range);
						commonStore.menuOpen('blockLink', {
							type: I.MenuType.Horizontal,
							element: $('#menuBlockContext'),
							offsetX: 0,
							offsetY: -44,
							vertical: I.MenuDirection.Top,
							horizontal: I.MenuDirection.Center,
							data: {
								value: (mark ? mark.param : ''),
								onChange: (param: string) => {
									param = Util.urlFix(param);
									marks = Mark.toggle(marks, { type: type, param: param, range: range });
									DataUtil.blockSetText(rootId, block, text, marks);
								}
							}
						});
					} else {
						marks = Mark.toggle(marks, { type: type, range: range });
						DataUtil.blockSetText(rootId, block, text, marks);
					};
				};
			};
		};
		
		// Cursor keys
		if ((k == Key.up) || (k == Key.down)) {
			if (commonStore.menuIsOpen()) {
				return;
			};
			
			const dir = (k == Key.up) ? -1 : 1;
			
			let canFocus = false;
			let next;
			
			if (
				block.isText() && 
				(
					((range.from == 0) && (k == Key.up)) || 
					((range.to >= length) && (k == Key.down))
				)
			) {
				canFocus = true;
			} else 
			if (!block.isText()) {
				canFocus = block.isFocusable();
			};
			
			// Move block
			if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
				e.preventDefault();
				
				next = blockStore.getNextBlock(rootId, focused, dir, (item: any) => {
					return !item.isIcon() && !item.isTitle();
				});
				if (next) {
					C.BlockListMove(rootId, rootId, [ focused ], next.id, (dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom));	
				};
				return;
			};
			
			if (canFocus) {
				e.preventDefault();
				
				if (e.ctrlKey || e.metaKey) {
					const root = map[rootId];
					next = blockStore.getFirstBlock(rootId, -dir, (item: any) => { return item.isText(); });
					
					if (next) {
						const l = String(next.content.text || '').length;
						focus.set(next.id, (dir < 0 ? { from: 0, to: 0 } : { from: l, to: l }));
						focus.apply();
					};
				} else
				if (e.shiftKey) {
					if (selection.get(true).length < 1) {
						selection.set([ focused ]);
						focus.clear(true);
						
						commonStore.menuClose('blockContext');
						commonStore.menuClose('blockAction');
					};
				} else {
					next = blockStore.getNextBlock(rootId, focused, dir, (it: I.Block) => { return it.isFocusable(); });
					
					if (next) {
						const parent = blockStore.getLeaf(rootId, next.parentId);
						const l = String(next.content.text || '').length;
						
						// Auto-open toggle blocks 
						if (parent && parent.isToggle()) {
							node.find('#block-' + parent.id).addClass('isToggled');
						};
						
						focus.set(next.id, (dir > 0 ? { from: 0, to: 0 } : { from: l, to: l }));
						focus.apply();
					};
				};
			};
		};
		
		// Backspace
		if (k == Key.backspace) {
			if (block.isText() && !range.to) {
				const ids = selection.get(true);
				ids.length ? this.blockRemove(block) : this.blockMerge(block);
			};
			if (!block.isText() && !keyboard.focus) {
				this.blockRemove(block);
			};
		};
		
		// Tab, indent block
		if (k == Key.tab) {
			e.preventDefault();
			
			const element = map[block.id];
			const parent = blockStore.getLeaf(rootId, element.parentId);
			const next = blockStore.getNextBlock(rootId, block.id, -1);
			const obj = e.shiftKey ? parent : next;
			const canTab = obj && !block.isTitle() && obj.isIndentable();
			
			if (canTab) {
				C.BlockListMove(rootId, rootId, [ block.id ], obj.id, (e.shiftKey ? I.BlockPosition.Bottom : I.BlockPosition.Inner), (message: any) => {
					focus.apply();
				});
			};
		};
		
		// Enter
		if (k == Key.enter) {
			if (e.shiftKey || block.isCode() || (!block.isText() && keyboard.focus)) {
				return;
			};
			
			const menus = commonStore.menus;
			const menuCheck = (menus.length > 1) || ((menus.length == 1) && (menus[0].id != 'blockContext'));
			
			if (menuCheck) {
				return;
			};
			
			e.preventDefault();
			
			if ((range.from == length) && (range.to == length)) {
				let style = I.TextStyle.Paragraph;
				let replace = false;
				
				// If block is non-empty list - create new list block of the same style, 
				// otherwise - replace empty list block with paragraph
				if (block.isNumbered() || block.isBulleted() || block.isCheckbox()) {
					if (length) {
						style = block.content.style;
					} else {
						replace = true;
					};
				};
				
				if (replace) {
					C.BlockListSetTextStyle(rootId, [ block.id ], I.TextStyle.Paragraph);
				} else {
					this.blockSplit(block, range, style);
				};
			} else 
			if (!block.isTitle()) {
				this.blockSplit(block, range, block.content.style);
			};
		};
	};
	
	onKeyUpBlock (e: any, text?: string, marks?: I.Mark[]) {
	};
	
	onSelectAll () {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const ids = blockStore.getBlocks(rootId, (it: any) => { return it.isSelectable(); }).map((it: any) => { return it.id; }); 
		
		selection.set(ids);
		commonStore.menuClose('blockContext');
	};
	
	onAdd (e: any) {
		if (!this.hoverId || (this.hoverPosition == I.BlockPosition.None)) {
			return;
		};
		
		const { rootId } = this.props;
		const block = blockStore.getLeaf(rootId, this.hoverId);
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!block || (block.isTitle() && (this.hoverPosition != I.BlockPosition.Bottom)) || block.isLayoutColumn() || block.isIcon()) {
			return;
		};
		
		commonStore.filterSet('');
		focus.clear(true);
		
		this.blockCreate(block, this.hoverPosition, {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		}, (blockId: string) => {
			$('.placeHolder.c' + blockId).text(Constant.placeHolder.filter);
			this.onMenuAdd(blockId);
		});
	};
	
	onMenuAdd (id: string) {
		const { rootId } = this.props;
		const block = blockStore.getLeaf(rootId, id);
		if (!block) {
			return;
		};
		
		const { type, content } = block;
		const { style, text, hash } = content;
		
		const length = String(text || '').length;
		const cb = (message: any) => {
			focus.set(message.blockId, { from: length, to: length });
			focus.apply();
		};
		
		commonStore.menuOpen('blockAdd', { 
			element: '#block-' + id,
			type: I.MenuType.Vertical,
			offsetX: 50,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onClose: () => {
				const { filter } = commonStore;
				const block = blockStore.getLeaf(rootId, id);;

				// Clear filter in block text on close
				if (block && ('/' + filter == block.content.text)) {
					DataUtil.blockSetText(rootId, block, '', []);
				};
				
				focus.apply();
				commonStore.filterSet('');
				$('.placeHolder.c' + id).text(Constant.placeHolder.default);
			},
			data: {
				blockId: id,
				rootId: rootId,
				onSelect: (e: any, item: any) => {
					
					// Text colors
					if (item.isTextColor) {
						C.BlockListSetTextColor(rootId, [ id ], item.value, cb);
					} else 
					
					// Background colors
					if (item.isBgColor) {
						C.BlockListSetBackgroundColor(rootId, [ id ], item.value, cb);
					} else 
					
					// Actions
					if (item.isAction) {
						switch (item.key) {
							
							case 'download':
								if (hash) {
									ipcRenderer.send('download', commonStore.fileUrl(hash));
								};
								break;
								
							case 'remove':
								this.blockRemove(block);
								break;
								
						};
					} else
					
					// Align
					if (item.isAlign) {
						C.BlockListSetAlign(rootId, [ id ], item.value, cb);
					} else 
					
					// Blocks
					if (item.isBlock) {
						let param: any = {
							type: item.type,
							content: {},
						};
							
						if (item.type == I.BlockType.Text) {
							param.content.style = item.key;
						};
						
						if (item.type == I.BlockType.File) {
							param.content.type = item.key;
						};
						
						if (item.type == I.BlockType.Div) {
							param.content.style = item.key;
						};
						
						if (item.type == I.BlockType.Page) {
							this.blockCreatePage(block, { name: Constant.default.name }, I.BlockPosition.Replace);
						} else {
							this.blockCreate(block, I.BlockPosition.Replace, param);
						};
					};
				}
			}
		});
	};
	
	onScroll (e: any) {
		const top = $(window).scrollTop();
		
		if (Math.abs(top - this.scrollTop) >= 10) {
			this.uiHide();
		};
		
		this.scrollTop = top;
		Util.linkPreviewHide(false);
	};
	
	onCopy (e: any, cut: boolean) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused, range } = focus;
		
		let ids = selection.get(true);
		if (!ids.length) {
			ids = [ focused ];
		};
		
		ids = ids.concat(this.getLayoutIds(ids));
		
		const tree = blockStore.getTree(rootId, blockStore.getBlocks(rootId));
		const cmd = cut ? 'BlockCut': 'BlockCopy';
		
		let data: any = {};
		let text: any = [];
		let ret = blockStore.unwrapTree(tree).filter((it: I.Block) => {
			return ids.indexOf(it.id) >= 0;
		});
		ret = Util.arrayUniqueObjects(ret, 'id');

		ret.map((it: I.Block) => {
			if (it.type == I.BlockType.Text) {
				text.push(String(it.content.text || ''));
			};
		});
		text = text.join('\n');
		
		data = { 
			text: text, 
			html: null, 
			anytype: { 
				range: range,
				blocks: ret, 
			}
		};
		
		Util.clipboardCopy(data);
		C[cmd](rootId, ret, (message: any) => {
			data.html = message.html;
			Util.clipboardCopy(data);
		});
	};
	
	onPrint (e: any) {
		window.print();
	};

	getLayoutIds (ids: string[]) {
		if (!ids.length) {
			return [];
		};
		
		const { rootId } = this.props;
		const map = blockStore.getMap(rootId);
		
		let ret: any[] = [];
		for (let id of ids) {
			let element = map[id];
			if (!element) {
				continue;
			};

			let parent = blockStore.getLeaf(rootId, element.parentId);
			if (!parent || !parent.isLayout()) {
				continue;
			};
			
			ret.push(parent.id);
			
			if (parent.isLayoutColumn()) {
				ret = ret.concat(this.getLayoutIds([ parent.id ]));
			};
		};
		
		return ret;
	};
	
	onPaste (e: any, force?: boolean, data?: any) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused, range } = focus;
		
		if (!data) {
			const cb = e.clipboardData || e.originalEvent.clipboardData;
			
			data = {
				text: String(cb.getData('text/plain') || ''),
				html: String(cb.getData('text/html') || ''),
				anytype: JSON.parse(String(cb.getData('application/anytype') || '[]')),
			};
		};
		
		const block = blockStore.getLeaf(rootId, focused);
		const length = block ? block.getLength() : 0;
		const reg = new RegExp(/^((?:[^\s:\?#]+:(?:\/\/)?)|\/\/)([^\s\/\?#]+)([^\s\?#]+)(?:\?([^#\s]*))?(?:#([^\s]*))?$/gi);
		const match = data.text.match(reg);
		const url = match && match[0];
		
		if (url && !force) {
			commonStore.menuOpen('select', { 
				element: '#block-' + focused,
				type: I.MenuType.Vertical,
				offsetX: Constant.size.blockMenu,
				offsetY: 4,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Left,
				data: {
					value: '',
					options: [
						{ id: 'cancel', name: 'Dismiss' },
						{ id: 'bookmark', name: 'Create bookmark' },
						//{ id: 'embed', name: 'Create embed' },
					],
					onSelect: (event: any, id: string) => {
						if (id == 'cancel') {
							this.onPaste(e, true, data);
						};
						if (id == 'bookmark') {
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
		
		C.BlockPaste(rootId, focused, range, data.anytype.range, selection.get(true), { text: data.text, html: data.html, anytype: data.anytype.blocks }, (message: any) => {
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
			} else {
				id = focused;
				from = range.to;
				to = range.to;
			};
			
			this.focus(id, from, to);
		});
	};
	
	blockCreate (focused: I.Block, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;
		
		C.BlockCreate(param, rootId, (focused ? focused.id : ''), position, (message: any) => {
			this.focus(message.blockId, 0, 0);
			
			if (callBack) {
				callBack(message.blockId);
			};
		});
	};
	
	blockCreatePage (focused: I.Block, details: any, position: I.BlockPosition, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;
		
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });
		C.BlockCreatePage(rootId, focused.id, details, position, (message: any) => {
			DataUtil.pageOpen({}, this.props, message.blockId, message.targetId);
			commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
			
			if (callBack) {
				callBack(message.blockId);
			};
		});
	};
	
	blockMerge (focused: I.Block) {
		const { rootId } = this.props;
		const next = blockStore.getNextBlock(rootId, focused.id, -1, (it: any) => {
			return it.isFocusable();
		});
		
		if (!next) {
			return;
		};

		const nl = String(next.content.text || '').length;
		
		let length = 0;		
		let cb = (message: any) => {
			if (message.error.code) {
				return;
			};
			
			this.focus(next.id, nl, nl);
		};
		
		if (next.isText()) {
			C.BlockMerge(rootId, next.id, focused.id, cb);
		} else {
			length = String(focused.content.text || '').length;
			if (!length) {
				C.BlockUnlink(rootId, [ focused.id ], cb);
			};
		};
	};
	
	blockSplit (focused: I.Block, range: I.TextRange, style: I.TextStyle) {
		const { rootId } = this.props;
		const { content } = focused;
		
		range = Util.rangeFixOut(content.text, range);
		
		C.BlockSplit(rootId, focused.id, range, style, (message: any) => {
			this.focus(focused.id, 0, 0);
			focus.scroll();
		});
	};
	
	blockRemove (focused?: I.Block) {
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};
		
		commonStore.menuClose('blockAdd');
		commonStore.menuClose('blockAddSub');
		commonStore.menuClose('blockAction');
		commonStore.menuClose('blockContext');

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
		
		C.BlockUnlink(rootId, blockIds, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (next && next.isFocusable()) {
				let length = String(next.content.text || '').length;
				this.focus(next.id, length, length);
			};
		});
	};
	
	onLastClick (e: any) {
		const { rootId } = this.props;
		const children = blockStore.getChildren(rootId, rootId);
		const last = children[children.length - 1];
		
		let create = false;
		let length = 0;
		
		if (!last) {
			create = true;
		} else {
			if (!last.isText()) {
				create = true;
			} else {
				length = String(last.content.text || '').length;
				if (length) {
					create = true;
				};
			};
		};
		
		if (create) {
			this.blockCreate(last, I.BlockPosition.Bottom, { type: I.BlockType.Text });
		} else {
			this.focus(last.id, length, length);
		};
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('editorWrapper')) {
			return;
		};
		
		const last = node.find('.blockLast').css({ height: 0 });
		const height = Math.max(Constant.size.lastBlock, win.height() - (node.outerHeight() + Constant.size.header));
		
		last.css({ height: height });
	};
	
	focus (id: string, from: number, to: number) {
		focus.set(id, { from: from, to: to });
		focus.apply();
		this.resize();
	};
	
};

export default EditorPage;