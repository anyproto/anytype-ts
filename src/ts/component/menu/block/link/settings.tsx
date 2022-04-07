import * as React from 'react';
import { Icon, Button, MenuItemVertical } from 'ts/component';
import { I, C, DataUtil, Storage, keyboard } from 'ts/lib';
import { blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

const MenuBlockLinkSettings = observer(class MenuBlockLinkSettings extends React.Component<Props, {}> {
	
	n: number = 0;

	constructor (props: any) {
		super(props);

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
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

    setField (id: string, v: any) {
        const { param } = this.props;
        const { data } = param;
        const { rootId, blockId, blockIds } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const { content } = block;
        const object = detailStore.get(rootId, content.targetBlockId);
        const { layout } = object;
        
        let fields = block.fields || {};
        fields[id] = v;
        fields = DataUtil.checkLinkSettings(fields, layout);

        Storage.set('linkSettings', fields);
        C.BlockListSetFields(rootId, blockIds.map((it: string) => {
            return { blockId: it, fields: fields };
        }));
    };

	getStyles () {
		return [
            { id: I.LinkCardStyle.Text, name: 'Text', icon: 'style-text' },
            { id: I.LinkCardStyle.Card, name: 'Card', icon: 'style-card' },
        ];
	};

	getIcons () {
		return [
			{ id: I.LinkIconSize.Small, name: 'Small' },
			{ id: I.LinkIconSize.Medium, name: 'Medium' },
		];
	};

	getDescriptions () {
		return [
			{ id: I.LinkDescription.None, name: 'None', description: 'Don’t show description' },
			{ id: I.LinkDescription.Added, name: 'Only added', description: 'Show only added description' },
			{ id: I.LinkDescription.Content, name: 'Added & content', description: 'If there is no description, show the contents of the object' },
		];
	};

	switchField (param: any, fields: any) {
		return { 
			id: param.id, name: param.name, icon: param.icon, withSwitch: true, switchValue: fields[param.id], 
			onSwitch: () => {}, onClick: (e: any) => { this.setField(param.id, !fields[param.id]); }
		};
	};

	getSections () {
		const { param } = this.props;
        const { data } = param;
        const { rootId, blockId } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const object = detailStore.get(rootId, block.content.targetBlockId);
        const fields = DataUtil.checkLinkSettings(block.fields, object.layout);

        const canIcon = ![ I.ObjectLayout.Task, I.ObjectLayout.Note ].includes(object.layout);
        const canCover = ![ I.ObjectLayout.Note ].includes(object.layout) && (fields.style == I.LinkCardStyle.Card);
        const canDescription = ![ I.ObjectLayout.Note ].includes(object.layout);

        const styles = this.getStyles();
		const style = styles.find(it => it.id == fields.style) || styles[0];

		let icon: any = {};
        let icons: any[] = [];

		let cover: any = {};
		let covers: any[] = [];

		let description: any = {};
		let descriptions: any[] = [];

        if (canIcon) {
			icons = this.getIcons();
			icon = icons.find(it => it.id == fields.icon) || icons[0];
        };

		if (canDescription) {
			descriptions = this.getDescriptions();
			description = descriptions.find(it => it.id == fields.description) || descriptions[0];
		};

		let sections = [
			{ 
				children: [
					{ id: 'style', name: 'Preview layout', caption: style.name, withCaption: true, arrow: true },
					canIcon ? { id: 'icon', name: 'Icon', caption: icon.name, withCaption: true, arrow: true }: null,
					canCover ? { id: 'cover', name: 'Cover', caption: cover.name, withCaption: true, arrow: true }: null,
				],
			},
			{
				name: 'Featured relations',
				children: [
					this.switchField({ id: 'withName', name: 'Name', icon: 'relation ' + DataUtil.relationClass(I.RelationType.ShortText) }, fields),
					canDescription ? { 
						id: 'description', name: 'Description', icon: 'relation ' + DataUtil.relationClass(I.RelationType.LongText), 
						caption: description.name, withCaption: true, arrow: true
					} : null,
					this.switchField({ id: 'withTags', name: 'Tags', icon: 'relation ' + DataUtil.relationClass(I.RelationType.Tag) }, fields),
					this.switchField({ id: 'withType', name: 'Object type', icon: 'relation ' + DataUtil.relationClass(I.RelationType.Object) }, fields),
				],
			}
		];

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

});

export default MenuBlockLinkSettings;