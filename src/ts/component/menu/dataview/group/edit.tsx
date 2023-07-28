import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, Dataview, UtilMenu, keyboard, Relation, translate } from 'Lib';
import { MenuItemVertical } from 'Component';
import { dbStore } from 'Store';

const MenuGroupEdit = observer(class MenuGroupEdit extends React.Component<I.Menu> {
	
	color: string = null;
	isHidden = false;
	timeout = 0;
	n = -1;

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				<div className="items">
					{item.children.map((action: any, i: number) => {
						if (action.isBgColor) {
							action.inner = <div className={`inner isTag bgColor bgColor-${action.className}`} />;
							action.icon = 'color';
							action.checkbox = action.value == this.color;
						};

						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								onClick={(e: any) => { this.onClick(e, action); }}
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }}
							/>
						);
					})}
				</div>
			</div>
		);

		return (
			<div>
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, groupId } = data;
		const group = dbStore.getGroup(rootId, blockId, groupId);

		if (group) {
			this.color = group.bgColor;
			this.isHidden = group.isHidden;
		};

		this.rebind();
		this.forceUpdate();
	};

	componentDidUpdate () {
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		window.clearTimeout(this.timeout);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getSections () {
		const colors = UtilMenu.getBgColors().filter(it => it.id != 'bgColor-default');

		return [
			{ 
				children: [ 
					{ id: 'hide', icon: 'hide', name: translate(this.isHidden ? 'menuDataviewGroupEditShowColumn' : 'menuDataviewGroupEditHideColumn') }
				]
			},
			{ children: colors },
		];
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onClick (e: any, item: any) {
		if (item.isBgColor) {
			this.color = item.value;
		} else
		if (item.id == 'hide') {
			this.isHidden = !this.isHidden;
		};

		this.save();
		this.props.close();
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, groupId, getView } = data;
		const view = getView();
		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		const groups = dbStore.getGroups(rootId, blockId);
		const update: any[] = [];

		groups.forEach((it: any, i: number) => {
			const item = { ...it, groupId: it.id, index: i };
			if (it.id == groupId) {
				item.bgColor = this.color;
				item.isHidden = this.isHidden;
			};
			update.push(item);
		});

		dbStore.groupsSet(rootId, blockId, update);
		Dataview.groupUpdate(rootId, blockId, view.id, update);
		C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });

		if (!view.groupBackgroundColors && this.color) {
			C.BlockDataviewViewUpdate(rootId, blockId, view.id, { ...view, groupBackgroundColors: true });
		};

		if ([ I.RelationType.Tag, I.RelationType.Status ].includes(relation.format)) {
			const group = groups.find(it => it.id == groupId);
			const value = Relation.getArrayValue(group.value);

			if (value.length) {
				C.ObjectSetDetails(value[0], [ 
					{ key: 'relationOptionColor', value: this.color },
				]);
			};
		};

		this.forceUpdate();
	};
	
});

export default MenuGroupEdit;