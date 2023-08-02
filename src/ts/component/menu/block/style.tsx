import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, keyboard, UtilMenu, analytics, translate } from 'Lib';
import { blockStore } from 'Store';

const MenuBlockStyle = observer(class MenuBlockStyle extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
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
		this.rebind();
	};

	componentWillUnmount(): void {
		this.unbind();	
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};
	
	getActive (): number {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return 0;
		};

		let style = block.content.style;

		if (block.isFile()) {
			return style != I.FileStyle.Link ? I.FileStyle.Embed : I.FileStyle.Link;
		};
		
		return style;
	};
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockIds } = data;

		const turnText = { id: 'turnText', icon: '', name: translate('menuBlockStyleTurnText'), color: '', children: UtilMenu.getBlockText() };
		const turnList = { id: 'turnList', icon: '', name: translate('menuBlockStyleTurnList'), color: '', children: UtilMenu.getBlockList() };
		const turnDiv = { id: 'turnDiv', icon: '', name: translate('menuBlockStyleTurnDiv'), color: '', children: UtilMenu.getTurnDiv() };
		const turnFile = { id: 'turnFile', icon: '', name: translate('menuBlockStyleTurnFile'), color: '', children: UtilMenu.getTurnFile() };

		let hasTurnText = true;
		let hasTurnList = true;
		let hasTurnDiv = true;
		let hasTurnFile = true;
		let sections: any[] = [];

		for (let id of blockIds) {
			const block = blockStore.getLeaf(rootId, id);
			if (!block) {
				continue;
			};
			if (!block.canTurnText())		 hasTurnText = false;
			if (!block.canTurnList())		 hasTurnList = false;
			if (!block.isDiv())				 hasTurnDiv = false;
			if (!block.isFile())			 hasTurnFile = false;
		};

		if (hasTurnText)	 sections.push(turnText);
		if (hasTurnList)	 sections.push(turnList);
		if (hasTurnDiv)		 sections.push(turnDiv);
		if (hasTurnFile)     sections.push(turnFile);

		return UtilMenu.sectionsMap(sections);
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
		const { param, close, dataset } = this.props;
		const { data } = param;
		const { onSelect } = data;
		const { selection } = dataset || {};
		
		close();
		onSelect(item);

		if (selection) {
			selection.clear();
		};

		analytics.event('ChangeBlockStyle', { type: item.type, style: item.itemId });
	};

});

export default MenuBlockStyle;