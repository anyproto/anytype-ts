import { forwardRef, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Error } from 'Component';
import { I, C, S, U, J, Storage } from 'Lib';
import Util from '../lib/util';

const Index = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const interval = useRef<any>(0);
	const [ error, setError ] = useState('');

	const checkPorts = (onError?: () => void): void => {
		Util.sendMessage({ type: 'getPorts' }, response => {
			Util.sendMessage({ type: 'checkPorts' }, response => {
				if (!response.ports || !response.ports.length) {
					setError('Automatic pairing failed, please open the app');

					if (onError) {
						onError();
					};
					return;
				};

				Util.init(response.ports[0], response.ports[1]);
				login();

				clearInterval(interval.current);
			});
		});
	};

	const login = () => {
		const appKey = Storage.get('appKey');

		if (appKey) {
			Util.authorize(appKey, () => {
				const { serverPort, gatewayPort } = S.Extension;

				Util.sendMessage({ type: 'initIframe', appKey, serverPort, gatewayPort }, () => {});
				Util.sendMessage({ type: 'initMenu' }, () => {});

				U.Router.go('/create', {});
			}, () => {
				Storage.delete('appKey');
				login();
			});
		} else {
			/* @ts-ignore */
			const manifest = chrome.runtime.getManifest();
			const { serverPort, gatewayPort } = S.Extension;

			C.AccountLocalLinkNewChallenge(manifest.name, (message: any) => {
				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				const data = {
					serverPort,
					gatewayPort,
					challengeId: message.challengeId,
				};

				/* @ts-ignore */
				chrome.tabs.create({ url: chrome.runtime.getURL('auth/index.html') + `?data=${btoa(JSON.stringify(data))}` });
			});
		};
	};

	const onOpen = () => {
		const { serverPort, gatewayPort } = S.Extension;

		if (serverPort && gatewayPort) {
			login();
			return;
		};

		let cnt = 0;

		Util.sendMessage({ type: 'launchApp' }, response => {
			interval.current = setInterval(() => {
				checkPorts(() => {
					cnt++;

					if (cnt >= 30) {
						setError('App open failed');
						clearInterval(interval.current);
					};
				});
			}, 1000);
		});
	};

	const onDownload = () => {
		window.open(J.Url.download);
	};

	useEffect(() => {
		checkPorts();
	}, []);

	return (
		<div className="page pageIndex">
			<Label text="To save in Anytype you need to Pair with the app" />

			<div className="buttonsWrapper">
				<Button color="pink" className="c32" text="Pair with app" onClick={onOpen} />
				<Button color="blank" className="c32" text="Download app" onClick={onDownload} />
			</div>

			<Error text={error} />
		</div>
	);

}));

export default Index;