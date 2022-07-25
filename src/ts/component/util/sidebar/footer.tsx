import * as React from 'react';
import { Icon, IconObject } from 'ts/component';
import { I, DataUtil, sidebar } from 'ts/lib';
import { blockStore, detailStore, popupStore } from 'ts/store';
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
	};

	render () {
        const profile = detailStore.get(Constant.subIds.profile, blockStore.profile);

		return (
			<div className="foot">
				<Icon inner={<IconObject object={profile} size={26} />} tooltip="Your profile" tooltipY={I.MenuDirection.Top} onClick={this.onProfile} />
				<Icon className="store" tooltip="Library" tooltipY={I.MenuDirection.Top} onClick={this.onStore} />
				<Icon className="add" tooltip="Create new object" tooltipY={I.MenuDirection.Top} onClick={this.onAdd} />
				<Icon className="settings" tooltip="Settings" tooltipY={I.MenuDirection.Top} onClick={this.onSettings} />
				<Icon className="collapse" tooltip="Collapse sidebar" tooltipY={I.MenuDirection.Top} onClick={() => { sidebar.collapse(); }} />
            </div>
		);
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
		DataUtil.pageCreate('', '', {}, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.DeleteEmpty, I.ObjectFlag.SelectType ], (message: any) => {
			DataUtil.objectOpenPopup({ id: message.targetId });
		});
	};
	
});

export default Footer;