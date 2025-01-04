import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Error, Pin } from 'Component';
import { I, C, S, U, Storage } from 'Lib';
import Util from '../lib/util';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	ref: any = null;
	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSuccess = this.onSuccess.bind(this);
	};

	render () {
		const { error } = this.state;

		return (
			<div className="page pageIndex">
				<Title text="Please enter the numbers from the app" />

				<Pin 
					ref={ref => this.ref = ref}
					pinLength={4}
					onSuccess={this.onSuccess} 
					onError={() => {}} 
				/>

				<Error text={error} />
			</div>
		);
	};

	onSuccess () {
		const urlParams = new URLSearchParams(window.location.search);
		const data = JSON.parse(atob(urlParams.get('data') as string));

		if (!data) {
			this.setState({ error: 'Invalid data' });
			return;
		};

		Util.init(data.serverPort, data.gatewayPort);

		C.AccountLocalLinkSolveChallenge(data.challengeId, this.ref?.getValue().trim(), (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			const { appKey } = message;

			Storage.set('appKey', appKey);

			Util.authorize(appKey, () => {
				Util.sendMessage({ type: 'initIframe', appKey, ...data }, () => {});
				Util.sendMessage({ type: 'initMenu' }, () => {});

				U.Router.go('/success', {});
			});
		});
	};

});

export default Index;