import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, S, U, keyboard, analytics, translate } from 'Lib';

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
						onClick={e => this.onClick(e, action)} 
						onMouseEnter={e => this.onOver(e, action)}  
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};
	
	getActive (): number {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = S.Block.getLeaf(rootId, blockId);

		if (!block) {
			return 0;
		};

		const style = block.content.style;

		if (block.isFile()) {
			return style != I.FileStyle.Link ? I.FileStyle.Embed : I.FileStyle.Link;
		};
		
		return style;
	};
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockIds } = data;

		const turnText = { id: 'turnText', icon: '', name: translate('menuBlockStyleTurnText'), color: '', children: U.Menu.getBlockText() };
		const turnList = { id: 'turnList', icon: '', name: translate('menuBlockStyleTurnList'), color: '', children: U.Menu.getBlockList() };
		const turnDiv = { id: 'turnDiv', icon: '', name: translate('menuBlockStyleTurnDiv'), color: '', children: U.Menu.getTurnDiv() };
		const turnFile = { id: 'turnFile', icon: '', name: translate('menuBlockStyleTurnFile'), color: '', children: U.Menu.getTurnFile() };

		let hasTurnText = true;
		let hasTurnList = true;
		let hasTurnDiv = true;
		let hasTurnFile = true;
		const sections: any[] = [];

		for (const id of blockIds) {
			const block = S.Block.getLeaf(rootId, id);
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
		if (hasTurnFile) sections.push(turnFile);

		return U.Menu.sectionsMap(sections);
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
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
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;
		const selection = S.Common.getRef('selectionProvider');
		
		close();
		onSelect(item);

		selection?.clear();
		analytics.event('ChangeBlockStyle', { type: item.type, style: item.itemId });
	};

});

export default MenuBlockStyle;