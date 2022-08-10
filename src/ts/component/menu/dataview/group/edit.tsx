import * as React from 'react';
import { I, C, DataUtil, keyboard } from 'Lib';
import { MenuItemVertical } from 'Component';
import { dbStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

const MenuGroupEdit = observer(class MenuGroupEdit extends React.Component<Props, {}> {
	
	color: string = null;
	isHidden: boolean = false;
	timeout: number = 0;
	n: number = -1;

	render () {
		const { param } = this.props;
		const { data } = param;
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
		$(window).off('down.menu');
	};

	getSections () {
		const colors = DataUtil.menuGetBgColors().filter(it => it.id != 'bgColor-default');

		return [
			{ 
				children: [ 
					{ id: 'hide', icon: 'hide', name: (this.isHidden ? 'Hide column' : 'Show column') } 
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

		dbStore.groupsSet(rootId, blockId, groups);
		C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });

		this.forceUpdate();
	};
	
});

export default MenuGroupEdit;