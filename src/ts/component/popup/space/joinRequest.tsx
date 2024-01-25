import * as React from 'react';
import { Title, Icon, Label, Button, Error } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import { popupStore } from 'Store';

interface State {
	error: string;
};

const PopupSpaceJoinRequest = observer(class PopupSpaceJoinRequest extends React.Component<I.Popup, State> {

	state = {
		error: '',
	};
	invite = {
		spaceName: '',
		creatorName: '',
		spaceId: '',
	};

	constructor (props: I.Popup) {
		super(props);

		this.onRequest = this.onRequest.bind(this);
	};

	render() {
		const { error } = this.state;

		return (
			<React.Fragment>
				<Title text={translate('popupSpaceJoinRequestTitle')} />
				
				<div className="iconWrapper">
					<Icon />
				</div>

				<Label className="invitation" text={UtilCommon.sprintf(translate('popupSpaceJoinRequestText'), this.invite.spaceName, this.invite.creatorName)} />

				<div className="buttons">
					<Button onClick={this.onRequest} text={translate('popupSpaceJoinRequestRequestToJoin')} className="c36" />
				</div>

				<div className="note">{translate('popupSpaceJoinRequestNote')}</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	componentDidMount (): void {
		const { param } = this.props;
		const { data } = param;
		const { cid, key } = data;

		C.SpaceInviteView(cid, key, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			this.invite = message;
			this.forceUpdate();
		});
	};

	onRequest () {
		const { param } = this.props;
		const { data } = param;
		const { cid, key } = data;

		C.SpaceJoin('', this.invite.spaceId, cid, key, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			popupStore.open('confirm', {
				data: {
					title: translate('popupSpaceJoinRequestConfirmTitle'),
					text: translate('popupSpaceJoinRequestConfirmText'),
					textConfirm: translate('commonDone'),
					canCancel: false,
				},
			});
		});
	};

});

export default PopupSpaceJoinRequest;