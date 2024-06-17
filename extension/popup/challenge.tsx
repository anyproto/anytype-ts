import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Error, Pin } from 'Component';
import { I, C, Storage, UtilRouter } from 'Lib';
import { extensionStore } from 'Store';
import Util from '../lib/util';

interface State {
	error: string;
};

const Challenge = observer(class Challenge extends React.Component<I.PageComponent, State> {

	ref: any = null;
	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSuccess = this.onSuccess.bind(this);
		this.onError = this.onError.bind(this);
	};

	render () {
		const { error } = this.state;

		return (
			<div className="page pageChallenge">
				<Title text="Please enter the numbers from the app" />

				<Pin 
					ref={ref => this.ref = ref}
					pinLength={4}
					focusOnMount={true}
					onSuccess={this.onSuccess} 
					onError={this.onError} 
				/>

				<Error text={error} />
			</div>
		);
	};

	onSuccess () {
		C.AccountLocalLinkSolveChallenge(extensionStore.challengeId, this.ref?.getValue().trim(), (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			const { appKey } = message;
			const { serverPort, gatewayPort } = extensionStore;

			Storage.set('appKey', appKey);

			Util.authorize(appKey, () => {
				Util.sendMessage({ type: 'initIframe', appKey, serverPort, gatewayPort }, () => {});
				Util.sendMessage({ type: 'initMenu' }, () => {});

				UtilRouter.go('/create', {});
			});
		});
	};

	onError () {
	};

});

export default Challenge;