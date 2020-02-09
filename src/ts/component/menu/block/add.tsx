import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, keyboard, Key, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
	blockStore?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@inject('commonStore')
@inject('blockStore')
@observer
class MenuBlockAdd extends React.Component<Props, {}> {
	
	_isMounted = false;
	n: number = -1;
	t: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { commonStore } = this.props;
		const { filter } = commonStore; 
		const options = this.getItems();
		const sections = this.getSections();
		
		const Inner = (
			<div className="inner">A</div>
		);
		
		const Item = (item: any) => (
			<div id={'item-' + item.id} className={[ 'item', item.color, (item.color ? 'withColor' : ''), (item.arrow ? 'withChildren' : '') ].join(' ')} onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
				{item.icon ? <Icon className={item.icon} inner={item.inner} /> : ''}
				<div className="name">{item.name}</div>
				{item.arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icn: string[] = [ 'inner' ];
						
						if (action.isBlock) {
							action.color = item.color;
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
				{!options.length ? <div className="item empty">No items match filter</div> : ''}
				{filter ? (
					<React.Fragment>
						{sections.map((item: any, i: number) => (
							<Section key={i} {...item} />
						))}
					</React.Fragment>
				) : (
					<React.Fragment>
						{options.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		const { commonStore, id } = this.props;
		
		this.rebind();
		this.checkFilter();
		
		if (id == 'blockAddSub') {
			this.n = 0;
			this.setActive();
		};
	};
	
	componentDidUpdate () {
		this.checkFilter();
	};
	
	checkFilter () {
		const { commonStore } = this.props;
		const { filter } = commonStore;
		const obj = $('#menuBlockAdd');
		
		if (filter) {
			obj.addClass('withFilter');
			commonStore.menuClose('blockAddSub');
		} else {
			obj.removeClass('withFilter');
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		
		const { commonStore, param, id } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};
	
	rebind () {
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
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
		
		e.stopPropagation();
		keyboard.disableMouse(true);
		
		const { commonStore, param } = this.props;
		const { data } = param;
		const k = e.which;
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				if (this.n == -1) {
					commonStore.menuClose(this.props.id);
					break;
				};
			
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
				if ((this.props.id == 'blockAddSub') && (this.n == -1)) {
					this.n++;
					if (this.n > l - 1) {
						this.n = 0;
					};
					this.setActive();
				} else 
				if (item) {
					this.onOver(e, item);
				};
				break;
				
			case Key.enter:
			case Key.space:
				e.preventDefault();
				
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
			
			case Key.left:	
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	getSections () {
		const { commonStore } = this.props;
		const { filter } = commonStore;
		
		let sections: any[] = [
			{ 
				id: 'text', icon: 'text', name: 'Text', color: 'yellow', arrow: true, children: [
					{ type: I.BlockType.Text, id: I.TextStyle.Paragraph, icon: 'text', name: 'Text', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Header1, icon: 'header1', name: 'Header 1', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Header2, icon: 'header2', name: 'Header 2', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Header3, icon: 'header3', name: 'Header 3', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Quote, icon: 'quote', name: 'Highlighted', isBlock: true },
				] as any [],
			},
			{ 
				id: 'list', icon: 'list', name: 'List', color: 'green', arrow: true, children: [
					{ type: I.BlockType.Text, id: I.TextStyle.Checkbox, icon: 'checkbox', name: 'Checkbox', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Bulleted, icon: 'list', name: 'Bulleted', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Numbered, icon: 'numbered', name: 'Numbered', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Toggle, icon: 'toggle', name: 'Toggle', isBlock: true },
				] as any [],
			},
			{ 
				id: 'page', icon: 'page', name: 'Page', color: 'blue', arrow: true, children: [
					{ type: I.BlockType.Page, id: 'page', icon: 'page', name: 'Page', isBlock: true },
					{ id: 'existing', icon: 'existing', name: 'Existing Page', isBlock: true },
					/*
					{ id: 'task', icon: 'task', name: 'Task' },
					{ id: 'dataview', icon: 'page', name: 'Database' },
					{ id: 'set', icon: 'set', name: 'Set' },
					{ id: 'contact', icon: 'contact', name: 'Contact' },
					*/
				] as any [],
			},
			{ 
				id: 'file', icon: 'file', name: 'Object', color: 'red', arrow: true, children: [
					{ type: I.BlockType.File, id: I.FileType.File, icon: 'file', name: 'File', isBlock: true },
					{ type: I.BlockType.File, id: I.FileType.Image, icon: 'picture', name: 'Picture', isBlock: true },
					{ type: I.BlockType.File, id: I.FileType.Video, icon: 'video', name: 'Video', isBlock: true },
					{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', name: 'Bookmark', isBlock: true },
					{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', name: 'Code', isBlock: true },	
				] as any [],
			},
			{ 
				id: 'other', icon: 'line', name: 'Other', color: 'purple', arrow: true, children: [
					{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'line', name: 'Line divider', isBlock: true },
					{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', name: 'Dots divider', isBlock: true },
				] as any [],
			},
		];
		
		if (filter) {
			let reg = new RegExp(filter, 'gi');
			
			sections = sections.concat([
				{ id: 'action', icon: 'action', name: 'Actions', color: '', arrow: true, children: this.getActions() },
				{ id: 'align', icon: 'align', name: 'Align', color: '', arrow: true, children: this.getAlign() },
				{ id: 'color', icon: 'color', name: 'Text color', color: '', arrow: true, children: this.getTextColors() },
				{ id: 'bgColor', icon: 'bgColor', name: 'Background color', color: '', arrow: true, children: this.getBgColors() },
			]);
			
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter((c: any) => { return c.name.match(reg); });
				return s.children.length > 0;
			});
		};
		
		return sections;
	};
	
	getItems () {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { id } = data;
		const sections = this.getSections();
		const { filter } = commonStore;
		
		let options: any[] = sections;
		
		if (id) {
			const item = options.find((it: any) => { return it.id == id; });
			
			options = item.children;
			for (let i in options) {
				options[i] = Object.assign(options[i], {
					parentId: item.id,
					color: item.color,
					children: [],
				});
			};
		};
		
		if (filter) {
			let reg = new RegExp(filter, 'gi');
			let list: any[] = [];
			
			for (let item of options) {
				list = list.concat(item.children || []);
			};
			
			options = list.filter((it: any) => { return it.name.match(reg); });
		};
		
		return options;
	};
	
	getTextColors () {
		let items: any[] = [
			{ id: 'color-black', name: 'Black', value: 'black', isTextColor: true }
		];
		for (let i in Constant.textColor) {
			items.push({ id: 'color-' + i, name: Constant.textColor[i], value: i, isTextColor: true });
		};
		return items;
	};
	
	getBgColors () {
		let items: any[] = [];
		for (let i in Constant.textColor) {
			items.push({ id: 'bgColor-' + i, name: Constant.textColor[i] + ' highlight', value: i, isBgColor: true });
		};
		return items;
	};
	
	getAlign () {
		return [
			{ id: I.BlockAlign.Left, icon: 'align left', name: 'Left' },
			{ id: I.BlockAlign.Center, icon: 'align center', name: 'Center' },
			{ id: I.BlockAlign.Right, icon: 'align right', name: 'Right' },
		];
	};
	
	getActions () {
		const { blockStore, param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { blocks } = blockStore;
		const block = (blocks[rootId] || []).find((item: I.Block) => { return item.id == blockId; });
		
		if (!block) {
			return;
		};
		
		const { content, type } = block;
		const { style } = content;
		
		let items: any[] = [
			//{ id: 'move', icon: 'move', name: 'Move to' },
			//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
			{ id: 'remove', icon: 'remove', name: 'Delete' },
			//{ id: 'comment', icon: 'comment', name: 'Comment' }
		];
		
		// Restrictions
		if (type == I.BlockType.File) {
			let idx = items.findIndex((it: any) => { return it.id == 'remove'; });
			items.splice(++idx, 0, { id: 'download', icon: 'download', name: 'Download' });
			//items.splice(++idx, 0, { id: 'rename', icon: 'rename', name: 'Rename' })
			//items.splice(++idx, 0, { id: 'replace', icon: 'replace', name: 'Replace' })
		};
		
		if (type != I.BlockType.Text) {
			items = items.filter((it: any) => { return [ 'turn', 'color' ].indexOf(it.id) < 0; });
		};
		
		if (style == I.TextStyle.Code) {
			items = items.filter((it: any) => { return [ 'color' ].indexOf(it.id) < 0; });
		};
		
		items = items.map((it: any) => {
			it.isAction = true;
			return it;
		});
		
		return items;
	};
	
	onMouseEnter (e: any, item: any) {
		if (keyboard.mouse) {
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.setActive(item, false);
		
		if (!item.arrow || !commonStore.menuIsOpen('blockAdd')) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const offsetX = node.outerWidth() + 1;

		commonStore.menuOpen('blockAddSub', { 
			element: '#item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: -40,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				id: item.id,
				onSelect: onSelect,
				rebind: this.rebind,
			}
		});
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();
		
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		if (item.arrow) {
			return;
		};
		
		commonStore.menuClose('blockAdd');
		commonStore.menuClose('blockAddSub');
		onSelect(e, item);
	};
	
};

export default MenuBlockAdd;