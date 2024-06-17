import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, analytics, keyboard, Key, translate, Dataview, UtilMenu, Relation, UtilCommon } from 'Lib';
import { Label, Icon, MenuItemVertical } from 'Component';
import { blockStore, dbStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

const MenuViewLayout = observer(class MenuViewLayout extends React.Component<I.Menu> {
	
	n = -1;
	ref = null;
	isFocused = false;
	preventSaveOnClose = false;
	param: any = {};

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.menuClose = this.menuClose.bind(this);
	};

	render () {
		const isReadonly = this.isReadonly();
		const { type } = this.param;
		const sections = this.getSections();
		const layouts = UtilMenu.getViews().map((it: any) => {
			it.sectionId = 'type';
			it.icon = 'view c' + it.id;
			return it;
		});

		const Layout = (item: any) => {
			const cn = [ 'layout' ];

			if (type == item.id) {
				cn.push('active');
			};
			if (isReadonly) {
				cn.push('isReadonly');
			};

			return (
				<div 
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={this.menuClose}
				>
					<Icon className={item.icon} />
					<Label text={item.name} />
				</div>
			);
		};

		const Section = (item: any) => (
			<div id={`section-${item.id}`} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon}
							readonly={isReadonly}
							checkbox={(type == action.id) && (item.id == 'type')}
							onMouseEnter={e => this.onMouseEnter(e, action)}
							onClick={e => this.onClick(e, action)} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				<div className="layouts">
					{layouts.map((item: any, i: number) => (
						<Layout key={i} {...item} />
					))}
				</div>
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
		this.rebind();
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();

		if (!this.preventSaveOnClose) {
			this.save();
		};

		this.menuClose();
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
		const { param } = this.props;
		const { data } = param;
		const view = data.view.get();
		const item = this.getItems()[this.n];

		let ret = false;

		keyboard.shortcut('space', e, () => {
			if ([ 'hideIcon', 'coverFit' ].includes(item.id)) {
				e.preventDefault();

				this.onSwitch(e, item.id, !view[item.id]);
				ret = true;
			};
		});

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	save (withName?: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const view = data.view.get();

		if (!block || !view || this.isReadonly()) {
			return;
		};
	
		const isBoard = this.param.type == I.ViewType.Board;
		const isCalendar = this.param.type == I.ViewType.Calendar;
		const clearGroups = isBoard && this.param.groupRelationKey && (view.groupRelationKey != this.param.groupRelationKey);

		if (isCalendar && !this.param.groupRelationKey) {
			this.param.groupRelationKey = 'lastModifiedDate';
		};

		if (isBoard || isCalendar) {
			const groupOptions = Relation.getGroupOptions(rootId, blockId, this.param.type);
			if (!groupOptions.map(it => it.id).includes(this.param.groupRelationKey)) {
				if (isCalendar) {
					this.param.groupRelationKey = 'lastModifiedDate';
				} else {
					this.param.groupRelationKey = Relation.getGroupOption(rootId, blockId, this.param.type, this.param.groupRelationKey)?.id;
				};
			};
		};

		if (withName) {
			this.param.name = this.getViewName();
			view.name = this.param.name;
		};

		Dataview.viewUpdate(rootId, blockId, view.id, this.param, () => {
			if (clearGroups) {
				Dataview.groupUpdate(rootId, blockId, view.id, []);
				C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: [] }, onSave);
			} else 
			if (onSave) {
				onSave();
			};
		});

		this.forceUpdate();
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly, isInline } = data;
		const { type, coverRelationKey, cardSize, coverFit, groupRelationKey, groupBackgroundColors, hideIcon, pageLimit } = this.param;
		const isGallery = type == I.ViewType.Gallery;
		const isBoard = type == I.ViewType.Board;
		const isCalendar = type == I.ViewType.Calendar;
		const isGraph = type == I.ViewType.Graph;

		let settings: any[] = [];

		if (isGallery) {
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

		if (isBoard || isCalendar) {
			const groupOption = Relation.getGroupOption(rootId, blockId, type, groupRelationKey);
			const name = isBoard ? translate('menuDataviewViewEditGroupBy') : translate('menuDataviewViewEditDate');

			settings.push({ 
				id: 'groupRelationKey', 
				name, 
				caption: (groupOption ? groupOption.name : translate('commonSelect')), 
				arrow: true,
			});
		};

		if (isBoard) {
			settings.push({ 
				id: 'groupBackgroundColors', 
				name: translate('menuDataviewViewEditColorColumns'), 
				withSwitch: true, 
				switchValue: groupBackgroundColors,
				onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'groupBackgroundColors', v); }
			});
		};

		if (!isGraph) {
			settings.push({
				id: 'hideIcon', name: translate('menuDataviewViewEditShowIcon'), withSwitch: true, switchValue: !hideIcon,
				onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'hideIcon', !v); }
			});
		} else {
			settings.push({ id: 'graphSettings', name: translate('commonSettings'), arrow: true });
		};

		if (isInline || isBoard) {
			const options = Relation.getPageLimitOptions(type);
			settings.push({ id: 'pageLimit', name: translate('menuDataviewViewEditPageLimit'), caption: (pageLimit || options[0].id), arrow: true });
		};

		let sections: any[] = [ 
			{ id: 'settings', name: '', children: settings }
		];

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		}).filter(s => !!s.children.length);

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

	onOver (e: any, item: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const isReadonly = this.isReadonly();
		const { type, groupRelationKey } = this.param;
		const view = data.view.get();

		if (!item.arrow || isReadonly) {
			menuStore.closeAll(Constant.menuIds.viewEdit);
			return;
		};

		const element = `#${getId()} #item-${item.id}`;

		const menuParam: I.MenuParam = { 
			menuKey: item.id,
			element,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			onOpen: () => $(element).addClass('active'),
			onClose: () => $(element).removeClass('active'),
			data: {
				rebind: this.rebind,
				value: this.param[item.id],
				onSelect: (e: any, el: any) => {
					this.param[item.id] = el.id;
					this.save();
				},
			}
		};

		let menuId = '';

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
					value: Relation.getGroupOption(rootId, blockId, view.type, groupRelationKey)?.id,
					options: Relation.getGroupOptions(rootId, blockId, view.type),
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

			case 'graphSettings': {
				menuId = 'graphSettings';
				menuParam.data = Object.assign(menuParam.data, {
					storageKey: Constant.graphId.dataview,
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
		const { onSelect, isInline, getTarget } = data;
		const object = getTarget();

		if (this.isReadonly() || item.arrow) {
			return;
		};

		if (item.sectionId == 'type') {
			let withName = false;

			if (this.param.name == Dataview.defaultViewName(this.param.type)) {
				this.param.name = Dataview.defaultViewName(item.id);
				withName = true;
			};

			this.param.type = item.id;

			this.n = -1;
			this.save(withName);

			analytics.event('ChangeViewType', {
				type: item.id,
				objectType: object.type,
				embedType: analytics.embedType(isInline),
			});
		}

		if (onSelect) {
			onSelect();
		};
	};

	getViewName (name?: string) {
		return (name || this.param.name || Dataview.defaultViewName(this.param.type)).trim();
	};

	menuClose () {
		menuStore.closeAll(Constant.menuIds.viewEdit);
	};

	resize () {
		const { getId, position } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.css({ height: 'auto' });
		position();
	};

	isReadonly () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		return readonly || !allowedView;
	};
	
});

export default MenuViewLayout;
