import * as React from 'react';
import { observer } from 'mobx-react';
import { I, Storage } from 'Lib';
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
		});
	};

	login () {
		const appKey = Storage.get('appKey');

		if (appKey) {
			Util.authorize(appKey, () => {
				Util.sendMessage({ type: 'initMenu' }, () => {});
			}, () => Storage.delete('appKey'));
		};
	};

});

export default Index;
