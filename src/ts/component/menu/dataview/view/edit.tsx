import * as React from 'react';
import { I, C, keyboard, Key, translate, DataUtil } from 'ts/lib';
import { Input, MenuItemVertical } from 'ts/component';
import { blockStore, dbStore } from 'ts/store';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

class MenuViewEdit extends React.Component<Props, {}> {
	
	n: number = -1;
	ref: any = null;
	isFocused: boolean = false;
	timeout: number = 0;

	type: I.ViewType = I.ViewType.Grid;
	name: string = '';

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
		const { view, readOnly } = data;
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
							className={readOnly ? 'isReadonly' : ''}
							checkbox={(view.type == action.id) && (item.id == 'type')}
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				<form className="filter isName" onSubmit={this.onSubmit}>
					<div className="inner">
						<Input 
							ref={(ref: any) => { this.ref = ref; }} 
							value={view.name} 
							readOnly={readOnly}
							placeholder={translate('menuDataviewViewEditName')}
							maxLength={Constant.limit.dataview.viewName} 
							onKeyUp={this.onKeyUp} 
							onFocus={this.onNameFocus}
							onBlur={this.onNameBlur}
						/>
					</div>
					<div className="line" />
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
		this.focus();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};

	componentDidUpdate () {
		this.focus();
	};
	
	componentWillUnmount () {
		this.unbind();
		window.clearTimeout(this.timeout);
	};

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
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

		if (this.isFocused) {
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
		this.isFocused = true;
		this.props.setHover();
	};
	
	onNameBlur (e: any) {
		this.isFocused = false;
	};

	onKeyUp (e: any, v: string) {
		const { param, close } = this.props;
		const { data } = param;
		const { view } = data;

		if (!this.isFocused) {
			return;
		};

		view.name = v;
	};

	save () {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, view, onSave, readOnly } = data;

		if (readOnly) {
			return;
		};

		const cb = () => {
			if (onSave) {
				onSave();
			};
			this.forceUpdate();
		};

		if (view.id) {
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, cb);
		} else 
		if (view.name) {
			C.BlockDataviewViewCreate(rootId, blockId, view, (message: any) => {
				view.id = message.viewId;
				cb();
				close();
			});
		};
	};

	onSubmit (e: any) {
		e.preventDefault();

		window.clearTimeout(this.timeout);
		this.save();
		this.props.close();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, view, readOnly } = data;
		const views = dbStore.getViews(rootId, blockId);

		const types = DataUtil.menuGetViews().map((it: any) => {
			it.sectionId = 'type';
			it.icon = 'view c' + it.id;
			return it;
		});

		let sections: any[] = [
			{ id: 'type', name: 'View as', children: types }
		];

		if (view.id && !readOnly) {
			sections.push({
				children: [
					{ id: 'copy', icon: 'copy', name: 'Duplicate view' },
					(views.length > 1 ? { id: 'remove', icon: 'remove', name: 'Remove view' } : null),
				]
			});
		};

		sections = sections.map((s: any) => {
			s.children = s.children.filter((it: any) => { return it; });
			return s;
		});

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
		const { rootId, blockId, getData, getView, view, onSelect, onSave, readOnly } = data;
		const current = getView();

		if (readOnly) {
			return;
		};

		if (item.sectionId == 'type') {
			view.type = item.id;
			this.forceUpdate();
			this.save();
		} else 
		if (view.id) {
			close();

			switch (item.id) {
				case 'copy':
					C.BlockDataviewViewCreate(rootId, blockId, view, () => {
						if (onSave) {
							onSave();
						};
					});
					break;

				case 'remove':
					const views = dbStore.getViews(rootId, blockId);
					const filtered = views.filter((it: I.View) => { return it.id != view.id; });
					const next = filtered[filtered.length - 1];

					if (next) {
						C.BlockDataviewViewDelete(rootId, blockId, view.id, () => {
							if (current.id == view.id) {
								getData(next.id, 0);
							};
						});
					};
					break;
			};
		};

		if (onSelect) {
			onSelect();
		};
	};
	
};

export default MenuViewEdit;