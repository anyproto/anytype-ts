import * as React from 'react';
import { Title, Label, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon, UtilObject } from 'Lib';
import { observer } from 'mobx-react';
import { popupStore, authStore } from 'Store';
import { SpaceRequestApprove } from 'Lib/api/command';

interface State {
	error: string;
};

const PopupInviteConfirm = observer(class PopupInviteConfirm extends React.Component<I.Popup, State> {

	state = {
		error: '',
	};
	request = {
		identity: '',
		name: 'User Name',
		icon: '',
		message: 'Hi Zhanna. It’s Merk, you sent me the link. Have a great day.',
	};

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onReject = this.onReject.bind(this);
	};

	render() {
		const { error } = this.state;
		const { name, icon, message } = this.request;

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name, icon, layout: I.ObjectLayout.Human }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupInviteConfirmTitle'), name)} />

				{message ? <Label className="invitation" text={message} /> : ''}

				<div className="buttons">
					<Button onClick={this.onReject} text={translate('popupInviteConfirmButtonReject')} className="c36" color="red" />
					<Button onClick={this.onConfirm} text={translate('popupInviteConfirmButtonConfirmEditor')} className="c36" />
				</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	onConfirm () {
		const space = UtilObject.getSpaceview();
		const { identity } = this.request;

		if (!space || !space.spaceId || !identity) {
			return;
		};

		C.SpaceRequestApprove(space.spaceId, identity, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};
		});
	};

	onReject () {
		const space = UtilObject.getSpaceview();
		const { identity } = this.request;

		if (!space || !space.spaceId || !identity) {
			return;
		};

		C.SpaceRequestDecline(space.spaceId, identity, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};
		});
	};

});

export default PopupInviteConfirm;
