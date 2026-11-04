import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { Frame, Title, Error, Pin, Header, Button } from 'Component';
import * as I from 'Interface';

const PageAuthPinCheck = forwardRef<I.PageRef, I.PageComponent>(() => {

	const pinRef = useRef(null);
	const { pin } = S.Common;
	const [ error, setError ] = useState('');
	const [ touchIdAvailable, setTouchIdAvailable ] = useState(false);
	const touchIdRef = useRef(null);

	const focusHandler = useRef(null);

	const unbind = () => {
		if (focusHandler.current) {
			U.Dom.removeEvent(window, 'focus', focusHandler.current);
			focusHandler.current = null;
		};
	};

	const rebind = () => {
		unbind();
		focusHandler.current = () => pinRef.current?.focus();
		U.Dom.addEvent(window, 'focus', focusHandler.current);
	};

	const onError = () => {
		pinRef.current?.reset();
		setError(translate('authPinCheckError'));
	};

	const onTouchId = async () => {
		if (touchIdRef.current?.isLoading()) {
			return;
		};

		touchIdRef.current?.setLoading(true);
		setError('');

		try {
			await Renderer.send('touchIdUnlock', S.Common.pinId(), S.Common.pinTime);
		} finally {
			touchIdRef.current?.setLoading(false);
			pinRef.current?.focus();
		};
	};

	const onForgot = () => {
		S.Popup.open('confirm', {
			data: {
				title: translate('authPinCheckForgotTitle'),
				text: translate('authPinCheckForgotText'),
				textConfirm: translate('commonLogout'),
				onConfirm: () => {
					S.Auth.logout(true, false);
					U.Router.go('/auth/select', { replace: true });
				},
			},
		});
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
		let disposed = false;

		Renderer.send('getTouchIdState', S.Common.pinId()).then(state => {
			if (!disposed) {
				setTouchIdAvailable(!!state?.available && !!state?.enabled);
			};
		});
		rebind();
		return () => {
			disposed = true;
			unbind();
		};
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

				<div className="buttons">
					{touchIdAvailable ? <Button ref={touchIdRef} size={36} text={translate('authPinCheckTouchId')} onClick={onTouchId} /> : null}
					<div className="small" onClick={onForgot}>{translate('authPinCheckForgot')}</div>
				</div>
			</Frame>
		</>
	);

});

export default PageAuthPinCheck;
