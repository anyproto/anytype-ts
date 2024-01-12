import * as React from 'react';
import { observer } from 'mobx-react';
import { extensionStore } from 'Store';
import { I, C, UtilRouter, Storage } from 'Lib';

import Util from '../lib/util';

const Index = observer(class Index extends React.Component<I.PageComponent> {

	render () {
		return (
			<div className="page pageIndex" />
		);
	};

	componentDidMount(): void {
		this.getPorts();
	};

	getPorts (onError?: () => void): void {
		Util.sendMessage({ type: 'getPorts' }, response => {
			console.log('[Popup] getPorts', response);

			if (!response.ports || !response.ports.length) {
				this.setState({ error: 'Automatic pairing failed, please open the app' });

				if (onError) {
					onError();
				};
				return;
			};

			Util.init(response.ports[1], response.ports[2]);
			this.login();
		});
	};

	login () {
		const appKey = Storage.get('appKey');

		if (appKey) {
			Util.authorize(appKey, () => UtilRouter.go('/create', {}), () => {
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

});

export default Index;