import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, dispatcher, focus } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

@observer
class MenuBlockAction extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	timeout: number = 0;
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return null;
		};
		
		const { content } = block;
		const { style, color, bgColor } = content;
		const sections = this.getSections();
		
		const Inner = (
			<div className="inner">A</div>
		);
		
		const Section = (item: any) => (
			<div className="section">
				{item.children.map((action: any, i: number) => {
					return <Item key={i} {...action} />;
				})}
			</div>
		);
		
		const Item = (item: any) => {
			let icon = [ item.icon ];
			let inner = null;
			
			if (item.icon == 'turn') {
				icon = [ DataUtil.styleIcon(style) ];
			};
			
			if (item.icon == 'color') {
				inner = Inner;
				if (color) {
					icon.push('textColor textColor-' + color);
				};
				if (bgColor) {
					icon.push('bgColor bgColor-' + bgColor);
				};
			};
			
			return (
				<div id={'item-' + item.id} className={[ 'item', (item.arrow ? 'withChildren' : '') ].join(' ')} onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
					{item.icon ? <Icon className={icon.join(' ')} inner={inner} /> : ''}
					<div className="name">{item.name}</div>
					{item.arrow ? <Icon className="arrow" /> : ''}
				</div>
			);
		};
		
		return (
			<div>
				{sections.map((section: any, i: number) => {
					return <Section key={i} {...section} />;
				})}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
		this.unbind();
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });
		
		if (!block) {
			return [];
		};
		
		const { content, type, align } = block;
		const { style } = content;
		
		let sections = [
			{ 
				children: [
					//{ id: 'move', icon: 'move', name: 'Move to' },
					//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
					{ id: 'remove', icon: 'remove', name: 'Delete' },
					{ id: 'turn', icon: 'turn', name: 'Turn into', arrow: true },
				] 
			},
			{ 
				children: [
					{ id: 'align', icon: 'align ' + DataUtil.alignIcon(align), name: 'Align', arrow: true },
					{ id: 'color', icon: 'color', name: 'Change color', arrow: true },
					//{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			}
		];
		
		// Restrictions
		if (type == I.BlockType.File) {
			let idx = sections[0].children.findIndex((it: any) => { return it.id == 'remove'; });
			sections[0].children.splice(++idx, 0, { id: 'download', icon: 'download', name: 'Download' });
			//sections[0].children.splice(++idx, 0, { id: 'rename', icon: 'rename', name: 'Rename' })
			//sections[0].children.splice(++idx, 0, { id: 'replace', icon: 'replace', name: 'Replace' })
		};
		
		if (type != I.BlockType.Text) {
			sections[0].children = sections[0].children.filter((it: any) => { return [ 'turn' ].indexOf(it.id) < 0; });
		};
		
		if (type == I.BlockType.Icon) {
			sections = sections.filter((it: any, i: number) => { return i > 0; });
		};
		
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		Util.menuSetActive(this.props.id, items[this.n], 12, scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const { param } = this.props;
		const { data } = param;
		const k = e.which;
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.right:
				if (item) {
					this.onOver(e, item);
				};
				break;
				
			case Key.enter:
			case Key.space:
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
				
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	onMouseEnter (e: any, item: any) {
		if (keyboard.mouse) {
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { param } = this.props;
		const { data } = param;
		const { onSelect, blockId, blockIds, rootId, dataset } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		
		if (!block) {
			return;
		};
		
		const { content } = block;
		const { text, color, bgColor } = content;
		
		const length = String(text || '').length;
		const items = this.getItems();
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);
		const offsetX = node.outerWidth() + 1;
		const offsetY = node.offset().top - el.offset().top - 40;
		
		this.n = items.findIndex((it: any) => { return it.id == item.id; });
		this.setActive(item, false);
		
		if ((item.id == 'turn') && commonStore.menuIsOpen('blockStyle')) {
			return;
		};
		
		if ((item.id == 'color') && commonStore.menuIsOpen('blockColor')) {
			return;
		};
		
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockColor');
		commonStore.menuClose('blockAlign');
		
		if (!item.arrow) {
			return;
		};
		
		let menuParam: I.MenuParam = {
			element: '#item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				blockId: blockId,
				blockIds: blockIds,
				rootId: rootId,
				rebind: this.rebind,
				dataset: dataset,
			},
		};
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			switch (item.id) {
				case 'turn':
					menuParam.data.onSelect = (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListSetTextStyle(rootId, blockIds, item.id, (message: any) => {
								focus.set(message.blockId, { from: length, to: length });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Page) {
							const param: any = {
								type: item.type,
								fields: {
									name: String(text || Constant.default.name),
								},
								content: {
									style: I.PageStyle.Empty,
								}
							};
							
							C.BlockCreatePage(param, rootId, blockId, I.BlockPosition.Replace);
						};
						
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockStyle', menuParam);
					break;
					
				case 'color':
					menuParam.data.valueText = color;
					menuParam.data.valueBg = bgColor;
				
					menuParam.data.onChangeText = (color: string) => {
						C.BlockListSetTextColor(rootId, blockIds, color, (message: any) => {
							focus.set(message.blockId, { from: length, to: length });
							focus.apply();
						});
						commonStore.menuClose(this.props.id);
					};
					menuParam.data.onChangeBg = (color: string) => {
						C.BlockListSetBackgroundColor(rootId, blockIds, color, (message: any) => {
							focus.set(message.blockId, { from: length, to: length });
							focus.apply();
						});
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockColor', menuParam);
					break;
					
				case 'align':
					menuParam.data.onChange = (align: I.BlockAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align);
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockAlign', menuParam);
					break;
			};
		}, Constant.delay.menu);
	};
	
	onClick (e: any, item: any) {
		if (!this._isMounted || item.arrow) {
			return;
		};
		
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { blocks, root } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		
		if (!block) {
			return;
		};
		
		const { content } = block;
		
		commonStore.menuClose(this.props.id);
		
		switch (item.id) {
			case 'download':
				ipcRenderer.send('download', commonStore.fileUrl(content.hash));
				break;
					
			case 'move':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'move', 
						rootId: root,
						onConfirm: (id: string) => {
							console.log('Move', id);
						},
					}, 
				});
				break;
				
			case 'copy':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'copy', 
						rootId: root,
						onConfirm: (id: string) => {
							const lastId = blockIds[blockIds.length - 1];
							const last = blocks[rootId].find((it: I.Block) => { return it.id == lastId; });
							
							C.BlockListDuplicate(rootId, blockIds, blockIds[blockIds.length - 1], I.BlockPosition.Bottom, (message: any) => {
								if (last) {
									const length = String(last.content.text || '').length;
									focus.set(last.id, { from: length, to: length });
									focus.apply();									
								};
							});
						}
					}, 
				});
				break;
				
			case 'remove':
				let next = blockStore.getNextBlock(rootId, blockId, -1, (it: any) => {
					return it.type == I.BlockType.Text;
				});
				
				C.BlockUnlink(rootId, [ blockId ], (message: any) => {
					if (next) {
						let l = String(next.content.text || '').length;
						focus.set(next.id, { from: l, to: l });
						focus.apply();				
					};
				});
				break;
		};
	};

};

export default MenuBlockAction;