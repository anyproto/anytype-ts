import * as React from 'react';
import { Title, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon, UtilObject } from 'Lib';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PopupRequestConfirm = observer(class PopupRequestConfirm extends React.Component<I.Popup, State> {

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
		const { payload } = data;
		const { identityName, identityIcon, spaceId } = payload;
		const space = UtilObject.getSpaceviewBySpaceId(spaceId);

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name: identityName, iconImage: identityIcon, layout: I.ObjectLayout.Participant }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupRequestConfirmTitle'), identityName, space.name)} />

				<div className="buttons">
					<div className="sides">
						<Button onClick={() => this.onConfirm(I.ParticipantPermissions.Reader)} text={translate('popupRequestConfirmButtonConfirmReader')} className="c36" />
						<Button onClick={() => this.onConfirm(I.ParticipantPermissions.Writer)} text={translate('popupRequestConfirmButtonConfirmEditor')} className="c36" />
					</div>
					<Button onClick={this.onReject} text={translate('popupRequestConfirmButtonReject')} className="c36" color="red" />
				</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	onConfirm (permissions: I.ParticipantPermissions) {
		const { param, close } = this.props;
		const { data } = param;
		const { payload } = data;
		const { spaceId, identity } = payload;

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
		const { payload } = data;
		const { spaceId, identity } = payload;

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

export default PopupRequestConfirm;
