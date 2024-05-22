import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Error } from 'Component';
import { I, C, UtilRouter, Storage } from 'Lib';
import { extensionStore } from 'Store';
const Url = require('json/url.json');

import Util from '../lib/util';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	state = {
		error: '',
	};
	interval: any = 0;

	constructor (props: I.PageComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		const { error } = this.state;

		return (
			<div className="page pageIndex">
				<Label text="To save in Anytype you need to Pair with the app" />

				<div className="buttonsWrapper">
					<Button color="pink" className="c32" text="Pair with app" onClick={this.onOpen} />
					<Button color="blank" className="c32" text="Download app" onClick={this.onDownload} />
				</div>

				<Error text={error} />
			</div>
		);
	};

	componentDidMount(): void {
		this.checkPorts();
	};

	checkPorts (onError?: () => void): void {
		Util.sendMessage({ type: 'getPorts' }, response => {
			Util.sendMessage({ type: 'checkPorts' }, response => {
				if (!response.ports || !response.ports.length) {
					this.setState({ error: 'Automatic pairing failed, please open the app' });

					if (onError) {
						onError();
					};
					return;
				};

				Util.init(response.ports[0], response.ports[1]);
				this.login();

				clearInterval(this.interval);
			});
		});
	};

	login () {
		const appKey = Storage.get('appKey');

		if (appKey) {
			Util.authorize(appKey, () => {
				const { serverPort, gatewayPort } = extensionStore;

				Util.sendMessage({ type: 'initIframe', appKey, serverPort, gatewayPort }, () => {});
				Util.sendMessage({ type: 'initMenu' }, () => {});

				UtilRouter.go('/create', {});
			}, () => {
				Storage.delete('appKey');
				this.login();
			});
		} else {
			/* @ts-ignore */
			const manifest = chrome.runtime.getManifest();

			C.AccountLocalLinkNewChallenge(manifest.name, (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
					return;
				};

				extensionStore.challengeId = message.challengeId;
				UtilRouter.go('/challenge', {});
			});
		};
	};

	onOpen () {
		const { serverPort, gatewayPort } = extensionStore;

		if (serverPort && gatewayPort) {
			this.login();
			return;
		};

		let cnt = 0;

		Util.sendMessage({ type: 'launchApp' }, response => {
			this.interval = setInterval(() => {
				this.checkPorts(() => {
					cnt++;

					if (cnt >= 30) {
						this.setState({ error: 'App open failed' });

						clearInterval(this.interval);
					};
				});
			}, 1000);
		});
	};

	onDownload () {
		window.open(Url.download);
	};


});

export default Index;
