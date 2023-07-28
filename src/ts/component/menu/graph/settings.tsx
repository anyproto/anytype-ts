import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, keyboard, translate } from 'Lib';
import { MenuItemVertical } from 'Component';
import { commonStore } from 'Store';

const MenuGraphSettings = observer(class MenuGraphSettings extends React.Component<I.Menu> {

	n = -1;

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((item: any, i: number) => {
						return (
							<MenuItemVertical 
								key={i} 
								{...item} 
								onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
								onClick={(e: any) => { this.onClick(e, item); }} 
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
		this.rebind();
	};

	componentDidUpdate () {
		this.rebind();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();

		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, true);
		};
	};

	onClick (e: any, item: any) {
		const { graph } = commonStore;

		graph[item.id] = !graph[item.id];
		commonStore.graphSet(graph);

		this.forceUpdate();
	};

	getSections (): any[] {
		const { graph } = commonStore;

		let sections: any[] = [
			{ 
				name: translate('commonAppearance'), children: [
					{ id: 'label', name: translate('menuGraphSettingsTitles') },
					{ id: 'marker', name: translate('menuGraphSettingsArrows') },
					{ id: 'icon', name: translate('menuGraphSettingsIcons') },
				] 
			},
			{ 
				name: translate('menuGraphSettingsShowOnGraph'), children: [
					{ id: 'link', name: translate('menuGraphSettingsLinks') },
					{ id: 'relation', name: translate('menuGraphSettingsRelations') },
					{ id: 'orphan', name: translate('menuGraphSettingsUnlinkedObjects') },
				] 
			}
		];

		sections = sections.map(s => {
			s.children = s.children.map(c => {
				c.switchValue = graph[c.id];
				c.withSwitch = true;
				c.onSwitch = (e: any, v: boolean) => { this.onClick(e, c); };
				return c;
			});
			return s;
		});

		return sections;
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();

		let items = [];
		for (let section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	};

});

export default MenuGraphSettings;