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
        this.onCollapse = this.onCollapse.bind(this);
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
                    <div className="item" onClick={this.onCollapse}>
                        <Icon className="collapse" tooltip="Collapse sidebar" tooltipY={I.MenuDirection.Top} />
                    </div>
                ) : ''}
            </div>
		);
	};

    onCollapse (e: any) {
		e.preventDefault();
		e.stopPropagation();

		commonStore.sidebarSet({ fixed: false });
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
		DataUtil.pageCreate('', '', { isDraft: true }, I.BlockPosition.Bottom, '', {}, (message: any) => {
			DataUtil.objectOpenPopup({ id: message.targetId });
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