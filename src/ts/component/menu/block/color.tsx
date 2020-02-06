import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, Key } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@inject('commonStore')
@observer
class MenuBlockColor extends React.Component<Props, {}> {
	
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { commonStore, param } = this.props;
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
						if (action.type == I.MarkType.TextColor) {
							icn.push('textColor textColor-' + action.color);
							if (action.color == valueText) {
								cn.push('active');
							};
						};
						if (action.type == I.MarkType.BgColor) {
							icn.push('bgColor bgColor-' + action.color);
							if (action.color == valueBg) {
								cn.push('active');
							};
						};
						let inner = (
							<div className={icn.join(' ')}>A</div>
						);
						
						return <MenuItemVertical id={id++} key={i} {...action} inner={inner} className={cn.join(' ')} onClick={(e: any) => { this.onClick(e, action); }} />;
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
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		const { commonStore, param } = this.props;
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
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { commonStore } = this.props;
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		const setActive = () => {
			const item = items[this.n];
			
			node.find('.item.active').removeClass('active');
			node.find('#item-' + item.id).addClass('active');
		};
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				setActive();
				break;
				
			case Key.down:
			case Key.right:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive();
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
		let id = 0;
		let sections = [
			{ 
				name: 'Text color',
				children: this.getTextColors()
			},
			{ 
				name: 'Background color',
				children: this.getBgColors(),
			},
		];
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
	
	getTextColors () {
		let items: any[] = [
			{ type: I.MarkType.TextColor, name: 'Black', color: 'black' }
		];
		for (let i in Constant.textColor) {
			items.push({ type: I.MarkType.TextColor, name: Constant.textColor[i], color: i });
		};
		return items;
	};
	
	getBgColors () {
		let items: any[] = [];
		for (let i in Constant.textColor) {
			items.push({ type: I.MarkType.BgColor, name: Constant.textColor[i], color: i });
		};
		return items;
	};
	
	onClick (e: any, item: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onChangeText, onChangeBg } = data;
		
		commonStore.menuClose(this.props.id);
		
		if (item.type == I.MarkType.TextColor) {
			onChangeText(item.color);
		};
		
		if (item.type == I.MarkType.BgColor) {
			onChangeBg(item.color);
		};
	};
	
};

export default MenuBlockColor;