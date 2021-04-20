import * as React from 'react';
import { I, C, keyboard, Key, translate, DataUtil } from 'ts/lib';
import { Input, MenuItemVertical } from 'ts/component';
import { blockStore } from 'ts/store';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

class MenuViewEdit extends React.Component<Props, {}> {
	
	n: number = -1;
	ref: any = null;
	focus: boolean = false;
	timeout: number = 0;

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
		const { getView } = data;
		const view = getView();
		const sections = this.getSections();
		
		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return <MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon || action.id}
							checkbox={(view.type == action.id) && (item.id == 'type')}
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>;
					})}
				</div>
			</div>
		);

		return (
			<div>
				<form onSubmit={this.onSubmit}>
					<div className="sectionName">View name</div>
					<div className="inputWrap">
						<Input 
							ref={(ref: any) => { this.ref = ref; }} 
							value={view.name} 
							placeHolder={translate('menuDataviewViewEditName')}
							maxLength={Constant.limit.dataview.viewName} 
							onKeyUp={this.onKeyUp} 
							onFocus={this.onNameFocus}
							onBlur={this.onNameBlur}
						/>
					</div>
				</form>

				{sections.map((item: any, i: number) => (
					<Section key={i} index={i} {...item} />
				))}
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
		this.props.setHover(items[this.n], scroll);
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
			
			case Key.tab:
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
		this.props.setHover();
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
		const { rootId, blockId, getView } = data;
		const view = getView();

		if (v == view.name) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, { ...view, name: v });
		}, 500);
	};

	onSubmit (e: any) {
		e.preventDefault();
		this.props.close();
	};

	getSections () {
		const types = DataUtil.menuGetViews().map((it: any) => {
			it.sectionId = 'type';
			it.icon = 'view c' + it.id;
			return it;
		});
		const sections = [
			{ id: 'type', name: 'View as', children: types },
			{
				children: [
					{ id: 'copy', icon: 'copy', name: 'Duplicate view' },
					{ id: 'remove', icon: 'remove', name: 'Remove view' },
				]
			}
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
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, getData, getView, onSelect } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const { content } = block;
		const { views } = content;
		const view = getView();
		const viewId = view.id;

		close();
		if (onSelect) {
			onSelect();
		};

		if (item.sectionId == 'type') {
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, { ...view, type: item.id });
		} else {
			switch (item.id) {
				case 'copy':
					C.BlockDataviewViewCreate(rootId, blockId, view);
					break;

				case 'remove':
					const filtered = views.filter((it: I.View) => { return it.id != view.id; });
					const next = filtered[filtered.length - 1];

					if (next) {
						C.BlockDataviewViewDelete(rootId, blockId, viewId, () => {
							getData(next.id, 0);
						});
					};
					break;
			};
		};
	};
	
};

export default MenuViewEdit;