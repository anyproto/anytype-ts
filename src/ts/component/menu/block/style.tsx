import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, Util, dispatcher } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuBlockStyle extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const sections = this.getSections();
		const active = this.getActive();
		
		const Section = (item: any) => (
			<div className="section">
				{item.children.map((action: any, i: number) => {
					let cn = [];
					if (item.color) {
						cn.push(item.color + ' withColor');
					};
					if (action.id == active) {
						cn.push('active');
					};
					return <MenuItemVertical key={i} {...action} className={cn.join(' ')} onClick={(e: any) => { this.onClick(e, action); }} onMouseEnter={(e: any) => { this.onOver(e, action); }}  />;
				})}
			</div>
		);
		
		return (
			<div>
				{sections.map((section: any, i: number) => {
					return <Section key={i} {...section} />;
				})}
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems();
		const active = this.getActive();

		this.n = items.findIndex((it: any) => { return it.id == active; });
		this.unbind();
		this.setActive();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	getActive () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const { blocks } = blockStore;
		const block = (blocks[rootId] || []).find((it: I.Block) => { return it.id == blockId; });
		return block ? block.content.style : 0;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		Util.menuSetActive(this.props.id, items[this.n], 12, scroll);
	};
	
	getSections () {
		return [
			{ 
				color: 'yellow',
				children: [
					{ type: I.BlockType.Text, id: I.TextStyle.Paragraph, icon: 'text', name: 'Text' },
					{ type: I.BlockType.Text, id: I.TextStyle.Header1, icon: 'header1', name: 'Header 1' },
					{ type: I.BlockType.Text, id: I.TextStyle.Header2, icon: 'header2', name: 'Header 2' },
					{ type: I.BlockType.Text, id: I.TextStyle.Header3, icon: 'header3', name: 'Header 3' },
					{ type: I.BlockType.Text, id: I.TextStyle.Quote, icon: 'quote', name: 'Highlighted' },
				] as any [],
			},
			{ 
				color: 'green',
				children: [
					{ type: I.BlockType.Text, id: I.TextStyle.Checkbox, icon: 'checkbox', name: 'Checkbox' },
					{ type: I.BlockType.Text, id: I.TextStyle.Bulleted, icon: 'list', name: 'Bulleted list' },
					{ type: I.BlockType.Text, id: I.TextStyle.Numbered, icon: 'numbered', name: 'Numbered list' },
					{ type: I.BlockType.Text, id: I.TextStyle.Toggle, icon: 'toggle', name: 'Toggle' },
				] as any [],
			},
			{ 
				color: 'blue',
				children: [ { type: I.BlockType.Page, icon: 'page', name: 'Page' } ] as any [],
			},
			{ 
				color: 'red',
				children: [ { type: I.BlockType.Text, id: I.TextStyle.Code, icon: 'code', name: 'Code snippet' } ] as any [],
			},
		];
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
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, item);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, item);
				break;
				
			case Key.enter:
			case Key.space:
				if (item) {
					this.onClick(e, item);
				};
				break;
			
			case Key.left:	
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.mouse) {
			return;
		};
		this.setActive(item, false);
	};
	
	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(item);
	};

};

export default MenuBlockStyle;