import { forwardRef, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Error, Pin } from 'Component';
import { I, C, U, Storage } from 'Lib';
import Util from '../lib/util';

const Index = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const pinRef = useRef<Pin>(null);
	const [ error, setError ] = useState('');

	const onSuccess = () => {
		const urlParams = new URLSearchParams(window.location.search);
		const data = JSON.parse(atob(urlParams.get('data') as string));

		if (!data) {
			setError('Invalid data');
			return;
		};

		Util.init(data.serverPort, data.gatewayPort);

		C.AccountLocalLinkSolveChallenge(data.challengeId, pinRef.current.getValue().trim(), (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
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

	return (
		<div className="page pageIndex">
			<Title text="Please enter the numbers from the app" />

			<Pin 
				ref={pinRef}
				pinLength={4}
				onSuccess={onSuccess} 
				onError={() => {}} 
			/>

			<Error text={error} />
		</div>
	);

}));

export default Index;