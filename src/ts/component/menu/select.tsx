import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, Key, keyboard } from 'ts/lib';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuSelect extends React.Component<Props, {}> {

	_isMounted: boolean = false;	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { options, value } = data;
		
		return (
			<div className="items">
				{options.map((item: any, i: number) => {
					return <MenuItemVertical key={i} {...item} className={item.isInitial ? 'initial' : ''} isActive={item.id == value} onClick={(e: any) => { this.onSelect(e, item); }} onMouseEnter={(e: any) => { this.onOver(e, item); }} />
				})}
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { options, value, noKeys } = data;
		
		this._isMounted = true;
		if (!noKeys) {
			this.rebind();
		};
		
		const active = options.find((it: any) => { return it.id == value });
		if (active && !active.isInitial) {
			this.setActive(active);
		};
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
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { options } = data;
		
		return options || [];
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
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
			
			case Key.tab:
			case Key.enter:
			case Key.space:
				if (item) {
					this.onSelect(e, item);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { canSelectInitial } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};

		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect, canSelectInitial } = data;

		if (item.isInitial && !canSelectInitial) {
			return;
		};
		
		onSelect(e, item);
		this.props.close();
	};
	
};

export default MenuSelect;