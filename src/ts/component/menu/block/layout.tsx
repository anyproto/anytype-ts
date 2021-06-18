import * as React from 'react';
import { MenuItemVertical, Label } from 'ts/component';
import { blockStore } from 'ts/store';
import { I, keyboard, Key, DataUtil } from 'ts/lib';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuBlockLayout extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onResize = this.onResize.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const sections = this.getSections();

		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon || action.id}
							checkbox={action.id == value}
							onMouseEnter={(e: any) => { this.onOver(e, action); }} 
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>
					))}
				</div>
			</div>
		);
		
		return (
			<div>
				{sections.map((item: any, i: number) => (
					<Section key={i} index={i} {...item} />
				))}
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
		this.props.setHover(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.key.toLowerCase();
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
				this.props.close();
				break;
		};
	};

	getSections () {
		return [
			{ name: 'Choose layout type', children: DataUtil.menuTurnLayouts() },
			{ children: [ { id: 'resize', icon: 'resize', name: 'Set layout width' } ] }
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
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onChange } = data;

		close();

		if (item.id == 'resize') {
			this.onResize(e);
		} else {
			onChange(item.id);
		};
	};

	onResize (e: any) {
		$('#editorWrapper').addClass('isResizing');
	};
	
};

export default MenuBlockLayout;