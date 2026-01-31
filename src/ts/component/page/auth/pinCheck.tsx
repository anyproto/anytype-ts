import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Frame, Title, Error, Pin } from 'Component';
import { I, S, U, translate, keyboard } from 'Lib';
import { observer } from 'mobx-react';

const PageAuthPinCheck = observer(forwardRef<I.PageRef, I.PageComponent>(() => {

	const pinRef = useRef(null);
	const { pin } = S.Common;
	const [ error, setError ] = useState('');

	const unbind = () => {
		$(window).off('focus.pin');
	};

	const rebind = () => {
		unbind();
		$(window).on('focus.pin', () => pinRef.current?.focus());
	};

	const onError = () => {
		pinRef.current?.reset();
		setError(translate('authPinCheckError'));
	};

	const onSuccess = () => {
		const { account } = S.Auth;
		const { redirect } = S.Common;

		keyboard.setPinChecked(true);

		if (account) {
			redirect ? U.Router.go(redirect, {}) : U.Space.openDashboard();
		} else {
			U.Router.go('/auth/select', { replace: true });
		};

		S.Common.redirectSet('');
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	return (
		<Frame>
			<Title text={translate('authPinCheckTitle')} />
			<Pin 
				ref={pinRef}
				expectedPin={pin} 
				onSuccess={onSuccess} 
				onError={onError} 
			/>
			<Error text={error} />
		</Frame>
	);

}));

export default PageAuthPinCheck;