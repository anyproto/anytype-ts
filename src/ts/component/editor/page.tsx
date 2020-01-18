import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block, Icon } from 'ts/component';
import { I, C, Key, Util, Mark, dispatcher, focus, keyboard } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { throttle } from 'lodash';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	blockStore?: any;
	dataset?: any;
	rootId: string;
	container: string;
	addOffsetY: number;
};

const com = require('proto/commands.js');
const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');
const THROTTLE = 20;

@inject('commonStore')
@inject('blockStore')
@observer
class EditorPage extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeoutHover: number = 0;
	hovered: string =  '';
	hoverPosition: number = 0;
	scrollTop: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onKeyDownBlock = this.onKeyDownBlock.bind(this);
		this.onKeyUpBlock = this.onKeyUpBlock.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMenuAdd = this.onMenuAdd.bind(this);
		this.onPaste = this.onPaste.bind(this);
	};

	render () {
		const { blockStore, rootId } = this.props;
		const { blocks } = blockStore;
		const tree = blockStore.prepareTree(rootId, blocks[rootId] || []);
		
		return (
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
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		const { blockStore, rootId } = this.props;
		const win = $(window);
		
		keyboard.disableBack(true);
		this.unbind();
		win.on('mousemove.editor', throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
		win.on('scroll.editor', throttle((e: any) => { this.onScroll(e); }, THROTTLE));
		win.on('keydown.editor', (e: any) => { this.onKeyDownEditor(e); });
		win.on('paste.editor', (e: any) => {
			if (keyboard.focus) {
				return;
			}; 
			this.onPaste(e); 
		});
		
		C.BlockOpen(rootId, (message: any) => {
			const { blockStore, rootId } = this.props;
			const { blocks } = blockStore;
			const { focused, range } = focus;
			
			const focusedBlock = (blocks[rootId] || []).find((it: I.Block) => { return it.id == focused; });
			const title = (blocks[rootId] || []).find((it: I.Block) => { return (it.type == I.BlockType.Text) && (it.content.style == I.TextStyle.Title); });
			
			if (!focusedBlock && title) {
				let text = String(title.content.text || '');
				if (text == Constant.defaultName) {
					text = '';
				};
				let length = text.length;
				
				focus.set(title.id, { from: length, to: length });
			};
			
			window.setTimeout(() => { focus.apply(); }, 1);
		});
	};
	
	componentDidUpdate () {
		window.setTimeout(() => {
			focus.apply(); 
			window.scrollTo(0, this.scrollTop); 
		}, 1);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		
		const { blockStore, rootId } = this.props;
		
		keyboard.disableBack(false);
		this.unbind();
		focus.clear();
		
		blockStore.blocksClear(rootId);
		C.BlockClose(rootId);
	};
	
	unbind () {
		$(window).unbind('keydown.editor mousemove.editor scroll.editor paste.editor');
	};
	
	onMouseMove (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { container, addOffsetY } = this.props;
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const blocks = node.find('.block');
		const containerEl = $(container);
		const rectContainer = (containerEl.get(0) as Element).getBoundingClientRect() as DOMRect;
		const st = win.scrollTop();
		const add = node.find('#button-add');
		const { pageX, pageY } = e;
		const offset = 100;
		
		let hovered: any = null;
		let rect = { x: 0, y: 0, width: 0, height: 0 };
		
		// Find hovered block by mouse coords
		blocks.each((i: number, item: any) => {
			item = $(item);
			
			let rect = $(item).get(0).getBoundingClientRect() as DOMRect;
			let { x, y, width, height } = rect;
			y += st;

			if ((pageX >= x) && (pageX <= x + width) && (pageY >= y) && (pageY <= y + height)) {
				hovered = item;
			};
		});
		
		if (hovered) {
			rect = (hovered.get(0) as Element).getBoundingClientRect() as DOMRect;
			this.hovered = hovered.data('id');
		};
		
		let { x, y, width, height } = rect;
		y += st;
		
		window.clearTimeout(this.timeoutHover);
		
		if (hovered && (pageX >= x) && (pageX <= x + Constant.size.blockMenu) && (pageY >= offset) && (pageY <= st + rectContainer.height - offset)) {
			this.hoverPosition = pageY < (y + height / 2) ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			
			add.css({ opacity: 1, left: rect.x - rectContainer.x + 2, top: pageY - 10 + containerEl.scrollTop() + Number(addOffsetY) });
			blocks.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (hovered && (pageX <= x + 20)) {
				hovered.addClass('isAdding ' + (this.hoverPosition == I.BlockPosition.Top ? 'top' : 'bottom'));
			};
		} else {
			this.timeoutHover = window.setTimeout(() => {
				add.css({ opacity: 0 });
				blocks.removeClass('showMenu isAdding top bottom');
			}, 10);
		};
	};
	
	onKeyDownEditor (e: any) {
		const { dataset, commonStore, blockStore, rootId } = this.props;
		const { root, blocks } = blockStore;
		const { selection } = dataset;
		const { focused } = focus;
		const k = e.which;
		
		if (keyboard.focus) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const ids = selection.get();
		
		if (e.ctrlKey || e.metaKey) {
			if (k == Key.a) {
				e.preventDefault();
				this.selectAll();
			};
			
			if (k == Key.c) {
				e.preventDefault();
				this.onCopy(e);
			};
			
			if (k == Key.d) {
				e.preventDefault();
				
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'copy', 
						rootId: root,
						onConfirm: (id: string) => {
							const lastId = ids[ids.length - 1];
							const last = blocks[rootId].find((it: I.Block) => { return it.id == lastId; });
							
							C.BlockListDuplicate(rootId, ids, ids[ids.length - 1], I.BlockPosition.Bottom, (message: any) => {
								if (last) {
									const length = String(last.content.text || '').length;
									focus.set(last.id, { from: length, to: length });
									focus.apply();
								};
							});
						}
					}, 
				});
			};
		};
		
		if (k == Key.backspace) {
			e.preventDefault();
			this.blockRemove();
		};
	};
	
	onKeyDownBlock (e: any, text?: string, marks?: I.Mark[]) {
		const { blockStore, commonStore, dataset, rootId } = this.props;
		const { focused, range } = focus;
		const { blocks } = blockStore;
		const { selection } = dataset;
		
		const block = blocks[rootId].find((item: I.Block) => { return item.id == focused; });
		if (!block) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const index = blocks[rootId].findIndex((item: I.Block) => { return item.id == focused; });
		const { content } = block;

		let l = String(text || '').length;
		let k = e.which;
		
		if (e.ctrlKey || e.metaKey) {
			if ((k == Key.a) && (range.from == 0) && (range.to == l)) {
				e.preventDefault();
				this.selectAll();
			};
			
			if (k == Key.c) {
				this.onCopy(e);
			};
			
			// Open action menu
			if (k == Key.slash) {
				const el = node.find('#' + $.escapeSelector(focused));
				
				let ids = [];
				if (selection) {
					selection.setPreventClear(false);
					ids = selection.get();
					if (ids.length <= 1) {
						ids = [ focused ];
					};
					selection.set(ids);
					selection.setPreventClear(true);
				};
				
				commonStore.menuOpen('blockAction', { 
					element: 'block-' + focused,
					type: I.MenuType.Vertical,
					offsetX: 50,
					offsetY: -el.outerHeight(),
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Left,
					data: {
						blockId: focused,
						blockIds: ids,
						rootId: rootId,
					},
					onClose: () => {
						selection.setPreventClear(false);
					}
				});
			};
		};
		
		if (focused && 
			((range.from == 0) && (k == Key.up)) ||
			((range.to == l) && (k == Key.down))
		) {
			if (commonStore.menuIsOpen()) {
				return;
			};
			
			e.preventDefault();
			
			const dir = (k == Key.up) ? -1 : 1;
			
			if (e.ctrlKey || e.metaKey) {
				const root = blocks[rootId].find((item: I.Block) => { return item.id == rootId; });
				let next;
				
				if (dir < 0) {
					next = blockStore.getNextBlock(rootId, root.childrenIds[0], -dir, (item: any) => {
						return item.type == I.BlockType.Text;
					});
				} else {
					next = blockStore.getFirstBlock(rootId, root.childrenIds[root.childrenIds.length - 1], -dir, (item: any) => {
						return item.type == I.BlockType.Text;
					});
				};
				
				if (next) {
					const l = String(next.content.text || '').length;
					const newRange = (dir < 0 ? { from: 0, to: 0 } : { from: l, to: l });
					
					focus.set(next.id, newRange);
					focus.apply();
				};
			} else
			if (e.shiftKey) {
				if (selection.get().length < 1) {
					window.getSelection().empty();
					commonStore.menuClose('blockContext');
					selection.set([ focused ]);
					commonStore.menuClose('blockAction');
				};
			} else {
				const next = blockStore.getNextBlock(rootId, focused, dir, (item: any) => {
					return item.type == I.BlockType.Text;
				});
				
				if (next) {
					const l = String(next.content.text || '').length;
					const newRange = (dir > 0 ? { from: 0, to: 0 } : { from: l, to: l });
					
					focus.set(next.id, newRange);
					focus.apply();					
				};
			};
		};
		
		if ((k == Key.backspace) && (range.from == 0 && range.to == 0)) {
			const ids = selection.get();
			if (l && !ids.length) {
				this.blockMerge(block);
			} else {
				this.blockRemove(block);
			};
		};
		
		if ((e.ctrlKey || e.metaKey) && range.to && (range.from != range.to)) {
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
					commonStore.popupOpen('prompt', {
						data: {
							placeHolder: 'Please enter URL',
							value: (mark ? mark.param : ''),
							onChange: (param: string) => {
								marks = Mark.toggle(marks, { type: type, param: param, range: range });
								C.BlockSetTextText(rootId, block.id, String(text || ''), marks);
							}
						}
					});
				} else {
					marks = Mark.toggle(marks, { type: type, range: range });
					C.BlockSetTextText(rootId, block.id, String(text || ''), marks);
				};
			};
		};
		
		if (k == Key.enter) {
			if (e.shiftKey || commonStore.menuIsOpen()) {
				return;
			};
			
			e.preventDefault();
			
			if ((range.from == l) && (range.to == l)) {
				let param: any = {
					type: I.BlockType.Text,
					content: {
						style: I.TextStyle.Paragraph,
					},
				};
				
				if ([ I.TextStyle.Checkbox, I.TextStyle.Bulleted, I.TextStyle.Numbered ].indexOf(block.content.style) >= 0) {
					param.content.style = block.content.style;
				};
				
				this.blockCreate(block, I.BlockPosition.Bottom, param);
			} else {
				this.blockSplit(block, range.from);
			};
		};
	};
	
	onKeyUpBlock (e: any, text?: string, marks?: I.Mark[]) {
		const { commonStore } = this.props;
		commonStore.filterSet(text);
	};
	
	selectAll () {
		const { blockStore, commonStore, dataset, rootId } = this.props;
		const { blocks } = blockStore;
		const { selection } = dataset;
		
		selection.set(blocks[rootId].map((item: I.Block) => { return item.id; }));
		window.getSelection().empty();
		keyboard.setFocus(false);
		focus.clear();
		commonStore.menuClose('blockContext');
	};
	
	onAdd (e: any) {
		if (!this.hovered) {
			return;
		};
		
		const { blockStore, commonStore, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == this.hovered; });
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!block) {
			return;
		};
		
		this.blockCreate(block, this.hoverPosition, {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
		}, (blockId: string) => {
			this.onMenuAdd(blockId);
		});
	};
	
	onMenuAdd (id: string) {
		const { blockStore, commonStore, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		
		commonStore.menuOpen('blockAdd', { 
			element: 'block-' + id,
			type: I.MenuType.Vertical,
			offsetX: 50,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onClose: () => {
			focus.apply();
				commonStore.filterSet('');
			},
			data: {
				onSelect: (e: any, item: any) => {
					let param: any = {
						type: item.type,
					};
						
					if (item.type == I.BlockType.Text) {
						param.content = {
							style: item.id,
						};
					};
					
					if (item.type == I.BlockType.File) {
						param.content = {
							type: item.id,
						};
					};
					
					this.blockReplace(block, param);
				}
			}
		});
	};
	
	onScroll (e: any) {
		this.scrollTop = $(window).scrollTop();
	};
	
	onCopy (e: any) {
		const { blockStore, dataset, rootId } = this.props;
		const { blocks } = blockStore;
		const { selection } = dataset;
		const ids = selection.get();

		if (!ids.length) {
			return;
		};
		
		let text: string[] = [];
		let list: any[] = ids.map((id: string) => {
			const block = blocks[rootId].find((el: I.Block) => { return el.id == id; });
			
			if (block.type == I.BlockType.Text) {
				text.push(String(block.content.text || ''));
			};
			return blockStore.prepareBlockToProto(block);
		});

		Util.clipboardCopy({
			text: text.join('\n'),
			html: null, 
			anytype: list 
		});		
	};
	
	onPaste (e: any) {
		e.preventDefault();
		
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const { dataset, rootId } = this.props;
		const { selection } = dataset;
		const { focused, range } = focus;

		const data: any = {
			text: cb.getData('text/plain'),
			html: cb.getData('text/html'),
			anytype: JSON.parse(cb.getData('application/anytype') || '[]'),
		};
		
		C.BlockPaste(rootId, focused, range, selection.get(), data, (message: any) => {});
	};
	
	blockCreate (focused: I.Block, position: I.BlockPosition, param: any, callBack?: (blockId: string) => void) {
		const { blockStore, rootId } = this.props;
		
		C.BlockCreate(param, rootId, focused.id, position, (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
			
			if (callBack) {
				callBack(message.blockId);
			};
		});
	};
	
	blockReplace (focused: I.Block, param: any, callBack?: (blockId: string) => void) {
		const { blockStore, rootId } = this.props;
		
		C.BlockReplace(param, rootId, focused.id, (message: any) => {
			focus.set(focused.id, { from: 0, to: 0 });
			focus.apply();
			
			if (callBack) {
				callBack(focused.id);
			};
		});
	};
	
	blockMerge (focused: I.Block) {
		const { blockStore, rootId } = this.props;
		const next = blockStore.getNextBlock(rootId, focused.id, -1, (item: any) => {
			return item.type == I.BlockType.Text;
		});
		
		if (!next) {
			return;
		};
		
		C.BlockMerge(rootId, next.id, focused.id, (message: any) => {
			if (next) {
				let l = String(next.content.text || '').length;
				focus.set(next.id, { from: l, to: l });
				focus.apply();				
			};
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
		const { blockStore, rootId, dataset } = this.props;
		const { selection } = dataset;

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
		
		C.BlockUnlink(rootId, blockIds, (message: any) => {
			if (next) {
				let l = String(next.content.text || '').length;
				focus.set(next.id, { from: l, to: l });
				focus.apply();				
			};
		});
	};
	
};

export default EditorPage;