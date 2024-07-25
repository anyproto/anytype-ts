import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, keyboard, translate } from 'Lib';
import { MenuItemVertical } from 'Component';

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
								onMouseEnter={e => this.onMouseEnter(e, item)} 
								onClick={e => this.onClick(e, item)} 
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

		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
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
		const values = this.getValues();

		values[item.id] = !values[item.id];
		S.Common.graphSet(this.getKey(), values);

		this.forceUpdate();
	};

	getKey () {
		return String(this.props.param.data.storageKey);
	};

	getValues () {
		return S.Common.getGraph(this.getKey());
	};

	getSections (): any[] {
		const { config } = S.Common;
		const { param } = this.props;
		const { data } = param;
		const { allowLocal } = data;
		const values = this.getValues();

		let sections: any[] = [
			{ 
				name: translate('commonAppearance'), children: [
					{ id: 'label', name: translate('menuGraphSettingsTitles') },
					{ id: 'marker', name: translate('menuGraphSettingsArrows') },
					{ id: 'icon', name: translate('menuGraphSettingsIcons') },
					{ id: 'preview', name: translate('menuGraphSettingsPreview') },
					(config.experimental ? { id: 'cluster', name: translate('menuGraphSettingsCluster') } : null),
				] 
			},
			{ 
				name: translate('menuGraphSettingsShowOnGraph'), children: [
					{ id: 'link', name: translate('menuGraphSettingsLinks') },
					{ id: 'relation', name: translate('menuGraphSettingsRelations') },
					{ id: 'orphan', name: translate('menuGraphSettingsUnlinkedObjects') },
				] 
			},
		];

		if (allowLocal) {
			sections.push({ children: [ { id: 'local', name: translate('menuGraphSettingsLocal') } ] });
		};

		sections = sections.map(s => {
			s.children = s.children.filter(it => it).map(c => {
				c.switchValue = values[c.id];
				c.withSwitch = true;
				c.onSwitch = (e: any, v: boolean) => this.onClick(e, c);
				return c;
			});
			return s;
		});

		return sections;
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();

		let items = [];
		for (const section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	};

});

export default MenuGraphSettings;