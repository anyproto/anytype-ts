import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, Util, DataUtil, analytics } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuBlockStyle = observer(class MenuBlockStyle extends React.Component<Props, {}> {
	
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
				{item.children.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						checkbox={action.itemId == active} 
						onClick={(e: any) => { this.onClick(e, action); }} 
						onMouseEnter={(e: any) => { this.onOver(e, action); }}  
					/>
				))}
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
		this.props.setActive();
		
		this.rebind();
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
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
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockIds } = data;

		const turnText = { id: 'turnText', icon: '', name: 'Turn into text', color: '', children: DataUtil.menuGetBlockText() };
		const turnList = { id: 'turnList', icon: '', name: 'Turn into list', color: '', children: DataUtil.menuGetBlockList() };
		const turnDiv = { id: 'turnDiv', icon: '', name: 'Turn into divider', color: '', children: DataUtil.menuGetTurnDiv() };

		let hasTurnText = true;
		let hasTurnList = true;
		let hasTurnDiv = true;

		let sections: any[] = [];

		for (let id of blockIds) {
			const block = blockStore.getLeaf(rootId, id);
			if (!block) {
				continue;
			};
			if (!block.canTurnText())		 hasTurnText = false;
			if (!block.canTurnList())		 hasTurnList = false;
			if (!block.isDiv())				 hasTurnDiv = false;
		};

		if (hasTurnText)	 sections.push(turnText);
		if (hasTurnList)	 sections.push(turnList);
		if (hasTurnDiv)		 sections.push(turnDiv);
		
		return DataUtil.menuSectionsMap(sections);
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, getId, close } = this.props;
		const { data } = param;
		const { onSelect, dataset } = data;
		const { selection } = dataset || {};
		
		close();
		onSelect(item);

		analytics.event(Util.toUpperCamelCase(`${getId()}-action`), { style: item.itemId });
		
		if (selection) {
			selection.clear();
		};
	};

});

export default MenuBlockStyle;