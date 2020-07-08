import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, Util, DataUtil } from 'ts/lib';
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
					return <MenuItemVertical key={i} {...action} isActive={action.id == active} onClick={(e: any) => { this.onClick(e, action); }} onMouseEnter={(e: any) => { this.onOver(e, action); }}  />
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
		const block = blockStore.getLeaf(rootId, blockId);
		
		return block ? block.content.style : 0;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		this.props.setActiveItem(items[this.n], scroll);
	};
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
			return [];
		};
		
		let sections: any[] = [];
		
		if (block.isText()) {
			sections = [
				{ children: DataUtil.menuGetBlockText() },
				{ children: DataUtil.menuGetTurnPage() },
				{ children: DataUtil.menuGetBlockList() },
				{ children: DataUtil.menuGetTurnObject() },
			];
		} else
		if (block.isDiv()) {
			sections = [
				{ children: DataUtil.menuGetTurnDiv() },
			];
		} else {
			sections = [];
		};
		
		sections = sections.map((s: any, i: number) => {
			s.children = s.children.map((it: any) => {
				it.key = it.id;
				it.id = i + '-' + it.id;
				return it;
			});
			return s;
		});
		
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
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.key.toLowerCase();
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
				this.props.close();
				break;
		};
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect, dataset } = data;
		const { selection } = dataset || {};
		
		this.props.close();
		onSelect(item);
		
		if (selection) {
			selection.clear();
		};
	};

};

export default MenuBlockStyle;