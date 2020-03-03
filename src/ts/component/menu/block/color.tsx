import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, Util, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuBlockColor extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { valueText, valueBg } = data;
		const sections = this.getSections();
		
		let id = 0;
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icn: string[] = [ 'inner' ];
						let cn = [];
						
						if (action.isTextColor) {
							icn.push('textColor textColor-' + action.value);
							if (action.value == valueText) {
								cn.push('active');
							};
						};
						
						if (action.isBgColor) {
							icn.push('bgColor bgColor-' + action.value);
							if (action.value == valueBg) {
								cn.push('active');
							};
						};
						
						let inner = (
							<div className={icn.join(' ')}>A</div>
						);
						
						return <MenuItemVertical id={id++} key={i} {...action} icon="color" inner={inner} className={cn.join(' ')} onClick={(e: any) => { this.onClick(e, action); }} onMouseEnter={(e: any) => { this.onOver(e, action); }} />;
					})}
				</div>
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
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		Util.menuSetActive(this.props.id, items[this.n], 12, scroll);
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
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
			case Key.right:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
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
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const list = blockStore.blocksGet(rootId);
		const block = list.find((it: I.Block) => { return it.id == blockId; });
		
		if (!block) {
			return [];
		};
		
		const { type, content } = block;
		
		let sections = [];
		let canColor = true;
		
		if (type != I.BlockType.Text) {
			canColor = false;
		};
		
		if ((type == I.BlockType.Text) && ([ I.TextStyle.Code, I.TextStyle.Checkbox ].indexOf(content.style) >= 0)) {
			canColor = false;
		};
		
		if (canColor) {
			sections.push({ name: 'Text color', children: DataUtil.menuGetTextColors() });
		};
		
		sections.push({ name: 'Background color', children: DataUtil.menuGetBgColors() });
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
	
	onOver (e: any, item: any) {
		if (!keyboard.mouse) {
			return;
		};
		this.setActive(item, false);
	};
	
	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChangeText, onChangeBg } = data;
		
		commonStore.menuClose(this.props.id);
		
		if (item.isTextColor) {
			onChangeText(item.value);
		};
		
		if (item.isBgColor) {
			onChangeBg(item.value);
		};
	};
	
};

export default MenuBlockColor;