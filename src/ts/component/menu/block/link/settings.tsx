import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, J, keyboard, Relation, translate } from 'Lib';

const MenuBlockLinkSettings = observer(class MenuBlockLinkSettings extends React.Component<I.Menu> {
	
	n = -1;
	timeout = 0;

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
	};

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i}
							{...action}
							onClick={e => this.onClick(e, action)}
							onMouseEnter={e => this.onOver(e, action)} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				{sections.map((section: any, i: number) => (
					<Section key={i} {...section} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
		this.props.position();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onClick (e: any, item: any) {
		if (item.withSwitch) {
			item.onSwitch(e, !this.hasRelationKey(item.itemId));
		} else 
		if (item.arrow) {
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (!item.arrow) {
			S.Menu.close('select');
			return;
		};

		const { id, getId, getSize, param } = this.props;
		const { className, classNameWrap } = param;
		const content = this.getContent();
		const menuId = 'select';

		const menuParam: any = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			rebind: this.rebind,
			parentId: id,
			className,
			classNameWrap,
			data: {
				value: String(content[item.itemId]),
				options: [],
				onSelect: (e: any, el: any) => {
					this.save(item.itemId, el.id);
				},
			},
		};

		let options: any[] = [];

		switch (item.itemId) {
			case 'iconSize':
				options = this.getIcons();
				break;

			case 'cardStyle':
				options = this.getStyles();
				break;

			case 'cover': 
				options = this.getCovers();
				break;

			case 'description':
				options = this.getDescriptions();
				break;
		};

		options = U.Menu.prepareForSelect(options);
		menuParam.data = Object.assign(menuParam.data, { options });

		if (!S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.object, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	getContent (): any {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const block = S.Block.getLeaf(rootId, blockId);
		
		if (!block) {
			return {};
		};

		const object = S.Detail.get(rootId, block.getTargetObjectId());

		return U.Data.checkLinkSettings(block.content, object.layout);
	};

	getStyles () {
		return [
			{ id: I.LinkCardStyle.Text, name: translate('menuBlockLinkSettingsStyleText'), icon: 'style-text' },
			{ id: I.LinkCardStyle.Card, name: translate('menuBlockLinkSettingsStyleCard'), icon: 'style-card' },
		].map((it: any) => {
			it.icon = 'linkStyle' + it.id;
			return it;
		});
	};

	getIcons () {
		return [
			{ id: I.LinkIconSize.None, name: translate('commonNone') },
			{ id: I.LinkIconSize.Small, name: translate('menuBlockLinkSettingsSizeSmall') },
			{ id: I.LinkIconSize.Medium, name: translate('menuBlockLinkSettingsSizeMedium') },
		];
	};

	getCovers () {
		return [];
	};

	getDescriptions () {
		return [
			{ id: I.LinkDescription.None, name: translate('commonNone') },
			{ id: I.LinkDescription.Added, name: translate('menuBlockLinkSettingsDescriptionRelationDescription') },
			{ id: I.LinkDescription.Content, name: translate('menuBlockLinkSettingsDescriptionContentPreview') },
		];
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const block = S.Block.getLeaf(rootId, blockId);

		if (!block) {
			return [];
		};

		const object = S.Detail.get(rootId, block.getTargetObjectId());
		const content = this.getContent();
		const isCard = content.cardStyle == I.LinkCardStyle.Card;
		const isText = content.cardStyle == I.LinkCardStyle.Text;
		const isTask = U.Object.isTaskLayout(object.layout);
		const isNote = U.Object.isNoteLayout(object.layout);

		const canIcon = !isTask && !isNote;
		const canIconSize = canIcon && isCard;
		const canIconSwitch = canIcon && isText;
		const canCover = !isNote && isCard;
		const canDescription = !isNote;

		const styles = this.getStyles();
		const style = styles.find(it => it.id == content.cardStyle) || styles[0];

		let icon: any = {};
		let icons: any[] = [];

		let description: any = {};
		let descriptions: any[] = [];

		if (canIcon) {
			icons = this.getIcons();
			icon = icons.find(it => it.id == content.iconSize) || icons[0];
		};

		if (canDescription) {
			descriptions = this.getDescriptions();
			description = descriptions.find(it => it.id == content.description) || descriptions[0];
		};

		const itemStyle = { id: 'cardStyle', name: translate('menuBlockLinkSettingsPreviewLayout'), caption: style.name, arrow: true };
		const itemIconSize = canIconSize ? { id: 'iconSize', name: translate('commonIcon'), caption: icon.name, arrow: true } : null;
		const itemIconSwitch = canIconSwitch ? { id: 'iconSwitch', name: translate('commonIcon'), withSwitch: true, switchValue: (icon.id != I.LinkIconSize.None) } : null;
		const itemCover = canCover ? { id: 'cover', name: translate('menuBlockLinkSettingsCover'), withSwitch: true, switchValue: this.hasRelationKey('cover') } : null;
		const itemName = { id: 'name', name: translate('menuBlockLinkSettingsName'), icon: 'relation ' + Relation.className(I.RelationType.ShortText) };
		const itemDescription = canDescription ? { 
			id: 'description', name: translate('menuBlockLinkSettingsDescription'), icon: 'relation ' + Relation.className(I.RelationType.LongText),
			caption: description.name, arrow: true
		} : null;
		const itemType = { id: 'type', name: translate('commonObjectType'), icon: 'relation ' + Relation.className(I.RelationType.Object), withSwitch: true, switchValue: this.hasRelationKey('type') };

		let sections: any[] = [
			{ children: [ itemStyle, itemIconSize, itemIconSwitch, itemCover ] },
			{ name: translate('menuBlockLinkSettingsAttributes'), children: [ itemName, itemDescription, itemType ] },
		];

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		});
		sections = U.Menu.sectionsMap(sections);

		sections = sections.map((s: any) => {
			s.children = s.children.map((child: any) => {
				if (child.withSwitch) {
					child.onSwitch = (e: any, v: boolean) => {
						let key = '';

						if (child.itemId == 'iconSwitch') {
							content.iconSize = v ? I.LinkIconSize.Small : I.LinkIconSize.None;
							key = 'iconSize';
						} else {
							content.relations = v ? content.relations.concat([ child.itemId ]) : content.relations.filter(it => it != child.itemId);
							key = 'relations';
						};

						this.save(key, content[key]);
					};
				};
				return child;
			});
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

	save (id: string, v: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, blockIds } = data;
		const block = S.Block.getLeaf(rootId, blockId);
		
		if (!block) {
			return;
		};

		const content = U.Common.objectCopy(block.content || {});

		content[id] = v;
		C.BlockLinkListSetAppearance(rootId, blockIds, content.iconSize, content.cardStyle, content.description, content.relations);
	};

	hasRelationKey (key: string) {
		const content = this.getContent();
		return content.relations.includes(key);
	};

});

export default MenuBlockLinkSettings;