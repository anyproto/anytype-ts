import * as React from 'react';
import { Title, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
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
		const { payload } = data;
		const { identityName, identityIcon } = payload;

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name: identityName, iconImage: identityIcon, layout: I.ObjectLayout.Human }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupInviteConfirmTitle'), identityName)} />

				<div className="buttons">
					<Button onClick={this.onReject} text={translate('popupInviteConfirmButtonReject')} className="c36" color="red" />
					<Button onClick={this.onConfirm} text={translate('popupInviteConfirmButtonConfirmEditor')} className="c36" />
				</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	onConfirm () {
		const { param } = this.props;
		const { data } = param;
		const { payload } = data;
		const { spaceId, identity } = payload;

		if (spaceId || !identity) {
			return;
		};

		C.SpaceRequestApprove(spaceId, identity, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};
		});
	};

	onReject () {
		const { param } = this.props;
		const { data } = param;
		const { payload } = data;
		const { spaceId, identity } = payload;

		if (spaceId || !identity) {
			return;
		};

		C.SpaceRequestDecline(spaceId, identity, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};
		});
	};

});

export default PopupInviteConfirm;
