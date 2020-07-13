import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon, Loader } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { I, C, M, Key, Util, DataUtil, SmileUtil, Mark, focus, keyboard, crumbs, Storage, Mapper } from 'ts/lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

import Controls from './controls';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
	onOpen?(): void;
};

interface State {
	loading: boolean;
};

const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');
const $ = require('jquery');
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
		const children = blockStore.getChildren(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const length = childrenIds.length;

		const withIcon = details.iconEmoji || details.iconImage;
		const withCover = (details.coverType != I.CoverType.None) && details.coverId;
		
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });
		
		let cn = [ 'editorWrapper' ];
		let icon: any = { id: rootId + '-icon', childrenIds: [], fields: {}, content: {} };
		
		if (root.isPageProfile()) {
			cn.push('isProfile');
			icon.type = I.BlockType.IconUser;
		} else {
			icon.type = I.BlockType.IconPage;
		};

		if (root.isPageSet()) {
			cn.push('isDataview');
		};
		
		icon = new M.Block(icon);
		
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
					
						{withIcon ? (
							<Block 
								{...this.props} key={icon.id} block={icon} 
								className="root" 
							/>	
						) : ''}
						
						{children.map((block: I.Block, i: number) => {
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
		win.on('scroll.editor', (e: any) => { this.onScroll(e); });
		win.on('keydown.editor', (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor', (e: any) => {
			if (!keyboard.isFocused) {
				this.onPaste(e); 
			};
		});
		
		this.resize();
		win.on('resize.editor', (e: any) => { this.resize(); });

		ipcRenderer.removeAllListeners('commandEditor');
		ipcRenderer.on('commandEditor', (e: any, cmd: string) => { this.onCommand(cmd); });
	};
	
	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));		
		const resizable = node.find('.resizable');
		
		this.open();
		
		window.setTimeout(() => {
			if (this.uiHidden) {
				this.uiHide();
			};
			
			focus.apply();

			if (resizable.length) {
				resizable.trigger('resizeInit');
			};
			
			this.resize();
		}, 15);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		
		const { rootId } = this.props;
		
		this.uiHidden = false;
		keyboard.disableBack(false);
		this.unbind();
		this.close(rootId);
		focus.clear(false);
		Storage.delete('pageId');

		ipcRenderer.removeAllListeners('commandEditor');
	};
	
	open (skipInit?: boolean) {
		const { rootId, onOpen, history } = this.props;
		const { breadcrumbs } = blockStore;

		// Fix editor refresh without breadcrumbs init, skipInit flag prevents recursion
		if (!breadcrumbs && !skipInit) {
			DataUtil.pageInit(() => {
				this.open(true);
			});
			return;
		};
		
		if (this.id == rootId) {
			return;
		};
		
		this.setState({ loading: true });
		
		let cr = crumbs.get(I.CrumbsType.Page);
		let lastTargetId = '';
		
		if (cr.ids.length) {
			lastTargetId = cr.ids[cr.ids.length - 1];
		};
		if (!lastTargetId || (lastTargetId != rootId)) {
			cr = crumbs.add(I.CrumbsType.Page, rootId);
		};
		
		crumbs.save(I.CrumbsType.Page, cr);
		
		this.close(this.id);
		this.id = rootId;
		
		C.BlockOpen(this.id, (message: any) => {
			if (message.error.code) {
				history.push('/main/index');
				return;
			};

			const { focused } = focus;
			const focusedBlock = blockStore.getLeaf(rootId, focused);
			
			if (!focusedBlock) {
				this.focusTitle();
			};

			this.setState({ loading: false });
			this.resize();

			blockStore.setNumbers(rootId);

			if (onOpen) {
				onOpen();
			};
		});
	};

	onCommand (cmd: string) {
		if (keyboard.isFocused) {
			return;
		};

		const { rootId } = this.props;
		const { focused, range } = focus;

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
		const details = blockStore.getDetails(rootId, rootId);

		if (details.name == Constant.default.name) {
			focus.set(rootId + '-title', { from: 0, to: 0 });
			focus.apply();
		};
	};
	
	close (id: string) {
		if (!id) {
			return;
		};
		
		C.BlockClose(id, (message: any) => {
			blockStore.blocksClear(id);
		});
	};
	
	unbind () {
		$(window).unbind('keydown.editor mousemove.editor scroll.editor paste.editor resize.editor');
	};
	
	uiHide () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		$('.footer').css({ opacity: 0 });
		$('#button-add').css({ opacity: 0 });
		
		this.uiHidden = true;
		
		window.clearTimeout(this.timeoutMove);
		this.timeoutMove = window.setTimeout(() => {
			win.unbind('mousemove.ui').on('mousemove.ui', (e: any) => { this.uiShow(); });
		}, 100);
	};

	uiShow () {
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
		if (!root || root.isPageSet()) {
			return;
		};
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.block');
		const container = $('.editor');
		
		if (!container.length) {
			return;
		};
		
		const details = blockStore.getDetails(rootId, rootId);
		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const st = win.scrollTop();
		const add = node.find('#button-add');
		const { pageX, pageY } = e;
		const withIcon = details.iconEmoji;
		const withCover = (details.coverType != I.CoverType.None) && details.coverId;

		let offset = 220;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, width: 0, height: 0 };
		
		if (withCover && withIcon) {
			offset = 408;
		} else
		if (withCover) {
			offset = 408;
		} else 
		if (withIcon) {
			offset = 274;
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
		
		if (keyboard.isResizing || commonStore.menuIsOpen()) {
			hovered = null;
		};
		
		const { x, y, width, height } = hoveredRect;
		
		window.clearTimeout(this.timeoutHover);
		
		if (keyboard.isDragging) {
			add.css({ opacity: 0 });
			items.removeClass('showMenu isAdding top bottom');
			
			if (hovered) {
				hovered.addClass('showMenu');
			};
			return;
		};
		
		if (hovered && (pageX >= x) && (pageX <= x + Constant.size.blockMenu) && (pageY >= offset) && (pageY <= st + rectContainer.height + offset)) {
			this.hoverPosition = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			
			let ax = hoveredRect.x - (rectContainer.x - Constant.size.blockMenu) + 2;
			let ay = pageY - rectContainer.y - 10 - st;
			
			add.css({ opacity: 1, transform: `translate3d(${ax}px,${ay}px,0px)` });
			items.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (pageX <= x + 20) {
				const block = blockStore.getLeaf(rootId, this.hoverId);
				
				if (block && !block.isLayoutColumn() && !block.isLayoutDiv()) {
					hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
				};
			};
		} else {
			this.timeoutHover = window.setTimeout(() => {
				add.css({ opacity: 0 });
				items.removeClass('showMenu isAdding top bottom');
			}, 10);
		};
	};
	
	onKeyDownEditor (e: any) {
		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused } = focus;
		const k = e.key.toLowerCase();

		if (keyboard.isFocused) {
			return;
		};
		
		const block = blockStore.getLeaf(rootId, focused);
		const ids = selection.get();
		const map = blockStore.getMap(rootId);

		// Print
		if ((k == Key.p) && keyboard.ctrlByPlatform(e)) {
			this.onPrint(e);
		};
		
		if (e.ctrlKey || e.metaKey) {
			// Select all
			if (k == Key.a) {
				e.preventDefault();
				this.onSelectAll();
			};
			
			// Copy
			if (k == Key.c) {
				this.onCopy(e, false);
			};
			
			// Cut
			if (k == Key.x) {
				this.onCopy(e, true);
			};
			
			// Undo
			if (k == Key.z) {
				e.preventDefault();
				e.shiftKey ? C.BlockRedo(rootId) : C.BlockUndo(rootId);
			};
			
			// Redo
			if (k == Key.y) {
				e.preventDefault();
				C.BlockRedo(rootId);
			};
			
			if (ids.length) {
				// Bold
				if (k == Key.b) {
					C.BlockListSetTextMark(rootId, ids, { type: I.MarkType.Bold, param: '', range: { from: 0, to: 0 } });
				};

				// Italic
				if (k == Key.i) {
					C.BlockListSetTextMark(rootId, ids, { type: I.MarkType.Italic, param: '', range: { from: 0, to: 0 } });
				};

				// Strikethrough
				if ((k == Key.s) && e.shiftKey) {
					C.BlockListSetTextMark(rootId, ids, { type: I.MarkType.Strike, param: '', range: { from: 0, to: 0 } });
				};

				// Link
				if (k == Key.l) {
					commonStore.menuOpen('blockLink', {
						type: I.MenuType.Horizontal,
						element: $('#block-' + ids[0]),
						offsetX: 0,
						offsetY: -44,
						vertical: I.MenuDirection.Top,
						horizontal: I.MenuDirection.Center,
						data: {
							value: '',
							onChange: (param: string) => {
								C.BlockListSetTextMark(rootId, ids, { type: I.MarkType.Link, param: param, range: { from: 0, to: 0 } });
							}
						}
					});
				};
			};
			
			// Code
			if (k == Key.k) {
				C.BlockListSetTextMark(rootId, ids, { type: I.MarkType.Code, param: '', range: { from: 0, to: 0 } });
			};
			
			// Duplicate
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
			
			const first = blockStore.getLeaf(rootId, ids[0]);
			const element = map[first.id];
			const parent = blockStore.getLeaf(rootId, element.parentId);
			const next = blockStore.getNextBlock(rootId, first.id, -1);
			const obj = e.shiftKey ? parent : next;
			const canTab = obj && !first.isTitle() && obj.canHaveChildren() && first.isIndentable();
				
			if (canTab) {
				C.BlockListMove(rootId, rootId, ids, obj.id, (e.shiftKey ? I.BlockPosition.Bottom : I.BlockPosition.Inner));
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
		
		const platform = Util.getPlatform();
		const node = $(ReactDOM.findDOMNode(this));
		const map = blockStore.getMap(rootId);
		const length = String(text || '').length;

		let k = e.key.toLowerCase();

		// Ctrl + P and Ctrl + N on MacOs work like up/down arrows
		if ((platform == I.Platform.Mac) && e.ctrlKey) {
			if (k == Key.p) {
				k = Key.up;
				e.ctrlKey = false;
			};
			if (k == Key.n) {
				k = Key.down;
				e.ctrlKey = false;
			};
		};

		this.uiHide();

		// Print
		if ((k == Key.p) && keyboard.ctrlByPlatform(e)) {
			this.onPrint(e);
		};

		if (e.ctrlKey || e.metaKey) {

			// Select all
			if ((k == Key.a) && (range.from == 0) && (range.to == length)) {
				e.preventDefault();
				if ((range.from == 0) && (range.to == length)) {
					this.onSelectAll();
				} else {
					focus.set(focused, { from: 0, to: length });
					focus.apply();
				};
			};
			
			// Copy
			if (k == Key.c) {
				this.onCopy(e, false);
			};
			
			// Cut
			if (k == Key.x) {
				this.onCopy(e, true);
			};

			// Undo
			if (k == Key.z) {
				e.preventDefault();
				const cb = (message: any) => { focus.clear(true); };
				e.shiftKey ? C.BlockRedo(rootId, cb) : C.BlockUndo(rootId, cb);
			};
			
			// Redo
			if (k == Key.y) {
				e.preventDefault();
				C.BlockRedo(rootId, (message: any) => { focus.clear(true); });
			};
			
			// Duplicate
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
						blockIds: DataUtil.selectionGet(focused, this.props),
						rootId: rootId,
						dataset: dataset,
					},
					onClose: () => {
						selection.preventClear(false);
						selection.clear();
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
				if (k == Key.l) {
					call = true;
					type = I.MarkType.Link;
				};
				
				// Code
				if (k == Key.k) {
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
									marks = Mark.toggle(marks, { type: type, param: param, range: range });
									DataUtil.blockSetText(rootId, block, text, marks, true);
								}
							}
						});
					} else {
						marks = Mark.toggle(marks, { type: type, range: range });
						DataUtil.blockSetText(rootId, block, text, marks, true);
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
					next = blockStore.getFirstBlock(rootId, -dir, (item: any) => { return item.isFocusable(); });
					if (next) {
						const l = next.getLength();
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
			if (!block.isText() && !keyboard.isFocused) {
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
			const canTab = obj && !block.isTitle() && obj.canHaveChildren() && block.isIndentable();

			if (canTab) {
				C.BlockListMove(rootId, rootId, [ block.id ], obj.id, (e.shiftKey ? I.BlockPosition.Bottom : I.BlockPosition.Inner), (message: any) => {
					focus.apply();
				});
			};
		};
		
		// Enter
		if (k == Key.enter) {
			if (e.shiftKey || block.isCode() || (!block.isText() && keyboard.isFocused)) {
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
		
		commonStore.filterSet(0, '');
		focus.clear(true);
		
		this.blockCreate(block, this.hoverPosition, {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		}, (blockId: string) => {
			$('.placeHolder.c' + blockId).text(Constant.placeHolder.filter);
			this.onMenuAdd(blockId, '', { from: 0, to: 0 });
		});
	};
	
	onMenuAdd (id: string, text: string, range: I.TextRange) {
		const { rootId } = this.props;
		const block = blockStore.getLeaf(rootId, id);

		if (!block) {
			return;
		};
		
		const { content } = block;
		const { marks, hash } = content;
		
		const length = String(text || '').length;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace; 
		const cb = (message: any) => {
			focus.set(message.blockId, { from: length, to: length });
			focus.apply();
		};

		const el = $('#block-' + id);
		const offset = el.offset() || {};
		const rect = Util.selectionRect();
		
		let x = rect.x - offset.left;
		let y = rect.y - (offset.top - $(window).scrollTop()) - el.outerHeight() + rect.height + 8;

		if (!rect.x && !rect.y) {
			x = Constant.size.blockMenu;
			y = -4;
		};

		commonStore.filterSet(range.from, '');
		commonStore.menuOpen('blockAdd', { 
			element: el,
			type: I.MenuType.Vertical,
			offsetX: x,
			offsetY: y,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onClose: () => {
				focus.apply();
				commonStore.filterSet(0, '');
				$('.placeHolder.c' + id).text(Constant.placeHolder.default);
			},
			data: {
				blockId: id,
				rootId: rootId,
				onSelect: (e: any, item: any) => {
					// Clear filter in block text
					const block = blockStore.getLeaf(rootId, id);
					if (block) {
						DataUtil.blockSetText(rootId, block, text, marks, true);
					};
					
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
							if (item.key == 'existing') {
								commonStore.popupOpen('navigation', { 
									preventResize: true,
									data: { 
										type: I.NavigationType.Create, 
										rootId: rootId,
										expanded: true,
										skipId: rootId,
										blockId: block.id,
										position: position,
									}, 
								});
							} else {
								DataUtil.pageCreate(e, rootId, block.id, { iconEmoji: SmileUtil.random() }, position);
							};
						} else {
							this.blockCreate(block, position, param);
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
		e.preventDefault();

		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};

		let { focused, range } = focus;
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
				commonStore.menuClose('blockContext');
				focus.set(focused, { from: range.from, to: range.from });
				focus.apply();
			};
		};
		
		Util.clipboardCopy(data, () => {
			C[cmd](rootId, blocks, range, cb);
		});
	};
	
	onPaste (e: any, force?: boolean, data?: any) {
		e.preventDefault();

		const { dataset, rootId } = this.props;
		const { selection } = dataset || {};
		const { focused, range } = focus;
		
		if (!data) {
			const cb = e.clipboardData || e.originalEvent.clipboardData;
			data = {
				text: String(cb.getData('text/plain') || ''),
				html: String(cb.getData('text/html') || ''),
				anytype: JSON.parse(String(cb.getData('application/json') || '{}')),
			};
			data.anytype.range = data.anytype.range || { from: 0, to: 0 };
		};
		
		const block = blockStore.getLeaf(rootId, focused);
		const length = block ? block.getLength() : 0;
		const reg = new RegExp(/^((?:https?:(?:\/\/)?)|\/\/)([^\s\/\?#]+)([^\s\?#]+)(?:\?([^#\s]*))?(?:#([^\s]*))?$/gi);
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
					onSelect: (event: any, item: any) => {
						if (item.id == 'cancel') {
							this.onPaste(e, true, data);
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
		
		C.BlockPaste(rootId, focused, range, selection.get(true), data.anytype.range.to > 0, { text: data.text, html: data.html, anytype: data.anytype.blocks }, (message: any) => {
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
			
			this.focus(id, from, to);
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
			if (!parent || !parent.isLayout() || parent.isLayoutDiv()) {
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
			commonStore.popupOpen('settings', { 
				data: { page: 'phrase' } 
			});
		};
		if (blockCnt <= 11) {
			Storage.set('blockCnt', blockCnt);
		};
	};
	
	blockCreate (focused: I.Block, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;
		
		C.BlockCreate(param, rootId, (focused ? focused.id : ''), position, (message: any) => {
			this.focus(message.blockId, 0, 0);
			this.phraseCheck();

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

		const length = focused.getLength();
		const nl = next.getLength();
		const cb = (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (next) {
				this.focus(next.id, nl, nl);
			};
		};

		if (next.isText()) {
			C.BlockMerge(rootId, next.id, focused.id, cb);
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
					const nl = next.getLength();
					this.focus(next.id, nl, nl);
				};
			});
		};
	};
	
	blockSplit (focused: I.Block, range: I.TextRange, style: I.TextStyle) {
		const { rootId } = this.props;
		const { content } = focused;
		const isToggle = focused.isToggle();
		const isOpen = Storage.checkToggle(rootId, focused.id);

		if (isToggle && isOpen) {
			Storage.setToggle(rootId, focused.id, false);
		};
		
		range = Util.rangeFixOut(content.text, range);
		
		C.BlockSplit(rootId, focused.id, range, style, (message: any) => {
			this.focus(focused.id, 0, 0);
			focus.scroll();
			this.phraseCheck();

			if (isToggle && isOpen) {
				Storage.setToggle(rootId, message.blockId, true);
				$('#block-' + message.blockId).addClass('isToggled');
			};
		});
	};
	
	blockRemove (focused?: I.Block) {
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};
		
		commonStore.menuClose('blockAdd');
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

		focus.clear(true);
		C.BlockUnlink(rootId, blockIds, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			if (next && next.isFocusable()) {
				let length = next.getLength();
				this.focus(next.id, length, length);
			};
		});
	};
	
	onLastClick (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (root.isPageSet()) {
			return;
		};

		const children = blockStore.getChildren(rootId, rootId, (it: I.Block) => { return !it.isTitle(); });
		const last = children[children.length - 1];
		
		let create = false;
		let length = 0;
		
		if (!last) {
			create = true;
		} else {
			if (!last.isText()) {
				create = true;
			} else {
				length = last.getLength();
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
		const blocks = node.find('.blocks');
		const last = node.find('.blockLast');

		if (!blocks.length || !last.length) {
			return;
		};
		
		const wh = win.height();
		const height = blocks.outerHeight() + blocks.offset().top;

		last.css({ height: Math.max(Constant.size.lastBlock, wh - height) });
	};
	
	focus (id: string, from: number, to: number) {
		focus.set(id, { from: from, to: to });
		focus.apply();
		this.resize();
	};
	
};

export default EditorPage;