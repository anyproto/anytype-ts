import * as React from 'react';
import { I, C, keyboard, Key } from 'ts/lib';
import { Input, MenuItemVertical } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class MenuViewEdit extends React.Component<Props, {}> {
	
	n: number = -1;
	ref: any = null;
	focus: boolean = false;

	constructor(props: any) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onNameFocus = this.onNameFocus.bind(this);
		this.onNameBlur = this.onNameBlur.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		const items = this.getItems();
		
		return (
			<div>
				<form className="filter" onSubmit={this.onSubmit}>
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						value={view.name} 
						placeHolder="View name" 
						maxLength={Constant.limit.dataview.viewName} 
						onKeyUp={this.onKeyUp} 
						onFocus={this.onNameFocus}
						onBlur={this.onNameBlur}
					/>
				</form>
				<div className="section">
					{items.map((action: any, i: number) => (
						<MenuItemVertical key={i} {...action} onClick={(e: any) => { this.onClick(e, action); }} onMouseEnter={(e: any) => { this.onOver(e, action); }} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.unbind();
		this.setActive();

		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		this.props.setActiveItem(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		const k = e.key.toLowerCase();

		if (this.focus) {
			if (k != Key.down) {
				return;
			};
			this.ref.blur();
			this.n = -1;
		};

		e.preventDefault();
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
				this.props.close();
				break;
		};
	};

	onNameFocus (e: any) {
		this.focus = true;
		this.props.setActiveItem();
	};
	
	onNameBlur (e: any) {
		this.focus = false;
	};

	onKeyUp (e: any, v: string) {
		if (!this.focus) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, view } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { ...view, name: v });
	};

	onSubmit (e: any) {
		e.preventDefault();
		this.props.close();
	};

	getItems () {
		return [
			{ id: 'copy', icon: 'copy', name: 'Duplicate view' },
			{ id: 'remove', icon: 'remove', name: 'Remove view' },
		];
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, view, getData } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const { content } = block;
		const { views } = content;
		const viewId = view.id;

		this.props.close();

		switch (item.id) {
			case 'copy':
				C.BlockCreateDataviewView(rootId, blockId, view);
				break;

			case 'remove':
				const filtered = views.filter((it: I.View) => { return it.id != view.id; });
				const next = filtered[filtered.length - 1];

				if (next) {
					getData(next.id, 0, () => {
						C.BlockDeleteDataviewView(rootId, blockId, viewId);
					});
				};
				break;
		};
	};
	
};

export default MenuViewEdit;