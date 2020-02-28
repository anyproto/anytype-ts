import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { I, C, Key, Util, DataUtil, Mark, dispatcher, focus, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

import BlockCover from 'ts/component/block/cover';
import Controls from './controls';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
	addOffsetX: number;
};

const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');
const THROTTLE = 20;

@observer
class EditorPage extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	id: string = '';
	timeoutHover: number = 0;
	timeoutMove: number = 0;
	hoverId: string =  '';
	hoverPosition: number = 0;
	scrollTop: number = 0;
	uiHidden: boolean = false;
	uiBlockHide: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onKeyDownBlock = this.onKeyDownBlock.bind(this);
		this.onKeyUpBlock = this.onKeyUpBlock.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMenuAdd = this.onMenuAdd.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onLastClick = this.onLastClick.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { blocks } = blockStore;
		const root = (blocks[rootId] || []).find((it: any) => { return it.id == rootId });
		
		if (!root) {
			return null;
		};
		
		const tree = blockStore.prepareTree(rootId, blocks[rootId]);
		const withIcon = root && root.fields.icon;
		const withCover = true;
		
		let cn = [ 'editorWrapper' ];
		
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
				{withCover ? <Block {...this.props} id="" fields={{}} content={{}} childrenIds={[]} childBlocks={[]} type={I.BlockType.Cover} /> : ''}
				
				<div className="editor">
					<div className="blocks">
						<Icon id="button-add" className="buttonAdd" onClick={this.onAdd} />
					
						{tree.map((item: I.Block, i: number) => {
							return (
								<Block 
									key={item.id} 
									index={i}
									{...item} 
									{...this.props}
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
		const { blocks } = blockStore; 
		const win = $(window);
		
		keyboard.disableBack(true);
		this.unbind();
		this.open();
		
		win.on('mousemove.editor', throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('scroll.editor', throttle((e: any) => { this.onScroll(e); }, THROTTLE));
		win.on('keydown.editor', (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor', (e: any) => {
			if (keyboard.focus) {
				return;
			}; 
			this.onPaste(e); 
		});
		
		this.resize();
		win.on('resize.editor', (e: any) => { this.resize(); });
		
		ipcRenderer.removeAllListeners('copyDocument');
		ipcRenderer.on('copyDocument', (e: any) => {
			const json = JSON.stringify({ blocks: blocks[rootId] }, null, 5);

			Util.clipboardCopy({ text: json }, () => {
				alert('Document copied to clipboard');
			});
		});
	};
	
	componentDidUpdate () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));		
		const resizable = node.find('.resizable');
		
		this.open();
		
		if (this.uiHidden) {
			this.uiHide();
		};
		
		this.uiBlockHide = true;
		focus.apply(); 
		win.scrollTop(this.scrollTop);
		this.uiBlockHide = false;
		
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
		const { blocks, breadcrumbs } = blockStore;
		
		if (this.id == rootId) {
			return;
		};
		
		const tree = blockStore.prepareTree(breadcrumbs, blocks[breadcrumbs]);
		
		let bc: any[] = [];
		let lastTargetId = '';
		
		if (tree.length) {
			let last = tree[tree.length - 1];
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
			const { rootId } = this.props;
			const { blocks } = blockStore;
			const { focused, range } = focus;
			
			const focusedBlock = (blocks[rootId] || []).find((it: I.Block) => { return it.id == focused; });
			const title = (blocks[rootId] || []).find((it: I.Block) => { return (it.type == I.BlockType.Text) && (it.content.style == I.TextStyle.Title); });
			
			if (!focusedBlock && title) {
				let text = String(title.content.text || '');
				if (text == Constant.default.name) {
					text = '';
				};
				let length = text.length;
				
				focus.set(title.id, { from: length, to: length });
			};

			this.resize();
			window.setTimeout(() => { focus.apply(); }, 1);
		});
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
		if (this.uiBlockHide) {
			return;
		};
		
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
		
		const { addOffsetX, rootId } = this.props;
		const { blocks } = blockStore;
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.block');
		const container = $('.editor');
		
		if (!container.length) {
			return;
		};
		
		const root = (blocks[rootId] || []).find((it: any) => { return it.id == rootId });
		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const st = win.scrollTop();
		const add = node.find('#button-add');
		const { pageX, pageY } = e;
		const withIcon = root && root.fields.icon;
		const withCover = true;

		let offset = 130;
		let hovered: any = null;
		let hoveredRect = { x: 0, y: 0, width: 0, height: 0 };
		
		if (withCover && withIcon) {
			offset = 360;
		} else
		if (withCover) {
			offset = 360;
		} else 
		if (withIcon) {
			offset = 184;
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
			
			let ax = hoveredRect.x - (rectContainer.x + addOffsetX) + 2;
			let ay = pageY - rectContainer.y - 10 - st;
			
			add.css({ opacity: 1, transform: `translate3d(${ax}px,${ay}px,0px)` });
			items.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (pageX <= x + 20) {
				const block = blocks[rootId].find((it: any) => { return it.id == this.hoverId; });
				
				let canAdd = true;
				if (block) {
					if (block.type == I.BlockType.Icon) {
						canAdd = false;
					};
					if ((block.type == I.BlockType.Text) && (block.content.style == I.TextStyle.Title) && (this.hoverPosition == I.BlockPosition.Top)) {
						canAdd = false;
					};
				};
				
				if (canAdd) {
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
		const { root, blocks } = blockStore;
		const { selection } = dataset;
		const { focused } = focus;
		const k = e.which;
		
		if (keyboard.focus) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const ids = selection.get();
		const map = blockStore.getMap(blocks[rootId]);
		
		if (e.ctrlKey || e.metaKey) {
			if (k == Key.a) {
				e.preventDefault();
				this.selectAll();
			};
			
			if (k == Key.c) {
				e.preventDefault();
				this.onCopy(e);
			};
			
			if (k == Key.z) {
				e.preventDefault();
				e.shiftKey ? C.BlockRedo(rootId) : C.BlockUndo(rootId);
			};
			
			if (k == Key.y) {
				e.preventDefault();
				C.BlockRedo(rootId);
			};
			
			if (k == Key.d) {
				e.preventDefault();
				focus.clear(true);
				C.BlockListDuplicate(rootId, ids, ids[ids.length - 1], I.BlockPosition.Bottom, (message: any) => {});
			};
		};
		
		if (k == Key.backspace) {
			e.preventDefault();
			this.blockRemove();
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
				
				const block = map[ids[0]];
				const parent = map[block.parentId];
				const next = blockStore.getNextBlock(rootId, block.id, -1);
				const obj = e.shiftKey ? parent : next;
				
				let canTab = true;
				
				if (!obj) {
					canTab = false;
				} else 
				if ((obj.type == I.BlockType.Text) && (obj.content.style == I.TextStyle.Title)) {
					canTab = false;
				} else 
				if (obj.type == I.BlockType.Layout) {
					canTab = false;
				} else 
				if ((block.type == I.BlockType.Text) && (block.content.style == I.TextStyle.Title)) {
					canTab = false;
				};
				
				if (canTab) {
					C.BlockListMove(rootId, ids, obj.id, (e.shiftKey ? I.BlockPosition.Bottom : I.BlockPosition.Inner));
				};
			};
		};
	};
	
	onKeyDownBlock (e: any, text?: string, marks?: I.Mark[]) {
		const { dataset, rootId } = this.props;
		const { focused, range } = focus;
		const { blocks } = blockStore;
		const { selection } = dataset;
		const map = blockStore.getMap(blocks[rootId]);
		
		const block = map[focused];
		if (!block) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const root = map[rootId];
		const index = blocks[rootId].findIndex((item: I.Block) => { return item.id == focused; });
		const { type, content } = block;

		let length = String(text || '').length;
		let k = e.which;
		let isTitle = (type == I.BlockType.Text) && (content.style == I.TextStyle.Title);
		
		this.uiHide();
		
		if (e.ctrlKey || e.metaKey) {
			if ((k == Key.a) && (range.from == 0) && (range.to == length)) {
				e.preventDefault();
				this.selectAll();
			};
			
			if (k == Key.c) {
				this.onCopy(e);
			};
			
			if (k == Key.z) {
				e.preventDefault();
				//focus.clear(true);
				e.shiftKey ? C.BlockRedo(rootId) : C.BlockUndo(rootId);
			};
			
			if (k == Key.y) {
				e.preventDefault();
				focus.clear(true);
				C.BlockRedo(rootId);
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
			if (!isTitle && range.to && (range.from != range.to)) {
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
			let next;
			
			// Move block
			if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
				e.preventDefault();
				
				next = blockStore.getNextBlock(rootId, focused, dir, (item: any) => {
					let check = true;
					if ((item.type == I.BlockType.Icon) || ((item.type == I.BlockType.Text) && (item.content.style == I.TextStyle.Title))) {
						check = false;
					};
					return check;
				});
				if (next) {
					C.BlockListMove(rootId, [ focused ], next.id, (dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom));	
				};
				return;
			};
			
			if (
				((range.from == 0) && (k == Key.up)) ||
				((range.to == length) && (k == Key.down))
			) {
				e.preventDefault();
				
				if (e.ctrlKey || e.metaKey) {
					if (dir < 0) {
						next = blockStore.getNextBlock(rootId, root.childrenIds[0], -dir, (item: any) => {
							return item.type == I.BlockType.Text;
						});
					} else {
						next = blockStore.getFirstBlock(rootId, root.childrenIds[root.childrenIds.length - 1], -dir, (item: any) => {
							return item.type == I.BlockType.Text;
						});
					};
					
					const l = String(next.content.text || '').length;
					focus.set(next.id, (dir < 0 ? { from: 0, to: 0 } : { from: l, to: l }));
					focus.apply();
				} else
				if (e.shiftKey) {
					if (selection.get(true).length < 1) {
						window.getSelection().empty();
						selection.set([ focused ]);
						
						commonStore.menuClose('blockContext');
						commonStore.menuClose('blockAction');
					};
				} else {
					next = blockStore.getNextBlock(rootId, focused, dir, (item: any) => {
						return item.type == I.BlockType.Text;
					});
					
					if (next) {
						const l = String(next.content.text || '').length;
						focus.set(next.id, (dir > 0 ? { from: 0, to: 0 } : { from: l, to: l }));
						focus.apply();
					};
				};
			};
		};
		
		// Backspace
		if ((k == Key.backspace) && (range.from == 0 && range.to == 0)) {
			const ids = selection.get(true);
			if (length && !ids.length) {
				this.blockMerge(block);
			} else {
				this.blockRemove(block);
			};
		};
		
		// Indent block
		if (k == Key.tab) {
			e.preventDefault();
			
			const parent = blocks[rootId].find((it: any) => { return it.id == block.parentId; });
			const next = blockStore.getNextBlock(rootId, block.id, -1);
			const obj = e.shiftKey ? parent : next;
			
			let canTab = true;
			
			if (!obj) {
				canTab = false;
			} else 
			if ((obj.type == I.BlockType.Text) && (obj.content.style == I.TextStyle.Title)) {
				canTab = false;
			} else 
			if (obj.type == I.BlockType.Layout) {
				canTab = false;
			} else 
			if (isTitle) {
				canTab = false;
			};
			
			if (canTab) {
				C.BlockListMove(rootId, [ block.id ], obj.id, (e.shiftKey ? I.BlockPosition.Bottom : I.BlockPosition.Inner));
			};
		};
		
		// Enter
		if (k == Key.enter) {
			if (e.shiftKey || commonStore.menuIsOpen() || (content.style == I.TextStyle.Code)) {
				return;
			};
			
			e.preventDefault();
			
			if ((range.from == length) && (range.to == length)) {
				let param: any = {
					type: I.BlockType.Text,
					content: {
						style: I.TextStyle.Paragraph,
					},
				};
				let replace = false;
				
				// If block is non-empty list - create new list block of the same style, otherwise - replace empty list block with paragraph
				if ([ I.TextStyle.Checkbox, I.TextStyle.Bulleted, I.TextStyle.Numbered ].indexOf(block.content.style) >= 0) {
					if (!length) {
						replace = true;
					} else {
						param.content.style = block.content.style;
					};
				};
				
				this.blockCreate(block, replace ? I.BlockPosition.Replace : I.BlockPosition.Bottom, param);
			} else 
			if (content.style != I.TextStyle.Title) {
				this.blockSplit(block, range.from);
			};
		};
	};
	
	onKeyUpBlock (e: any, text?: string, marks?: I.Mark[]) {
	};
	
	selectAll () {
		const { dataset, rootId } = this.props;
		const { blocks } = blockStore;
		const { selection } = dataset;
		const map = blockStore.getMap(blocks[rootId]);
		
		// Filter layout blocks from selection
		// Filter anything except page and layouts from parents
		const ids = (blocks[rootId] || []).map((it: I.Block) => {
			let item = map[it.id];
			if (item.type == I.BlockType.Layout) {
				return '';
			};
			if (item.parentId) {
				let parent = map[item.parentId];
				if ([ I.BlockType.Layout, I.BlockType.Page ].indexOf(parent.type) < 0) {
					return '';
				};
			};
			return it.id;
		}).filter((it: string) => { return it != ''; });
		
		selection.set(ids);
		window.getSelection().empty();
		keyboard.setFocus(false);
		focus.clear(true);
		commonStore.menuClose('blockContext');
	};
	
	onAdd (e: any) {
		if (!this.hoverId || (this.hoverPosition == I.BlockPosition.None)) {
			return;
		};
		
		const { rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == this.hoverId; });
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!block) {
			return;
		};
		
		if ((block.type == I.BlockType.Text) && (block.content.style == I.TextStyle.Title) && (this.hoverPosition != I.BlockPosition.Bottom)) {
			return;
		};
		
		commonStore.filterSet('');
		
		this.blockCreate(block, this.hoverPosition, {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		}, (blockId: string) => {
			$('.placeHolder.c' + $.escapeSelector(blockId)).text(Constant.placeHolder.filter);
			this.onMenuAdd(blockId);
		});
	};
	
	onMenuAdd (id: string) {
		const { rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		
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
				const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });

				// Clear filter in block text on close
				if ('/' + filter == block.content.text) {
					DataUtil.blockSetText(rootId, block, '', []);
				};
				
				focus.apply();
				commonStore.filterSet('');
				$('.placeHolder.c' + $.escapeSelector(id)).text(Constant.placeHolder.default);
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
						switch (item.id) {
							
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
							param.content.style = item.id;
						};
						
						if (item.type == I.BlockType.File) {
							param.content.type = item.id;
						};
						
						if (item.type == I.BlockType.Div) {
							param.content.style = item.id;
						};
						
						if (item.type == I.BlockType.Page) {
							param.fields = {
								name: Constant.default.name,
							};
							param.content.style = I.PageStyle.Empty;
							
							this.blockCreatePage(block, I.BlockPosition.Replace, param);
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
	
	onCopy (e: any) {
		const { dataset, rootId } = this.props;
		const { blocks } = blockStore;
		const { selection } = dataset;
		const ids = selection.get(true);

		if (!ids.length) {
			return;
		};
		
		const root = (blocks[rootId] || []).find((it: any) => { return it.id == rootId; });
		
		let text: any = [];
		let list: any[] = [ root ];
		
		list = list.concat(ids.map((id: any) => {
			return blocks[rootId].find((el: I.Block) => { return el.id == id; });
		}));
		list = list.concat(this.getCopyLayoutBlockList(ids));
		list = blockStore.unwrapTree(blockStore.prepareTree(rootId, list));
		
		for (let block of list) {
			if (block.type  == I.BlockType.Text) {
				text.push(block.content.text);
			};
		};
		text = text.join('\n');
		
		Util.clipboardCopy({ text: text, html: null, anytype: list });
		C.BlockCopy(rootId, list, (message: any) => {
			console.log(message.html);
			Util.clipboardCopy({ text: text, html: message.html, anytype: list });
		});
	};
	
	// Recursevily get parent layout blocks
	getCopyLayoutBlockList (ids: string[]) {
		const { rootId } = this.props;
		const { blocks } = blockStore;
		
		if (!ids.length) {
			return [];
		};
		
		let list: any[] = [];
		for (let id of ids) {
			let block = blocks[rootId].find((el: I.Block) => { 
				return (el.childrenIds.indexOf(id) >= 0) && (el.type == I.BlockType.Layout); 
			});
			
			if (!block) {
				continue;
			};
			
			list.push(block);
			if (block.content.style == I.LayoutStyle.Column) {
				list = list.concat(this.getCopyLayoutBlockList([ block.id ]));
			};
		};
		
		list = Util.arrayValues(DataUtil.unique(list, 'id'));
		return list;
	};
	
	onPaste (e: any) {
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const { dataset, rootId } = this.props;
		const { blocks } = blockStore;
		const { selection } = dataset;
		const { focused, range } = focus;
		const data: any = {
			text: cb.getData('text/plain'),
			html: cb.getData('text/html'),
			anytype: JSON.parse(cb.getData('application/anytype') || '[]'),
		};
		
		let id = '';
		let from = 0;
		let to = 0;
		
		C.BlockPaste(rootId, focused, range, selection.get(true), data, (message: any) => {
			if (message.blockIds && message.blockIds.length) {
				const lastId = message.blockIds[message.blockIds.length - 1];
				const block = (blocks[rootId] || []).find((it: any) => { return it.id == lastId; });
				const length = String(block.content.text || '').length;
				
				id = block.id;
				from = length;
				to = length;
			} else {
				id = focused;
				from = range.to;
				to = range.to;
			};
			
			focus.set(id, { from: from, to: to });
			focus.apply();
		});
	};
	
	blockCreate (focused: I.Block, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;
		
		C.BlockCreate(param, rootId, (focused ? focused.id : ''), position, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
			
			if (callBack) {
				callBack(message.blockId);
			};
		});
	};
	
	blockCreatePage (focused: I.Block, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { rootId } = this.props;
		
		commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });
		C.BlockCreatePage(param, rootId, focused.id, position, (message: any) => {
			commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
			
			if (callBack) {
				callBack(message.blockId);
			};
		});
	};
	
	blockMerge (focused: I.Block) {
		const { rootId } = this.props;
		const next = blockStore.getNextBlock(rootId, focused.id, -1, (item: any) => {
			return item.type == I.BlockType.Text;
		});
		
		if (!next) {
			return;
		};
		
		let length = String(next.content.text || '').length;
		
		C.BlockMerge(rootId, next.id, focused.id, (message: any) => {
			focus.set(next.id, { from: length, to: length });
			focus.apply();				
		});
	};
	
	blockSplit (focused: I.Block, start: number) {
		const { rootId } = this.props;
		
		C.BlockSplit(rootId, focused.id, start, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		});
	};
	
	blockRemove (focused?: I.Block) {
		const { rootId, dataset } = this.props;
		const { blocks } = blockStore;
		const { selection } = dataset;
		
		commonStore.menuClose('blockAdd');
		commonStore.menuClose('blockAddSub');
		commonStore.menuClose('blockAction');
		commonStore.menuClose('blockContext');

		let next: any = null;
		let ids = selection.get();
		let blockIds = [];
		
		if (ids.length) {
			next = blockStore.getNextBlock(rootId, ids[0], -1, (item: any) => {
				return item.type == I.BlockType.Text;
			});
			blockIds = ids;
		} else 
		if (focused) {
			next = blockStore.getNextBlock(rootId, focused.id, -1, (item: any) => {
				return item.type == I.BlockType.Text;
			});
			blockIds = [ focused.id ];
		};
		
		blockIds = blockIds.filter((id: string) => {
			const block = (blocks[rootId] || []).find((it: any) => { return it.id == id; });
			return block ? this.canDelete(block) : false;
		});
		
		C.BlockUnlink(rootId, blockIds, (message: any) => {
			if (next) {
				let l = String(next.content.text || '').length;
				focus.set(next.id, { from: l, to: l });
				focus.apply();
			};
		});
	};
	
	canDelete (block: I.Block) {
		if (block.type == I.BlockType.Icon) {
			return false;
		};
			
		if ((block.type == I.BlockType.Text) && (block.content.style == I.TextStyle.Title)) {
			return false;
		};
		
		return true;
	};
	
	onLastClick (e: any) {
		const { rootId } = this.props;
		const { blocks } = blockStore;
		const tree = blockStore.prepareTree(rootId, blocks[rootId]);
		const last = tree[tree.length - 1];
		
		let create = false;
		let length = 0;
		
		if (!last) {
			create = true;
		} else {
			if (last.type != I.BlockType.Text) {
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
			focus.set(last.id, { from: length, to: length });
			focus.apply();
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
		const height = Math.max(100, win.height() - node.outerHeight());
		
		last.css({ height: height });
	};
	
};

export default EditorPage;