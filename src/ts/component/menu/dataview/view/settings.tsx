import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, analytics, keyboard, Key, translate, Dataview, UtilMenu, Relation, UtilCommon, UtilData, UtilObject } from 'Lib';
import { InputWithLabel, MenuItemVertical } from 'Component';
import { blockStore, dbStore, detailStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

const MenuViewSettings = observer(class MenuViewSettings extends React.Component<I.Menu> {
	
	n = -1;
	refName = null;
	isFocused = false;
	preventSaveOnClose = false;
	param: any = {};
	menuContext = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onNameFocus = this.onNameFocus.bind(this);
		this.onNameBlur = this.onNameBlur.bind(this);
		this.onNameEnter = this.onNameEnter.bind(this);
	};

	render () {
		const { type, name } = this.param;
		const isReadonly = this.isReadonly();
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
							checkbox={(type == action.id) && (item.id == 'type')}
							onMouseEnter={e => this.onMouseEnter(e, action)}
							onMouseLeave={e => this.onMouseLeave(e, action)}
							onClick={e => this.onClick(e, action)} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				<div className="filter isName">
					<InputWithLabel
						ref={ref => this.refName = ref}
						value={name}
						label={translate('menuDataviewViewName')}
						readonly={isReadonly}
						placeholder={Dataview.defaultViewName(type)}
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
			if (this.refName) {
				this.refName.focus();
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
			if (n == Dataview.defaultViewName(Number(i))) {
				n = '';
				break;
			};
		};
		this.refName.setValue(n);
	};
	
	onKeyDown (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const view = data.view.get();
		const item = this.getItems()[this.n];
		const k = keyboard.eventKey(e);

		let ret = false;

		keyboard.shortcut('enter', e, () => {
			this.save(true);
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
				this.refName.blur();
				this.n = -1;
			};
		} else {
			if ((k == Key.up) && !this.n) {
				this.n = -1;
				this.refName.focus();
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
		this.save(true);
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
		const view = data.view.get();

		if (readonly || !block || !view) {
			return;
		};

		if (withName) {
			this.param.name = this.getViewName();
		};

		Dataview.viewUpdate(rootId, blockId, view.id, this.param, onSave);
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const { id, type } = this.param;
		const views = dbStore.getViews(rootId, blockId);
		const view = data.view.get();
		const isReadonly = this.isReadonly();
		const isBoard = type == I.ViewType.Board;
		const sortCnt = view.sorts.length;
		const filters = view.filters.filter(it => dbStore.getRelationByKey(it.relationKey));
		const filterCnt = filters.length;

		const relations = view.getVisibleRelations().map((it) => {
			const relation = dbStore.getRelationByKey(it.relationKey) || {};
			return relation ? UtilCommon.shorten(relation.name || '', 16) : '';
		}).filter(it => it);

		const relationCnt = relations.slice(0, 2);
		if (relations.length > 2) {
			relationCnt.push(`+${relations.length - 2}`);
		};

		const layoutSettings = [
			{ id: 'layout', name: translate('menuDataviewObjectTypeEditLayout'), subComponent: 'dataviewViewLayout', caption: Dataview.defaultViewName(type) },
			isBoard ? { id: 'group', name: translate('libDataviewGroups'), subComponent: 'dataviewGroupList' } : null,
			{ id: 'relations', name: translate('libDataviewRelations'), subComponent: 'dataviewRelationList', caption: relationCnt.join(', ') },
		];
		const tools = [
			{ id: 'filter', name: translate('menuDataviewViewFilter'), subComponent: 'dataviewFilterList', caption: filterCnt ? UtilCommon.sprintf(translate('menuDataviewViewApplied'), filterCnt) : '' },
			{ id: 'sort', name: translate('menuDataviewViewSort'), subComponent: 'dataviewSort', caption: sortCnt ? UtilCommon.sprintf(translate('menuDataviewViewApplied'), sortCnt) : '' }
		];

		let sections: any[] = [
			{ id: 'layoutSettings', name: '', children: layoutSettings },
			{ id: 'tools', name: '', children: tools }
		].filter(it => it);

		if (id && !isReadonly) {
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
			this.props.setActive(item, false);
		};
	};

	onMouseLeave (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setHover(null, false);
		};
	};

	onClick (e: any, item: any) {
		const { id, param, close, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, loadData, getView, getSources, onSelect, onSave, readonly, isInline, getTarget } = data;
		const view = data.view.get();
		const current = getView();
		const sources = getSources();
		const object = getTarget();

		if (readonly || item.arrow) {
			return;
		};

		if (item.subComponent) {
			const addParam = {
				component: item.subComponent,
				title: item.name,
				withBack: true,
				width: getSize().width,
				data: param.data,
				noAnimation: true,
				onOpen: (context) => {
					this.menuContext = context;
				}
			};

			if (item.data) {
				param.data = Object.assign(addParam.data, item.data);
			};

			menuStore.replace(id, item.subComponent, Object.assign(param, addParam));
			return;
		};

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
							embedType: analytics.embedType(isInline),
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
		return (name || this.param.name || Dataview.defaultViewName(this.param.type)).trim();
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

export default MenuViewSettings;
