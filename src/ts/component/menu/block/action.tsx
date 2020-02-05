import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input } from 'ts/component';
import { I, C, Key, Util, dispatcher, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
	blockStore?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

@inject('commonStore')
@inject('blockStore')
@observer
class MenuBlockAction extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	timeout: number = 0;
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { commonStore, blockStore, param } = this.props;
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
				icon = [ Util.styleIcon(style) ];
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
				<div id={'block-action-item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
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
		const { blockStore, param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });
		
		if (!block) {
			return;
		};
		
		const { content, type } = block;
		const { style } = content;
		
		let sections = [
			{ 
				children: [
					{ id: 'turn', icon: 'turn', name: 'Turn into', arrow: true },
					{ id: 'color', icon: 'color', name: 'Change color', arrow: true },
					//{ id: 'move', icon: 'move', name: 'Move to' },
					//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
					{ id: 'remove', icon: 'remove', name: 'Delete' },
				] 
			},
			/*
			{ 
				children: [
					{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			}
			*/
		];
		
		// Restrictions
		if (type == I.BlockType.File) {
			sections[0].children.splice(3, 0, { id: 'rename', icon: 'rename', name: 'Rename' });
			sections[0].children.splice(3, 0, { id: 'replace', icon: 'replace', name: 'Replace' });
			sections[0].children.splice(3, 0, { id: 'download', icon: 'download', name: 'Download' });
		};
		
		if (style == I.TextStyle.Title) {
			sections[0].children = sections[0].children.filter((it: any) => { return [ 'turn', 'color', 'move', 'remove' ].indexOf(it.id) < 0; });
		};
		
		if (type != I.BlockType.Text) {
			sections[0].children = sections[0].children.filter((it: any) => { return [ 'turn', 'color' ].indexOf(it.id) < 0; });
		};
		
		if (style == I.TextStyle.Code) {
			sections[0].children = sections[0].children.filter((it: any) => { return [ 'color' ].indexOf(it.id) < 0; });
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
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.preventDefault();
		e.stopPropagation();
		
		const { commonStore, param } = this.props;
		const { data } = param;
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		const setActive = () => {
			const item = items[this.n];
			
			node.find('.item.active').removeClass('active');
			node.find('#block-action-item-' + item.id).addClass('active');
		};
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				setActive();
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive();
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
	
	onOver (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { blockStore, commonStore, param } = this.props;
		const { data } = param;
		const { onSelect, blockId, blockIds, rootId } = data;
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
		const el = node.find('#block-action-item-' + item.id);
		const offsetX = node.outerWidth();
		const offsetY = node.offset().top - el.offset().top;
		
		this.n = items.findIndex((it: any) => { return it.id == item.id; });
		
		node.find('.item.active').removeClass('active');
		el.addClass('active');
		
		if ((item.id == 'turn') && commonStore.menuIsOpen('blockStyle')) {
			return;
		};
		
		if ((item.id == 'color') && commonStore.menuIsOpen('blockColor')) {
			return;
		};
		
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockColor');
		
		if (!item.arrow) {
			return;
		};
		
		let menuParam: I.MenuParam = {
			element: 'block-action-item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY - 40,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				blockId: blockId,
				blockIds: blockIds,
				rootId: rootId,
				rebind: this.rebind,
			},
		};
		
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			switch (item.id) {
				case 'turn':
					menuParam.data.onSelect = (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListSetTextStyle(rootId, blockIds, item.style, (message: any) => {
								focus.set(message.blockId, { from: length, to: length });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Page) {
							const param: any = {
								type: item.type,
								fields: {
									icon: Util.randomSmile(), 
									name: Constant.defaultName,
								},
								content: {
									style: I.PageStyle.Empty,
								}
							};
							
							C.BlockCreatePage(param, rootId, blockId, I.BlockPosition.Bottom, (message: any) => {
								C.BlockUnlink(rootId, [ blockId ]);
							});
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
						C.BlockListSetTextBackgroundColor(rootId, blockIds, color, (message: any) => {
							focus.set(message.blockId, { from: length, to: length });
							focus.apply();
						});
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockColor', menuParam);
					break;
			};
		}, 250);
	};
	
	onClick (e: any, item: any) {
		if (!this._isMounted || item.arrow) {
			return;
		};
		
		const { commonStore, blockStore, param } = this.props;
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
				C.BlockUnlink(rootId, [ blockId ]);
				break;
		};
	};

};

export default MenuBlockAction;