import * as React from 'react';
import { Title, Icon, Label, Button, Error } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PopupInviteRequest = observer(class PopupInviteRequest extends React.Component<I.Popup, State> {

	state = {
		error: '',
	};

	refButton = null;

	constructor (props: I.Popup) {
		super(props);

		this.onRequest = this.onRequest.bind(this);
	};

	render() {
		const { error } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { invite } = data;
		const spaceName = U.Common.shorten(String(invite.spaceName || translate('defaultNamePage')), 32);
		const creatorName = U.Common.shorten(String(invite.creatorName || translate('defaultNamePage')), 32);

		return (
			<>
				<Title text={translate('popupInviteRequestTitle')} />
				
				<div className="iconWrapper">
					<Icon />
				</div>

				<Label className="invitation" text={U.Common.sprintf(translate('popupInviteRequestText'), spaceName, creatorName)} />

				<div className="buttons">
					<Button ref={ref => this.refButton = ref} onClick={this.onRequest} text={translate('popupInviteRequestRequestToJoin')} className="c36" />
				</div>

				<div className="note">{translate('popupInviteRequestNote')}</div>

				<Error text={error} />
			</>
		);
	};

	componentDidMount(): void {
		const { param } = this.props;
		const { data } = param;
		const { route } = data;

		analytics.event('ScreenInviteRequest', { route });	
	};

	onRequest () {
		const { param, close } = this.props;
		const { account } = S.Auth;
		const { data } = param;
		const { invite, cid, key } = data;

		if (!account || this.refButton.isLoading()) {
			return;
		};

		this.refButton?.setLoading(true);

		C.SpaceJoin(account.info.networkId, invite.spaceId, cid, key, (message: any) => {
			this.refButton?.setLoading(false);

			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			close(() => {
				U.Common.onInviteRequest();
				analytics.event('ScreenRequestSent');
			});
		});
	};

});

export default PopupInviteRequest;
