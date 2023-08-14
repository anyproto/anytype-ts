import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, analytics, keyboard, Key, translate, Dataview, UtilMenu, Relation, UtilCommon } from 'Lib';
import { Input, InputWithLabel, MenuItemVertical } from 'Component';
import { blockStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const MenuViewSettings = observer(class MenuViewSettings extends React.Component<I.Menu> {
	
	n = -1;
	ref = null;
	isFocused = false;
	preventSaveOnClose = false;
	param: any = {};

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onNameFocus = this.onNameFocus.bind(this);
		this.onNameBlur = this.onNameBlur.bind(this);
		this.onNameEnter = this.onNameEnter.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { readonly } = data;
		const { type, name } = this.param;
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
				<div className="filter isName">
					<InputWithLabel
						ref={ref => this.ref = ref}
						value={name}
						label={translate('menuDataviewViewName')}
						readonly={readonly}
						placeholder={this.defaultName(type)}
						maxLength={32}
						onKeyUp={this.onKeyUp}
						onFocus={this.onNameFocus}
						onBlur={this.onNameBlur}
						onMouseEnter={this.onNameEnter}
					/>
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
		this.setName();
		this.resize();
		this.focus();
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		if (!this.preventSaveOnClose) {
			this.save(true);
		};

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
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	setName () {
		const { name } = this.param;
		
		let n = name;
		for (const i in I.ViewType) {
			if (n == this.defaultName(Number(i))) {
				n = '';
				break;
			};
		};
		this.ref.setValue(n);
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
		};

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	onNameFocus () {
		this.n = -1;
		this.isFocused = true;
		this.props.setActive();

		menuStore.closeAll(Constant.menuIds.viewEdit);
	};
	
	onNameBlur () {
		this.isFocused = false;
	};

	onNameEnter () {
		if (!keyboard.isMouseDisabled) {
			this.n = -1;
			this.props.setHover(null, false);
			menuStore.closeAll(Constant.menuIds.viewEdit);
		};
	};

	onKeyUp (e: any, v: string) {
		if (this.isFocused) {
			this.param.name = v;
		};
	};

	save (withName?: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave, readonly } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (readonly || !block) {
			return;
		};

		const current = data.view.get();
		const clearGroups = (current.type == I.ViewType.Board) && this.param.groupRelationKey && (current.groupRelationKey != this.param.groupRelationKey);

		if (withName) {
			this.param.name = this.getViewName();
		};

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
		const { rootId, blockId, readonly } = data;
		const { id, type } = this.param;
		const views = dbStore.getViews(rootId, blockId);
		const view = data.view.get();

		const isBoard = type == I.ViewType.Board;
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => dbStore.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;

		const defaultSettings = [
			{ id: 'defaultType', name: translate('menuDataviewViewDefaultType') }
		];
		const layoutSettings = [
			{ id: 'layout', name: translate('menuDataviewObjectTypeEditLayout'), sub: 'dataviewViewLayout', caption: this.defaultName(type) },
			isBoard ? { id: 'group', name: translate('libDataviewGroups'), sub: 'dataviewGroupList' } : null,
			{ id: 'relations', name: translate('libDataviewRelations'), sub: 'dataviewRelationList' }
		];
		const tools = [
			{ id: 'filter', name: translate('menuDataviewViewFilter'), sub: 'dataviewFilterList', caption: filterCnt ? UtilCommon.sprintf(translate('menuDataviewViewApplied'), filterCnt) : '' },
			{ id: 'sort', name: translate('menuDataviewViewSort'), sub: 'dataviewSort', caption: sortCnt ? UtilCommon.sprintf(translate('menuDataviewViewApplied'), sortCnt) : '' }
		];

		let sections: any[] = [
			{ id: 'defaultSettings', name: '', children: defaultSettings },
			{ id: 'layoutSettings', name: '', children: layoutSettings },
			{ id: 'tools', name: '', children: tools }
		];

		if (id && !readonly) {
			sections.push({
				id: 'actions', children: [
					{ id: 'copy', icon: 'copy', name: translate('menuDataviewViewEditDuplicateView') },
					(views.length > 1 ? { id: 'remove', icon: 'remove', name: translate('menuDataviewViewEditRemoveView') } : null),
				]
			});
		};

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
			this.props.setActive(item, false);
		};
	};

	onMouseLeave (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setHover(null, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, close, setSub } = this.props;
		const { data } = param;
		const { rootId, blockId, loadData, getView, getSources, onSelect, onSave, readonly, isInline, getTarget } = data;
		const view = data.view.get();
		const current = getView();
		const sources = getSources();
		const object = getTarget();

		if (readonly || item.arrow) {
			return;
		};

		if (item.sub) {
			setSub({ component: item.sub, menuTitle: item.name });
			return;
		};

		if (item.sectionId == 'type') {
			let withName = false;
			if (this.param.name == this.defaultName(this.param.type)) {
				this.param.name = this.defaultName(item.id);
				withName = true;
			};
			this.param.type = item.id;
			this.save(withName);

			analytics.event('ChangeViewType', {
				type: item.id,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		} else 
		if (view.id) {
			this.preventSaveOnClose = true;
			close();

			switch (item.id) {
				case 'copy': {
					C.BlockDataviewViewCreate(rootId, blockId, { ...view, name: this.getViewName(view.name) }, sources, (message: any) => {
						if (onSave) {
							onSave();
						};

						loadData(message.viewId, 0);

						analytics.event('DuplicateView', {
							type: view.type,
							objectType: object.type,
							embedType: analytics.embedType(isInline)
						});
					});
					break;
				};

				case 'remove': {
					const views = dbStore.getViews(rootId, blockId);
					const idx = views.findIndex(it => it.id == view.id);
					const filtered = views.filter(it => it.id != view.id);
					
					let next = idx >= 0 ? filtered[idx] : filtered[0];
					if (!next) {
						next = filtered[filtered.length - 1];
					};

					if (next) {
						C.BlockDataviewViewDelete(rootId, blockId, view.id, () => {
							if (current.id == view.id) {
								loadData(next.id, 0);
							};

							analytics.event('RemoveView', {
								objectType: object.type,
								embedType: analytics.embedType(isInline)
							});
						});
					};
					break;
				};
			};
		};

		if (onSelect) {
			onSelect();
		};
	};

	getViewName (name?: string) {
		return (name || this.param.name || this.defaultName(this.param.type)).trim();
	};

	defaultName (type: I.ViewType): string {
		return translate(`viewName${type}`);
	};

	resize () {
		const { getId, position } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.css({ height: 'auto' });
		position();
	};
	
});

export default MenuViewSettings;
