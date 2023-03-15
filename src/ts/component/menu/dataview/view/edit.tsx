import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, analytics, keyboard, Key, translate, DataUtil, MenuUtil, Relation, Util } from 'Lib';
import { Input, MenuItemVertical } from 'Component';
import { blockStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const MenuViewEdit = observer(class MenuViewEdit extends React.Component<I.Menu> {
	
	n = -1;
	ref: any = null;
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
					<div className="inner">
						<Input 
							ref={ref => this.ref = ref} 
							value={name}
							readonly={readonly}
							placeholder={translate(`viewName${this.param.type}`)}
							maxLength={32} 
							onKeyUp={this.onKeyUp} 
							onFocus={this.onNameFocus}
							onBlur={this.onNameBlur}
							onMouseEnter={this.onNameEnter}
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
		const { param } = this.props;
		const { data } = param;

		this.param = Util.objectCopy(data.view.get());
		console.log('PARAM: ', this.param)
		this.forceUpdate();
		this.rebind();

		window.setTimeout(() => this.resize(), 5);
	};

	componentDidUpdate () {
		this.ref.setValue(this.param.name);
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
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
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

		keyboard.shortcut('enter', e, (pressed: string) => {
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
		this.n = -1;
		this.isFocused = true;
		this.props.setActive();

		menuStore.closeAll(Constant.menuIds.viewEdit);
	};
	
	onNameBlur (e: any) {
		this.isFocused = false;
	};

	onNameEnter (e: any) {
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

		let current = data.view.get();
		let clearGroups = (current.type == I.ViewType.Board) && this.param.groupRelationKey && (current.groupRelationKey != this.param.groupRelationKey);

		if (withName) {
			this.param.name = this.getViewName();
		};

		if ((this.param.type == I.ViewType.Board) && !this.param.groupRelationKey) {
			this.param.groupRelationKey = Relation.getGroupOption(rootId, blockId, this.param.groupRelationKey)?.id;
		};

		C.BlockDataviewViewUpdate(rootId, blockId, current.id, this.param, () => {
			if (clearGroups) {
				DataUtil.dataviewGroupUpdate(rootId, blockId, current.id, []);
				C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: current.id, groups: [] }, onSave);
			} else {
				if (onSave) {
					onSave();
				};
			};
		});

		this.forceUpdate();
	};

	getViewName () {
		const viewDefaultNames = [];

		for (let i=0;i<4;i++) {
			viewDefaultNames.push(translate(`viewName${i}`));
		};

		if (!this.param.name || viewDefaultNames.indexOf(this.param.name) > -1) {
			return translate(`viewName${this.param.type}`);
		}

		return this.param.name;
	}

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly, isInline } = data;
		const { id, type, coverRelationKey, cardSize, coverFit, groupRelationKey, groupBackgroundColors, hideIcon, pageLimit } = this.param;
		const views = dbStore.getViews(rootId, blockId);
		const types = MenuUtil.getViews().map((it: any) => {
			it.sectionId = 'type';
			it.icon = 'view c' + it.id;
			return it;
		});

		let settings: any[] = [];

		if (type == I.ViewType.Gallery) {
			const coverOption = Relation.getCoverOptions(rootId, blockId).find(it => it.id == coverRelationKey);
			const sizeOption = Relation.getSizeOptions().find(it => it.id == cardSize);

			settings = settings.concat([
				{ id: 'coverRelationKey', name: 'Cover', caption: (coverOption ? coverOption.name : 'Select'), arrow: true },
				{ id: 'cardSize', name: 'Card size', caption: (sizeOption ? sizeOption.name : 'Select'), arrow: true },
				{ 
					id: 'coverFit', name: 'Fit image', withSwitch: true, switchValue: coverFit, 
					onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'coverFit', v); }
				}
			]);
		};

		if (type == I.ViewType.Board) {
			const groupOption = Relation.getGroupOption(rootId, blockId, groupRelationKey);

			settings = settings.concat([
				{ id: 'groupRelationKey', name: 'Group by', caption: (groupOption ? groupOption.name : 'Select'), arrow: true },
				{ 
					id: 'groupBackgroundColors', name: 'Color columns', withSwitch: true, switchValue: groupBackgroundColors, 
					onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'groupBackgroundColors', v); }
				},
			]);
		};

		settings.push({
			id: 'hideIcon', name: 'Show icon', withSwitch: true, switchValue: !hideIcon,
			onSwitch: (e: any, v: boolean) => { this.onSwitch(e, 'hideIcon', !v); }
		});

		if (isInline || (type == I.ViewType.Board)) {
			const options = Relation.getPageLimitOptions(type);
			settings.push({ id: 'pageLimit', name: 'Page limit', caption: (pageLimit || options[0].id), arrow: true });
		};

		let sections: any[] = [
			{ id: 'settings', name: '', children: settings },
			{ id: 'type', name: 'View as', children: types }
		];

		if (id && !readonly) {
			sections.push({
				id: 'actions', children: [
					{ id: 'copy', icon: 'copy', name: 'Duplicate view' },
					(views.length > 1 ? { id: 'remove', icon: 'remove', name: 'Remove view' } : null),
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
		let menuParam: I.MenuParam = { 
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

			case 'pageLimit':
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: Relation.getPageLimitOptions(type),
				});
				break;

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
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, loadData, getView, getSources, onSelect, onSave, readonly, isInline, getTarget } = data;
		const view = data.view.get();
		const current = getView();
		const sources = getSources();
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
		} else 
		if (view.id) {
			this.preventSaveOnClose = true;
			close();

			switch (item.id) {
				case 'copy': {
					C.BlockDataviewViewCreate(rootId, blockId, view, sources, (message: any) => {
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
					const idx = views.findIndex((it: I.View) => { return it.id == view.id; });
					const filtered = views.filter((it: I.View) => { return it.id != view.id; });
					
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

	resize () {
		const { getId, position } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.css({ height: 'auto' });
		position();
	};
	
});

export default MenuViewEdit;