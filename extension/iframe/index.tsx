import { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { I, Storage } from 'Lib';
import Util from '../lib/util';

const Index = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const getPorts = (onError?: () => void): void => {
		Util.sendMessage({ type: 'checkPorts' }, response => {
			if (!response.ports || !response.ports.length) {
				if (onError) {
					onError();
				};
				return;
			};

			Util.init(response.ports[0], response.ports[1]);
			login();
		});
	};

	const login = () => {
		const appKey = Storage.get('appKey');

		if (appKey) {
			Util.authorize(appKey, () => {
				Util.sendMessage({ type: 'initMenu' }, () => {});
			}, () => Storage.delete('appKey'));
		};
	};

	useEffect(() => {
		getPorts();
	}, []);

	return (
		<div className="page pageIndex" />
	);

}));

export default Index;