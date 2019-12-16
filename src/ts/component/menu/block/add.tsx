import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

const $ = require('jquery');

@inject('commonStore')
@observer
class MenuBlockAdd extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onOver = this.onOver.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { commonStore, param } = this.props;
		const { filter } = commonStore; 
		const { data } = param;
		const { id } = data;
		
		let options = [
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
				id: 'tool', icon: 'tool', name: 'Tool', color: 'blue', children: [
					{ id: 'task', icon: 'task', name: 'Task' },
					{ id: 'page', icon: 'tool', name: 'Page' },
					{ id: 'dataview', icon: 'tool', name: 'Database' },
					{ id: 'set', icon: 'set', name: 'Set' },
					{ id: 'contact', icon: 'contact', name: 'Contact' },
					{ id: 'existing', icon: 'existing', name: 'Existing Tool' },
				] as any [],
			},
			{ 
				id: 'media', icon: 'media', name: 'Media', color: 'red', children: [
					{ type: I.BlockType.File, id: I.MediaStyle.File, icon: 'media', name: 'File' },
					{ type: I.BlockType.File, id: I.MediaStyle.Image, icon: 'picture', name: 'Picture' },
					{ type: I.BlockType.File, id: I.MediaStyle.Video, icon: 'video', name: 'Video' },
					{ type: I.BlockType.Bookmark, id: 'bookmark', icon: 'bookmark', name: 'Bookmark' },
					{ type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', name: 'Code' },	
				] as any [],
			},
			{ 
				id: 'other', icon: 'other', name: 'Other', color: 'purple', children: [
					{ type: I.BlockType.Div, id: 'div', icon: 'other', name: 'Divider' },
				] as any [],
			},
		];
		
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
			let reg = new RegExp(filter, 'ig');
			let list: any[] = [];
			for (let item of options) {
				list = list.concat(item.children);
			};
			
			list = list.filter((it: any) => { return it.name.match(reg); });
			list = list.map((it: any) => { 
				it.color = '';
				it.children = [];
				return it; 
			});
			options = list;
		};
		
		const Item = (item: any) => (
			<div id={'block-add-item-' + item.id} className={[ 'item', item.color, (item.color ? 'withColor' : '') ].join(' ')} onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onSelect(e, item); }}>
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
		const { commonStore } = this.props;
		
		commonStore.filterSet('');
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
				onSelect: onSelect
			}
		});
	};
	
	onSelect (e: any, item: any) {
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