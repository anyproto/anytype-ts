import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, DataUtil, Storage, keyboard } from 'ts/lib';
import { blockStore, detailStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const MenuBlockLinkSettings = observer(class MenuBlockLinkSettings extends React.Component<Props, {}> {
	
	n: number = 0;
	timeout: number = 0;

	constructor (props: any) {
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
							onClick={(e: any) => { this.onClick(e, action); }}
							onMouseEnter={(e: any) => { this.onOver(e, action); }} 
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
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
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
			menuStore.close('select');
			return;
		};

		const { getId, getSize } = this.props;
		const content = this.getContent();

		const menuParam: any = {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				rebind: this.rebind,
				value: content[item.itemId],
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
				menuParam.width = 320;
				break;

			case 'cover': 
				options = this.getCovers();
				break;

			case 'description':
				options = this.getDescriptions();
				menuParam.width = 320;
				break;
		};

		menuParam.data = Object.assign(menuParam.data, { options });

		menuStore.close('select', () => {
			window.clearTimeout(this.timeout);
			this.timeout = window.setTimeout(() => { menuStore.open('select', menuParam); }, Constant.delay.menu);
		});
	};

	getContent () {
		const { param } = this.props;
        const { data } = param;
        const { rootId, blockId } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const object = detailStore.get(rootId, block.content.targetBlockId);

        return DataUtil.checkLinkSettings(block.content, object.layout);
	};

	getStyles () {
		return [
            { id: I.LinkCardStyle.Text, name: 'Text', icon: 'style-text', description: 'An inline link matching other text' },
            { id: I.LinkCardStyle.Card, name: 'Card', icon: 'style-card', description: 'Object with icon & featured relations' },
        ].map((it: any) => {
			it.withDescription = true;
			it.icon = 'linkStyle' + it.id;
			return it;
		});
	};

	getIcons () {
		return [
			{ id: I.LinkIconSize.Small, name: 'Small' },
			{ id: I.LinkIconSize.Medium, name: 'Medium' },
		];
	};

	getCovers () {
		return [];
	};

	getDescriptions () {
		return [
			{ id: I.LinkDescription.None, name: 'None', description: 'Don\'t show description' },
			{ id: I.LinkDescription.Added, name: 'Only added', description: 'Show only added description' },
			{ id: I.LinkDescription.Content, name: 'Added & content', description: 'If there is no description, show the contents of the object' },
		].map((it: any) => {
			it.withDescription = true;
			return it;
		});
	};

	getSections () {
		const { param } = this.props;
        const { data } = param;
        const { rootId, blockId } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const object = detailStore.get(rootId, block.content.targetBlockId);
        const content = this.getContent();

        const canIcon = ![ I.ObjectLayout.Task, I.ObjectLayout.Note ].includes(object.layout);
        const canCover = ![ I.ObjectLayout.Note ].includes(object.layout) && (content.cardStyle == I.LinkCardStyle.Card);
        const canDescription = ![ I.ObjectLayout.Note ].includes(object.layout);

        const styles = this.getStyles();
		const style = styles.find(it => it.id == content.cardStyle) || styles[0];

		let icon: any = {};
        let icons: any[] = [];

		let cover: any = {};
		let covers: any[] = [];

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

		const itemStyle = { id: 'cardStyle', name: 'Preview layout', caption: style.name, withCaption: true, arrow: true };
		const itemSize = canIcon ? { id: 'iconSize', name: 'Icon size', caption: icon.name, withCaption: true, arrow: true } : null;
		const itemIcon = canIcon ? { id: 'icon', name: 'Icon', withSwitch: true, switchValue: this.hasRelationKey('icon') } : null;
		const itemCover = canCover ? { id: 'cover', name: 'Cover', withSwitch: true, switchValue: this.hasRelationKey('cover') } : null;
		const itemName = { id: 'name', name: 'Name', icon: 'relation ' + DataUtil.relationClass(I.RelationType.ShortText), withSwitch: true, switchValue: this.hasRelationKey('name') };
		const itemDescription = canDescription ? { 
			id: 'description', name: 'Description', icon: 'relation ' + DataUtil.relationClass(I.RelationType.LongText), 
			caption: description.name, withCaption: true, arrow: true
		} : null;
		const itemTags = { id: 'tag', name: 'Tags', icon: 'relation ' + DataUtil.relationClass(I.RelationType.Tag), withSwitch: true, switchValue: this.hasRelationKey('tag') };
		const itemType = { id: 'type', name: 'Object type', icon: 'relation ' + DataUtil.relationClass(I.RelationType.Object), withSwitch: true, switchValue: this.hasRelationKey('type') };

		let sections: any[] = [];
		if (style.id == I.LinkCardStyle.Text) {
			sections = [
				{ children: [ itemStyle ] }
			];
		} else {
			sections = [
				{ children: [ itemStyle, itemSize, itemIcon, itemCover ] },
				{ name: 'Featured relations', children: [ itemName, itemDescription, itemType ] },
			];
		};

		sections = sections.map((s: any) => {
			s.children = s.children.filter(it => it);
			return s;
		});
		sections = DataUtil.menuSectionsMap(sections);

		sections = sections.map((s: any) => {
			s.children = s.children.map((child: any) => {
				if (child.withSwitch) {
					child.onSwitch = (e: any, v: boolean) => {
						if (v) {
							content.relations.push(child.itemId);
						} else {
							content.relations = content.relations.filter(it => it != child.itemId);
						};
						this.save('relations', content.relations);
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
		for (let section of sections) {
			items = items.concat(section.children);
		};

		return items;
	};

	save (id: string, v: any) {
        const { param } = this.props;
        const { data } = param;
        const { rootId, blockId, blockIds } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const object = detailStore.get(rootId, block.content.targetBlockId);
        
        let content = block.content || {};
        content[id] = v;
        content = DataUtil.checkLinkSettings(content, object.layout);

		C.BlockUpdateContent(rootId, blockId, { ...block, content });

		delete(content.targetBlockId);
		Storage.set('link', content);
    };

	hasRelationKey (key: string) {
		const content = this.getContent();
		return content.relations.includes(key);
	};

});

export default MenuBlockLinkSettings;