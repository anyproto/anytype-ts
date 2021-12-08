import * as React from 'react';
import { I, C, Util, keyboard, Key, translate, DataUtil } from 'ts/lib';
import { Input, MenuItemVertical } from 'ts/component';
import { blockStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

const MenuViewEdit = observer(class MenuViewEdit extends React.Component<Props> {
	
	n: number = -1;
	ref: any = null;
	isFocused: boolean = false;

	constructor(props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onNameFocus = this.onNameFocus.bind(this);
		this.onNameBlur = this.onNameBlur.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const view = data.view.get();
		const { cardSize, coverFit, hideIcon } = view;
		const sections = this.getSections();
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon || action.id}
							readonly={!allowedView}
							checkbox={(view.type == action.id) && (item.id == 'type')}
							onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }}
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				<div className="filter isName">
					<div className="inner">
						<Input 
							ref={(ref: any) => { this.ref = ref; }} 
							value={view.name} 
							readonly={!allowedView}
							placeholder={translate('menuDataviewViewEditName')}
							maxLength={Constant.limit.dataview.viewName} 
							onKeyUp={this.onKeyUp} 
							onFocus={this.onNameFocus}
							onBlur={this.onNameBlur}
						/>
					</div>
					<div className="line" />
				</div>	

				{sections.map((item: any, i: number) => (
					<Section key={i} index={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.focus();
	};

	componentDidUpdate () {
		this.props.position();
		this.props.setActive();
	};

	componentWillUnmount () {
		menuStore.closeAll(Constant.menuIds.viewEdit);
	};

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	onKeyDown (e: any) {
		const { param } = this.props;
		const { data } = param;
		const view = data.view.get();
		const item = this.getItems()[this.n];
		const k = e.key.toLowerCase();

		let ret = false;
		if (this.isFocused) {
			if (k == Key.enter) {
				this.save();
				this.props.close();
				return;
			} else
			if (k != Key.down) {
				return;
			} else {
				this.ref.blur();
				this.n = -1;
			};
		} else {
			if ((k == Key.up) && !this.n) {
				this.n = -1;
				this.ref.focus();
				return;
			};

			keyboard.shortcut('space', e, (pressed: string) => {
				if ([ 'hideIcon', 'coverFit' ].indexOf(item.id) >= 0) {
					e.preventDefault();

					this.onSwitch(e, item.id, !view[item.id]);
					ret = true;
				};
			});
		};

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	onNameFocus (e: any) {
		this.isFocused = true;
		this.props.setActive();
	};
	
	onNameBlur (e: any) {
		this.isFocused = false;
	};

	onKeyUp (e: any, v: string) {
		const { param } = this.props;
		const { data } = param;
		const view = data.view.get();

		if (!this.isFocused) {
			return;
		};

		view.name = v;
	};

	save () {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave } = data;
		const view = data.view.get();
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		if (!allowedView) {
			return;
		};

		const cb = () => {
			if (onSave) {
				onSave();
			};
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

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;
		const view = data.view.get();
		const views = dbStore.getViews(rootId, blockId);
		const fileOption = this.getFileOptions().find((it: any) => { return it.id == view.coverRelationKey; });
		const sizeOption = this.getSizeOptions().find((it: any) => { return it.id == view.cardSize; });
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		const types = DataUtil.menuGetViews().map((it: any) => {
			it.sectionId = 'type';
			it.icon = 'view c' + it.id;
			return it;
		});

		let settings: any[] = [];

		if (view.type == I.ViewType.Gallery) {
			settings = settings.concat([
				{ 
					id: 'coverRelationKey', icon: 'item-cover', name: 'Cover', caption: fileOption ? fileOption.name : 'Select',
					withCaption: true, arrow: true,
				},
				{ 
					id: 'cardSize', icon: 'item-size', name: 'Card size', caption: sizeOption ? sizeOption.name : 'Select',
					withCaption: true, arrow: true,
				},
				{
					id: 'coverFit', icon: 'item-fit', name: 'Fit image', withSwitch: true, switchValue: view.coverFit,
					onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'coverFit', v); }
				}
			]);
		};

		settings.push({
			id: 'hideIcon', icon: 'item-icon', name: 'Show icon', withSwitch: true, switchValue: !view.hideIcon,
			onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'hideIcon', !v); }
		});

		let sections: any[] = [
			{ id: 'settings', name: '', children: settings },
			{ id: 'type', name: 'View as', children: types }
		];

		if (view.id && !readonly && allowedView) {
			sections.push({
				id: 'actions', children: [
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

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.onOver(e, item);
			this.props.setActive(item, false);
		};
	};
	
	onOver (e: any, item: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const view = data.view.get();
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		menuStore.closeAll(Constant.menuIds.viewEdit);

		if (!item.arrow || !allowedView) {
			return;
		};

		let menuId = '';
		let menuParam: I.MenuParam = { 
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				rebind: this.rebind,
				value: view[item.id],
				onSelect: (e: any, el: any) => {
					view[item.id] = el.id;
					this.save();
				},
			}
		};

		switch (item.id) {
			case 'coverRelationKey':
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: this.getFileOptions(),
				});
				break;

			case 'cardSize':
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: this.getSizeOptions(),
				});
				break;
		};

		if (menuId) {
			window.setTimeout(() => { menuStore.open(menuId, menuParam); }, Constant.delay.menu);
		};
	};

	onSwitch (e: any, key: string, v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const view = data.view.get();

		view[key] = v;

		this.save();
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, getData, getView, onSelect, onSave, readonly } = data;
		const view = data.view.get();
		const current = getView();

		if (readonly || item.arrow) {
			return;
		};

		if (item.sectionId == 'type') {
			view.type = item.id;
			if (view.id) {
				this.save();
			};
		} else 
		if (view.id) {
			switch (item.id) {
				case 'copy':
					close();

					C.BlockDataviewViewCreate(rootId, blockId, view, () => {
						if (onSave) {
							onSave();
						};
					});
					break;

				case 'remove':
					close();

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

	onCoverRelation (e: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const view = data.view.get();

		menuStore.open('select', { 
			element: `#${getId()} #item-coverRelationKey`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				value: view.coverRelationKey,
				options: this.getFileOptions(),
				onSelect: (e: any, item: any) => {
					view.coverRelationKey = item.id;

					this.save();
				},
			}
		});
	};

	onCardSize (e: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const view = data.view.get();

		menuStore.open('select', { 
			element: `#${getId()} #item-cardSize`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				value: view.cardSize,
				options: this.getSizeOptions(),
				onSelect: (e, item) => {
					view.cardSize = item.id;

					this.forceUpdate();
					this.save();
				},
			}
		});
};

	getSizeOptions () {
		return [
			{ id: I.CardSize.Small, name: 'Small' },
			{ id: I.CardSize.Medium, name: 'Medium' },
			{ id: I.CardSize.Large, name: 'Large' },
		];
	};

	getFileOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const options: any[] = dbStore.getRelations(rootId, blockId).filter((it: I.Relation) => {
			return !it.isHidden && (it.format == I.RelationType.File);
		}).map((it: any) => {
			return { 
				id: it.relationKey, 
				icon: 'relation ' + DataUtil.relationClass(it.format),
				name: it.name, 
			};
		});

		return [
			{ id: '', icon: '', name: 'None' },
			{ id: 'pageCover', icon: 'image', name: 'Page cover' }
		].concat(options);
	};
	
});

export default MenuViewEdit;