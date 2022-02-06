import * as React from 'react';
import { Icon, IconObject } from 'ts/component';
import { I, DataUtil, focus, keyboard } from 'ts/lib';
import { blockStore, detailStore, commonStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {};

const Constant = require('json/constant.json');

const Footer = observer(class Item extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

        this.onProfile = this.onProfile.bind(this);
        this.onStore = this.onStore.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.onSettings = this.onSettings.bind(this);
        this.onExpand = this.onExpand.bind(this);
	};

	render () {
        const { sidebar } = commonStore;
        const { fixed } = sidebar;
        const profile = detailStore.get(Constant.subIds.profile, blockStore.profile);

		return (
			<div className="foot">
                <div className="item" onClick={this.onProfile}>
					<div className="icon">
                    	<IconObject object={profile} size={26} tooltip="Your profile" tooltipY={I.MenuDirection.Top} />
					</div>
                </div>
                <div className="item" onClick={this.onStore}>
                    <Icon className="store" tooltip="Library" tooltipY={I.MenuDirection.Top} />
                </div>
                {this.canAdd() ? (
                    <div className="item" onClick={this.onAdd}>
                        <Icon className="add" tooltip="Create new object" tooltipY={I.MenuDirection.Top} />
                    </div>
                ) : ''}
                <div className="item" onClick={this.onSettings}>
                    <Icon className="settings" tooltip="Settings" tooltipY={I.MenuDirection.Top} />
                </div>
                {fixed ? (
                    <div className="item" onClick={this.onExpand}>
                        <Icon className="collapse" tooltip="Collapse sidebar" tooltipY={I.MenuDirection.Top} />
                    </div>
                ) : ''}
            </div>
		);
	};

    onExpand (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { sidebar } = commonStore;
		const fixed = !sidebar.fixed;
		const update: any = { fixed };

		if (fixed) {
			update.x = 0;
			update.y = 0;
		};

		commonStore.sidebarSet(update);
	};

    onProfile (e: any) {
		const object = detailStore.get(Constant.subIds.profile, blockStore.profile);
		DataUtil.objectOpenEvent(e, object);
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store });
	};

	onSettings (e: any) {
		popupStore.open('settings', {});
	};

	onAdd (e: any) {
		const rootId = keyboard.getRootId();
		const { focused } = focus.state;
		const root = blockStore.getLeaf(rootId, rootId);
		const canAdd = this.canAdd();

		if (!root || !canAdd) {
			return;
		};
		
		let fb = blockStore.getLeaf(rootId, focused);
		let targetId = '';
		let position = I.BlockPosition.Bottom;
		
		if (fb) {
			if (fb.isTextTitle()) {
				const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTextTitle(); });
				if (first) {
					targetId = first.id;
					position = I.BlockPosition.Top;
				};
			} else 
			if (fb.isFocusable()) {
				targetId = fb.id;
			};
		};
		
		DataUtil.pageCreate(rootId, targetId, {}, position, '', {}, (message: any) => {
			DataUtil.objectOpen({ id: message.targetId });
		});
	};

	canAdd () {
		const rootId = keyboard.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return false;
		};

		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);
		return allowed && !root.isLocked() && !root.isObjectRelation() && !root.isObjectType() && !root.isObjectSet() && !root.isObjectFileKind();
	};
	
});

export default Footer;