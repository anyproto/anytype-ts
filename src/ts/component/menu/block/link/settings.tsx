import * as React from 'react';
import { Icon, Switch, Button } from 'ts/component';
import { I, C, DataUtil, Storage } from 'ts/lib';
import { blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

const MenuBlockLinkSettings = observer(class MenuBlockLinkSettings extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};

	render () {
        const { param } = this.props;
        const { data } = param;
        const { rootId, blockId } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const { content } = block;
        const object = detailStore.get(rootId, content.targetBlockId);
        const { layout } = object;
        const fields = DataUtil.checkLinkSettings(block.fields, layout);

        const styles: any[] = [
            { id: I.LinkCardStyle.Text, name: 'Text', icon: 'style-text' },
            { id: I.LinkCardStyle.Card, name: 'Card', icon: 'style-card' },
        ];

        let buttons: any[] = [
            { id: I.LinkIconSize.Small, name: 'S' },
            { id: I.LinkIconSize.Medium, name: 'M' },
            { id: I.LinkIconSize.Large, name: 'L' },
        ];
        if (object.layout == I.ObjectLayout.Task) {
            buttons = [];
        };

        const Item = (item: any) => (
            <div className="item">
                <span className="clickable" onClick={(e: any) => {  }}>
                    <Icon className={item.icon} />
                    <div className="name">{item.name}</div>
                </span>
                <Switch 
                    value={fields[item.id]} 
                    onChange={(e: any, v: boolean) => { this.setField(item.id, !fields[item.id]); }} 
                />
            </div>
        );

        return (
            <div>
                <div className="section card">
                    <div className="name">Choose layout preview</div>
                    <div className="items">
                        {styles.map((item: any, i: number) => (
                            <div 
                                key={i} 
                                className={[ 'item', (item.id == fields.style ? 'active' : '') ].join(' ')} 
                                onClick={() => { this.setField('style', item.id); }}
                            >
                                <div className="txt">
                                    <Icon className={item.icon} />
                                    <div className="name">{item.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="section settings">
                    <div className="name">Show / Hide on preview</div>
                    
                    <div className="items">
                        <Item id="withIcon" name="Icon" icon="item-icon" />
                        {fields.style == I.LinkCardStyle.Card ? (
                            <Item id="withCover" name="Cover" icon="item-cover" />
                        ) : ''}
                    </div>

                    {buttons.length ? (
                        <div className="buttons">
                            {buttons.map((item: any, i: number) => (
                                <Button 
                                    key={i} 
                                    text={item.name} 
                                    color={item.id == fields.iconSize ? 'orange' : 'grey'}
                                    onClick={() => { this.setField('iconSize', item.id); }} 
                                />
                            ))}
                        </div>
                    ) : ''}

                    <div className="items">
                        <Item 
                            id="withName" 
                            icon={'relation ' + DataUtil.relationClass(I.RelationType.LongText)} 
                            name="Name" 
                            onClick={() => { this.setField('withName', true); }} 
                        />
                        <Item 
                            id="withDescription" 
                            icon={'relation ' + DataUtil.relationClass(I.RelationType.LongText)} 
                            name="Description" 
                            onClick={() => { this.setField('withDescription', true); }} 
                        />
                    </div>
                </div>
            </div>
        );
	};
	
	componentDidMount () {
		this.rebind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

    setField (id: string, v: any) {
        const { param } = this.props;
        const { data } = param;
        const { rootId, blockId } = data;
        const block = blockStore.getLeaf(rootId, blockId);
        const { content } = block;
        const object = detailStore.get(rootId, content.targetBlockId);
        const { layout } = object;
        
        let fields = block.fields || {};
        fields[id] = v;
        fields = DataUtil.checkLinkSettings(fields, layout);

        Storage.set('linkSettings', fields);
        C.BlockListSetFields(rootId, [ { blockId: blockId, fields: fields } ]);        
    };

});

export default MenuBlockLinkSettings;