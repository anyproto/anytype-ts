import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, Key, keyboard } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuBlockMention extends React.Component<Props, {}> {

	_isMounted: boolean = false;	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return <MenuItemVertical key={i} {...action} onMouseEnter={(e: any) => { this.onOver(e, action); }} onClick={(e: any) => { this.onClick(e, action); }} />;
					})}
				</div>
			</div>
		);

		return (
			<div className="items">
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getSections () {
		let id = 1;
		let pages = [
			{ id: id++, name: 'Page 1', icon: '' },
			{ id: id++, name: 'Page 2', icon: '' },
			{ id: id++, name: 'Page 3', icon: '' },
		];
		let profiles = [
			{ id: id++, name: 'Profile 1', icon: '' },
			{ id: id++, name: 'Profile 2', icon: '' },
			{ id: id++, name: 'Profile 3', icon: '' },
		];

		return [
			{ name: 'Mention a page', children: pages },
			{ name: 'Mention a profile', children: profiles },
		]
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
		};
		this.props.setActiveItem(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const k = e.which;
		
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
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
				
			case Key.escape:
				commonStore.menuClose(this.props.id);
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
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
	};
	
};

export default MenuBlockMention;