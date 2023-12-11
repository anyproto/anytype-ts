import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Error } from 'Component';
import { I, C, UtilRouter, Storage, dispatcher } from 'Lib';
import { authStore, commonStore, extensionStore } from 'Store';
import Url from 'json/url.json';

import Util from '../lib/util';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		const { error } = this.state;

		return (
			<div className="page pageIndex">
				<Label text="To save in Anytype you need to Pair with the app" />

				<div className="buttons">
					<Button color="pink" className="c32" text="Pair with app" onClick={this.onLogin} />
					<Button color="blank" className="c32" text="Download app" onClick={this.onDownload} />
				</div>

				<Error text={error} />
			</div>
		);
	};

	onLogin () {
		Util.sendMessage({ type: 'getPorts' }, (response) => {
			console.log('[onLogin]', response);

			if (!response.ports || !response.ports.length) {
				this.setState({ error: 'Pairing failed' });
				return;
			};

			/* @ts-ignore */
			const manifest = chrome.runtime.getManifest();

			dispatcher.init(`http://127.0.0.1:${response.ports[1]}`);
			commonStore.gatewaySet(`http://127.0.0.1:${response.ports[2]}`);

			const token = Storage.get('token');
			if (token) {
				Util.initWithToken(token);
			} else {
				C.AccountLocalLinkNewChallenge(manifest.name, (message: any) => {
					if (message.error.code) {
						this.setState({ error: message.error.description });
						return;
					};

					extensionStore.challengeId = message.challengeId;
					UtilRouter.go('/challenge', {});
				});
			};
		});
	};

	onDownload () {
		window.open(Url.download);
	};


});

export default Index;