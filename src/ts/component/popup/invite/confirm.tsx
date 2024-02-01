import * as React from 'react';
import { Title, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon, UtilObject } from 'Lib';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PopupInviteConfirm = observer(class PopupInviteConfirm extends React.Component<I.Popup, State> {

	state = {
		error: '',
	};

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onReject = this.onReject.bind(this);
	};

	render() {
		const { error } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { name, icon, spaceId } = data;
		const space = UtilObject.getSpaceviewBySpaceId(spaceId);

		if (!space) {
			return null;
		};

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name, iconImage: icon, layout: I.ObjectLayout.Participant }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupInviteConfirmTitle'), name, space.name)} />

				<div className="buttons">
					<div className="sides">
						<Button onClick={() => this.onConfirm(I.ParticipantPermissions.Reader)} text={translate('popupInviteConfirmButtonConfirmReader')} className="c36" />
						<Button onClick={() => this.onConfirm(I.ParticipantPermissions.Writer)} text={translate('popupInviteConfirmButtonConfirmEditor')} className="c36" />
					</div>

					<Button onClick={this.onReject} text={translate('popupInviteConfirmButtonReject')} className="c36" color="red" />
				</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	onConfirm (permissions: I.ParticipantPermissions) {
		const { param, close } = this.props;
		const { data } = param;
		const { spaceId, identity } = data;

		if (!spaceId || !identity) {
			return;
		};

		C.SpaceRequestApprove(spaceId, identity, permissions, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			close();
		});
	};

	onReject () {
		const { param, close } = this.props;
		const { data } = param;
		const { spaceId, identity } = data;

		if (!spaceId || !identity) {
			return;
		};

		C.SpaceRequestDecline(spaceId, identity, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			close();
		});
	};

});

export default PopupInviteConfirm;
