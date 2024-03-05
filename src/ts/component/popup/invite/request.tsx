import * as React from 'react';
import { Title, Icon, Label, Button, Error } from 'Component';
import { I, C, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import { popupStore, authStore } from 'Store';

interface State {
	error: string;
};

const PopupInviteRequest = observer(class PopupInviteRequest extends React.Component<I.Popup, State> {

	state = {
		error: '',
	};

	refButton = null;
	invite: any = {};

	constructor (props: I.Popup) {
		super(props);

		this.onRequest = this.onRequest.bind(this);
	};

	render() {
		const { error } = this.state;

		return (
			<React.Fragment>
				<Title text={translate('popupInviteRequestTitle')} />
				
				<div className="iconWrapper">
					<Icon />
				</div>

				<Label className="invitation" text={UtilCommon.sprintf(translate('popupInviteRequestText'), this.invite.spaceName, this.invite.creatorName)} />

				<div className="buttons">
					<Button ref={ref => this.refButton = ref} onClick={this.onRequest} text={translate('popupInviteRequestRequestToJoin')} className="c36" />
				</div>

				<div className="note">{translate('popupInviteRequestNote')}</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	componentDidMount (): void {
		const { param } = this.props;
		const { data } = param;
		const { invite } = data;

		this.invite = invite;
		this.forceUpdate();
	};

	onRequest () {
		const { close } = this.props;
		const { account } = authStore;

		if (!account || this.refButton.state.isLoading) {
			return;
		};

		this.refButton.setLoading(true);

		C.SpaceJoin(account.info.networkId, this.invite.spaceId, this.invite.cid, this.invite.key, (message: any) => {
			this.refButton.setLoading(false);

			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			close(() => {
				popupStore.open('confirm', {
					data: {
						title: translate('popupInviteInviteConfirmTitle'),
						text: translate('popupInviteInviteConfirmText'),
						textConfirm: translate('commonDone'),
						canCancel: false,
					},
				});
			});
		});
	};

});

export default PopupInviteRequest;