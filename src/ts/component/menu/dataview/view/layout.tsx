import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, analytics, keyboard, Key, translate, Dataview, UtilMenu, Relation, UtilCommon } from 'Lib';
import { Input, MenuItemVertical } from 'Component';
import { blockStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const MenuViewLayout = observer(class MenuViewLayout extends React.Component<I.Menu> {
	
	n = -1;
	ref = null;
	isFocused = false;
	preventSaveOnClose = false;
	param: any = {};

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { readonly } = data;
		const { type } = this.param;
		const sections = this.getSections();

		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon}
							readonly={readonly}
							checkbox={(type == action.id) && (item.id == 'type')}
							onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }}
							onMouseLeave={(e: any) => { this.onMouseLeave(e, action); }}
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
		const { param } = this.props;
		const { data } = param;

		this.param = UtilCommon.objectCopy(data.view.get());
		this.forceUpdate();
		this.rebind();

		window.setTimeout(() => this.resize(), 5);
	};

	componentDidUpdate () {
		this.resize();
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		if (!this.preventSaveOnClose) {
			this.save();
		};

		menuStore.closeAll(Constant.menuIds.viewEdit);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};
	
	onKeyDown (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const view = data.view.get();
		const item = this.getItems()[this.n];
		const k = keyboard.eventKey(e);

		let ret = false;

		keyboard.shortcut('enter', e, () => {
			this.save();
			close();
			ret = true;
		});

		if (ret) {
			return;
		};

		if (this.isFocused) {
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

			keyboard.shortcut('space', e, () => {
				if ([ 'hideIcon', 'coverFit' ].includes(item.id)) {
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

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave, readonly } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (readonly || !block) {
			return;
		};

		const current = data.view.get();
		const clearGroups = (current.type == I.ViewType.Board) && this.param.groupRelationKey && (current.groupRelationKey != this.param.groupRelationKey);

		if ((this.param.type == I.ViewType.Board) && !this.param.groupRelationKey) {
			this.param.groupRelationKey = Relation.getGroupOption(rootId, blockId, this.param.groupRelationKey)?.id;
		};

		C.BlockDataviewViewUpdate(rootId, blockId, current.id, this.param, () => {
			if (clearGroups) {
				Dataview.groupUpdate(rootId, blockId, current.id, []);
				C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: current.id, groups: [] }, onSave);
			} else {
				if (onSave) {
					onSave();
				};
			};
		});

		this.forceUpdate();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly, isInline } = data;
		const { type, coverRelationKey, cardSize, coverFit, groupRelationKey, groupBackgroundColors, hideIcon, pageLimit } = this.param;
		const types = UtilMenu.getViews().map((it: any) => {
			it.sectionId = 'type';
			it.icon = 'view c' + it.id;
			return it;
		});

		let settings: any[] = [];

		if (type == I.ViewType.Gallery) {
			const coverOption = Relation.getCoverOptions(rootId, blockId).find(it => it.id == coverRelationKey);
			const sizeOption = Relation.getSizeOptions().find(it => it.id == cardSize);

			settings = settings.concat([
				{ id: 'cardSize', name: translate('menuDataviewViewEditCardSize'), caption: (sizeOption ? sizeOption.name : translate('commonSelect')), arrow: true },
				{ id: 'coverRelationKey', name: translate('menuDataviewViewEditCover'), caption: (coverOption ? coverOption.name : translate('commonSelect')), arrow: true },
				{ 
					id: 'coverFit', name: translate('menuDataviewViewEditFitMedia'), withSwitch: true, switchValue: coverFit,
					onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'coverFit', v); }
				}
			]);
		};

		if (type == I.ViewType.Board) {
			const groupOption = Relation.getGroupOption(rootId, blockId, groupRelationKey);

			settings = settings.concat([
				{ id: 'groupRelationKey', name: translate('menuDataviewViewEditGroupBy'), caption: (groupOption ? groupOption.name : translate('commonSelect')), arrow: true },
				{ 
					id: 'groupBackgroundColors', name: translate('menuDataviewViewEditColorColumns'), withSwitch: true, switchValue: groupBackgroundColors,
					onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'groupBackgroundColors', v); }
				},
			]);
		};

		settings.push({
			id: 'hideIcon', name: translate('menuDataviewViewEditShowIcon'), withSwitch: true, switchValue: !hideIcon,
			onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'hideIcon', !v); }
		});

		if (isInline || (type == I.ViewType.Board)) {
			const options = Relation.getPageLimitOptions(type);
			settings.push({ id: 'pageLimit', name: translate('menuDataviewViewEditPageLimit'), caption: (pageLimit || options[0].id), arrow: true });
		};

		let sections: any[] = [
			{ id: 'type', name: translate('menuDataviewViewEditViewAs'), children: types },
			{ id: 'settings', name: '', children: settings }
		];

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		});

		return sections;
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
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

	onMouseLeave (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setHover(null, false);
		};
	};
	
	onOver (e: any, item: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
		const { type, groupRelationKey } = this.param;

		if (!item.arrow || !allowedView) {
			menuStore.closeAll(Constant.menuIds.viewEdit);
			return;
		};

		let menuId = '';
		const menuParam: I.MenuParam = { 
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				rebind: this.rebind,
				value: this.param[item.id],
				onSelect: (e: any, el: any) => {
					this.param[item.id] = el.id;
					this.save();
				},
			}
		};

		switch (item.id) {
			case 'coverRelationKey': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: Relation.getCoverOptions(rootId, blockId),
				});
				break;
			};

			case 'groupRelationKey': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					value: Relation.getGroupOption(rootId, blockId, groupRelationKey)?.id,
					options: Relation.getGroupOptions(rootId, blockId),
				});
				break;
			};

			case 'pageLimit': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: Relation.getPageLimitOptions(type),
				});
				break;
			};

			case 'cardSize': {
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: Relation.getSizeOptions(),
				});
				break;
			};
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.viewEdit, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

	onSwitch (e: any, key: string, v: boolean) {
		this.param[key] = v;
		this.save();
	};

	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect, readonly, isInline, getTarget } = data;
		const object = getTarget();

		if (readonly || item.arrow) {
			return;
		};

		if (item.sectionId == 'type') {
			this.param.type = item.id;
			this.save();

			analytics.event('ChangeViewType', {
				type: item.id,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		}

		if (onSelect) {
			onSelect();
		};
	};

	resize () {
		const { getId, position } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.css({ height: 'auto' });
		position();
	};
	
});

export default MenuViewLayout;
