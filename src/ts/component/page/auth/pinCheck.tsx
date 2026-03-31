import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Frame, Title, Error, Pin, Header } from 'Component';
import { observer } from 'mobx-react';
import * as I from 'Interface';

const PageAuthPinCheck = observer(forwardRef<I.PageRef, I.PageComponent>(() => {

	const pinRef = useRef(null);
	const { pin } = S.Common;
	const [ error, setError ] = useState('');

	const focusHandler = useRef(null);

	const unbind = () => {
		if (focusHandler.current) {
			window.removeEventListener('focus', focusHandler.current);
			focusHandler.current = null;
		};
	};

	const rebind = () => {
		unbind();
		focusHandler.current = () => pinRef.current?.focus();
		window.addEventListener('focus', focusHandler.current);
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
		<>
			<Header component="authLogout" />
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
		</>
	);

}));

export default PageAuthPinCheck;