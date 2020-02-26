import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, dispatcher, focus } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};
interface State {
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

@observer
class MenuBlockAction extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	focus: boolean = false;
	timeout: number = 0;
	n: number = 0;
	state = {
		filter: '',
	};
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
		
		this.onFilterFocus = this.onFilterFocus.bind(this);
		this.onFilterBlur = this.onFilterBlur.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == blockId; });

		if (!block) {
			return null;
		};
		
		const { content, bgColor } = block;
		const { style, color } = content;
		const sections = this.getSections();
		
		const Item = (item: any) => (
			<div id={'item-' + item.id} className={[ 'item', item.color, (item.color ? 'withColor' : ''), (item.arrow ? 'withChildren' : '') ].join(' ')} onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
				{item.icon ? <Icon className={item.icon} inner={item.inner} /> : ''}
				<div className="name">{item.name}</div>
				{item.arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
		
		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icn: string[] = [ 'inner' ];
						
						if (action.id == 'turn') {
							action.icon = DataUtil.styleIcon(style);
						};
						
						if (action.id == 'color') {
							if (color) {
								icn.push('textColor textColor-' + color);
							};
							if (bgColor) {
								icn.push('bgColor bgColor-' + bgColor);
							};
						};
						
						if (action.isTextColor) {
							icn.push('textColor textColor-' + action.value);
						};
						if (action.isBgColor) {
							icn.push('bgColor bgColor-' + action.value);
						};
						
						if (action.isTextColor || action.isBgColor) {
							action.icon = 'color';
							action.inner = (
								<div className={icn.join(' ')}>A</div>
							);
						};
						
						return <Item key={i} {...action} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				<div className="filter">
					<Input placeHolder="Type to filter..." onFocus={this.onFilterFocus} onBlur={this.onFilterBlur} onChange={this.onFilterChange} />
				</div>
				
				{!sections.length ? <div className="item empty">No items match filter</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
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
	
	onFilterFocus (e: any) {
		this.focus = true;
	};
	
	onFilterBlur (e: any) {
		this.focus = false;
	};
	
	onFilterChange (e: any, v: string) {
		this.setState({ filter: String(v || '').replace(/[\/\\\*]/g, '') });
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
		const { filter } = this.state;
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

		let ca: string[] = [ 'align', DataUtil.alignIcon(align) ];		
				
		let sections: any[] = [
			{ 
				children: [
					//{ id: 'move', icon: 'move', name: 'Move to' },
					{ id: 'copy', icon: 'copy', name: 'Duplicate' },
					{ id: 'remove', icon: 'remove', name: 'Delete' },
					{ id: 'turn', icon: 'turn', name: 'Turn into', arrow: true },
				] 
			},
			{ 
				children: [
					{ id: 'align', icon: ca.join(' '), name: 'Align', arrow: true },
					{ id: 'color', icon: 'color', name: 'Change color', arrow: true, isTextColor: true },
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
		
		if (filter) {
			const reg = new RegExp(filter, 'gi');
			
			sections = [];
			
			if (type == I.BlockType.Text) {
				sections = sections.concat([
					{ id: 'turnText', icon: '', name: 'Text', color: '', children: DataUtil.menuGetBlockText() },
					{ id: 'turnList', icon: '', name: 'List', color: '', children: DataUtil.menuGetBlockList() },
					{ id: 'turnObject', icon: '', name: 'Object', color: '', children: DataUtil.menuGetTurnObject() },
				]);
			};
			
			sections = sections.concat([
				{ id: 'turnPage', icon: '', name: 'Page', color: '', children: DataUtil.menuGetBlockPage() },
				{ id: 'action', icon: '', name: 'Actions', color: '', children: DataUtil.menuGetActions(block) },
				{ id: 'align', icon: '', name: 'Align', color: '', children: DataUtil.menuGetAlign() },
				{ id: 'bgColor', icon: '', name: 'Background color', color: '', children: DataUtil.menuGetBgColors() },
			]);
			
			if ((type == I.BlockType.Text) && (content.style != I.TextStyle.Code)) {
				sections.push({ id: 'color', icon: 'color', name: 'Text color', color: '', arrow: true, children: DataUtil.menuGetTextColors() });
			};
			
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter((c: any) => { return c.name.match(reg); });
				return s.children.length > 0;
			});
		};
		
		return sections;
	};
	
	getItems () {
		const { filter } = this.state;
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
		if (!this._isMounted || this.focus) {
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
		const offsetY = -el.outerHeight() - 8;
		
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
					menuParam.offsetY = node.offset().top - el.offset().top - 40;
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
				if (content.hash) {
					ipcRenderer.send('download', commonStore.fileUrl(content.hash));
				};
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
				C.BlockListDuplicate(rootId, blockIds, blockIds[blockIds.length - 1], I.BlockPosition.Bottom, (message: any) => {
					if (message.blockIds && message.blockIds.length) {
						const lastId = message.blockIds[message.blockIds.length - 1];
						const last = blocks[rootId].find((it: I.Block) => { return it.id == lastId; });
						
						if (last) {
							const length = String(last.content.text || '').length;
							focus.set(last.id, { from: length, to: length });
							focus.apply();
						};
					};
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
				
			default:
				// Text colors
				if (item.isTextColor) {
					C.BlockListSetTextColor(rootId, blockIds, item.value);
				} else 
					
				// Background colors
				if (item.isBgColor) {
					C.BlockListSetBackgroundColor(rootId, blockIds, item.value);
				} else 
					
				// Align
				if (item.isAlign) {
					C.BlockListSetAlign(rootId, blockIds, item.value);
				} else 
					
				// Blocks
				if (item.isBlock) {
					if (item.type == I.BlockType.Page) {
						commonStore.progressSet({ status: 'Creating page...', current: 0, total: 1 });
						
						let param: any = {
							type: item.type,
							fields: {
								name: Constant.default.name,
							},
							content: {
								style: I.PageStyle.Empty,
							},
						};
						
						C.BlockCreatePage(param, rootId, blockId, I.BlockPosition.Replace, (message: any) => {
							commonStore.progressSet({ status: 'Creating page...', current: 1, total: 1 });
						});
					} else {
						C.BlockListSetTextStyle(rootId, blockIds, item.id);
					};
				};
			
				break;
		};
	};

};

export default MenuBlockAction;