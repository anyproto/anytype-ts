import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Key, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

const $ = require('jquery');

@inject('commonStore')
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
		const options = this.getItems();
		
		const Item = (item: any) => (
			<div id={'block-add-item-' + item.id} className={[ 'item', item.color, (item.color ? 'withColor' : '') ].join(' ')} onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
				{item.icon ? <Icon className={item.icon} /> : ''}
				<div className="name">{item.name}</div>
				{item.children.length ? <Icon className="arrow" /> : ''}
			</div>
		);
		
		return (
			<div className="items">
				{!options.length ? <div className="empty">No items match filter</div> : ''}
				{options.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		const { commonStore } = this.props;
		
		commonStore.filterSet('');
		this.rebind();
	};
	
	componentDidUpdate () {
		const { commonStore } = this.props;
		const { filter } = commonStore; 
		const node = $(ReactDOM.findDOMNode(this));
		
		if (filter) {
			$('#menuBlockAdd').addClass('withFilter');
			commonStore.menuClose('blockAddSub');
		} else {
			$('#menuBlockAdd').removeClass('withFilter');
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
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		
		const { commonStore, param } = this.props;
		const { data } = param;
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		window.clearTimeout(this.t);
		
		const setActive = () => {
			const item = items[this.n];
			
			node.find('.item.active').removeClass('active');
			node.find('#block-add-item-' + item.id).addClass('active');
			
			this.t = window.setTimeout(() => {
				if (item) {
					this.onOver(e, item);
				};
			}, 500);
		};
		
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
				if ((this.props.id == 'blockAddSub') && (this.n == -1)) {
					this.n++;
					if (this.n > l - 1) {
						this.n = 0;
					};
					setActive();
				} else 
				if (item) {
					this.onOver(e, item);
				};
				break;
				
			case Key.enter:
			case Key.space:
				e.preventDefault();
				
				if (item) {
					item.children.length ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
			
			case Key.left:	
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	getSections () {
		return [
			{ 
				id: 'text', icon: 'text', name: 'Text', color: 'yellow', children: [
					{ type: I.BlockType.Text, id: I.TextStyle.Paragraph, icon: 'text', name: 'Text' },
					{ type: I.BlockType.Text, id: I.TextStyle.Header1, icon: 'header1', name: 'Header 1' },
					{ type: I.BlockType.Text, id: I.TextStyle.Header2, icon: 'header2', name: 'Header 2' },
					{ type: I.BlockType.Text, id: I.TextStyle.Header3, icon: 'header3', name: 'Header 3' },
					{ type: I.BlockType.Text, id: I.TextStyle.Quote, icon: 'quote', name: 'Highlighted' },
				] as any [],
			},
			{ 
				id: 'list', icon: 'list', name: 'List', color: 'green', children: [
					{ type: I.BlockType.Text, id: I.TextStyle.Checkbox, icon: 'checkbox', name: 'Checkbox' },
					{ type: I.BlockType.Text, id: I.TextStyle.Bulleted, icon: 'list', name: 'Bulleted' },
					{ type: I.BlockType.Text, id: I.TextStyle.Numbered, icon: 'numbered', name: 'Numbered' },
					{ type: I.BlockType.Text, id: I.TextStyle.Toggle, icon: 'toggle', name: 'Toggle' },
				] as any [],
			},
			{ 
				id: 'page', icon: 'page', name: 'Page', color: 'blue', children: [
					{ type: I.BlockType.Page, id: 'page', icon: 'page', name: 'Page' },
					{ id: 'existing', icon: 'existing', name: 'Existing Page' },
					/*
					{ id: 'task', icon: 'task', name: 'Task' },
					{ id: 'dataview', icon: 'page', name: 'Database' },
					{ id: 'set', icon: 'set', name: 'Set' },
					{ id: 'contact', icon: 'contact', name: 'Contact' },
					*/
				] as any [],
			},
			{ 
				id: 'file', icon: 'file', name: 'Object', color: 'red', children: [
					{ type: I.BlockType.File, id: I.FileType.File, icon: 'file', name: 'File' },
					{ type: I.BlockType.File, id: I.FileType.Image, icon: 'picture', name: 'Picture' },
					{ type: I.BlockType.File, id: I.FileType.Video, icon: 'video', name: 'Video' },
					{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', name: 'Bookmark' },
					{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', name: 'Code' },	
				] as any [],
			},
			{ 
				id: 'other', icon: 'line', name: 'Other', color: 'purple', children: [
					{ type: I.BlockType.Div, id: I.DivStyle.Line, icon: 'line', name: 'Line divider' },
					{ type: I.BlockType.Div, id: I.DivStyle.Dot, icon: 'dot', name: 'Dots divider' },
				] as any [],
			},
		];
	};
	
	getItems () {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { id } = data;
		const sections = this.getSections();
		
		let { filter } = commonStore;
		let options = sections;
		
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
			let list: any[] = [];
			for (let item of options) {
				list = list.concat(item.children);
			};
			
			list = list.filter((it: any) => { return it.name.match(filter); });
			list = list.map((it: any) => { 
				it.color = '';
				it.children = [];
				return it; 
			});
			options = list;
		};
		
		return options;
	};
	
	onOver (e: any, item: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		if (!item.children.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#block-add-item-' + item.id);
		const offsetX = node.outerWidth();
			
		$('.menuBlockAdd .item.active').removeClass('active');
		el.addClass('active');
			
		commonStore.menuOpen('blockAddSub', { 
			element: 'block-add-item-' + item.id,
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
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		if (item.children.length) {
			return;
		};
		
		commonStore.menuClose('blockAdd');
		commonStore.menuClose('blockAddSub');
		onSelect(e, item);
	};
	
};

export default MenuBlockAdd;