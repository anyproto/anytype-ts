import * as React from 'react';
import { Title, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon, UtilSpace, analytics } from 'Lib';
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
		const { icon, spaceId } = data;
		const space = UtilSpace.getSpaceviewBySpaceId(spaceId);
		const name = UtilCommon.shorten(String(data.name || translate('defaultNamePage')), 32);

		if (!space) {
			return null;
		};

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name, iconImage: icon, layout: I.ObjectLayout.Participant }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupInviteConfirmTitle'), name, UtilCommon.shorten(space.name, 32))} />

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

	componentDidMount () {
		const { error } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { route } = data;

		analytics.event('ScreenInviteConfirm', { route });
	};

	onConfirm (permissions: I.ParticipantPermissions) {
		const { param, close } = this.props;
		const { data } = param;
		const { spaceId, identity } = data;
		const permissionsMap = {
			0: 'Read',
			1: 'Write'
		};

		if (!spaceId || !identity) {
			return;
		};

		C.SpaceRequestApprove(spaceId, identity, permissions, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			analytics.event('ApproveInviteRequest', { type: permissionsMap[permissions] });

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

			analytics.event('RejectInviteRequest');

			close();
		});
	};

});

export default PopupInviteConfirm;
